import asyncio
import json
import os
import random
import re
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path

from playwright.async_api import async_playwright
from supabase import create_client, Client
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.table import Table

from web_scanner import WebScanner, ScanResult
from form_filler import FormFiller, fill_single_form, HEBREW_PITCH_TEMPLATE, ENGLISH_PITCH_TEMPLATE
from models import Lead, LeadStatus, Language, Communication, ScanQueueItem

console = Console()

BASE_DIR = Path(__file__).parent.parent
CONFIG_PATH = BASE_DIR / "config.json"

with open(CONFIG_PATH) as f:
    config = json.load(f)

SUPABASE_URL = config["supabase"]["url"]
SUPABASE_KEY = config["supabase"]["service_role_key"]
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

REPORT_BASE_URL = os.getenv("REPORT_BASE_URL", "https://accessishield.io/report")


def extract_domain(url: str) -> str:
    url = url.replace("https://", "").replace("http://", "").replace("www.", "")
    return url.split("/")[0].split("?")[0]


def extract_business_name(url: str, page_title: str = "") -> str:
    domain = extract_domain(url)
    name = domain.split(".")[0]
    name = re.sub(r'[-_]', ' ', name).title()
    return name


def detect_language(url: str, page_content: str = "") -> Language:
    hebrew_indicators = ['בעברית', 'צור קשר', 'אודות', 'שירותים', 'מחירים', 'בלוג', 'מאמרים']
    english_indicators = ['contact', 'about', 'services', 'pricing', 'blog', 'articles']
    
    content_lower = (url + " " + page_content).lower()
    
    he_score = sum(1 for w in hebrew_indicators if w in content_lower)
    en_score = sum(1 for w in english_indicators if w in content_lower)
    
    if he_score > en_score:
        return Language.HE
    elif en_score > he_score:
        return Language.EN
    return Language.UNKNOWN


def get_top_3_violations(violations: List[Any]) -> List[Dict[str, Any]]:
    impact_order = {"critical": 4, "serious": 3, "moderate": 2, "minor": 1}
    sorted_violations = sorted(
        violations,
        key=lambda v: impact_order.get(v.impact, 0),
        reverse=True
    )
    return [
        {
            "id": v.id,
            "impact": v.impact,
            "description": v.description,
            "help": v.help,
            "help_url": v.help_url,
            "nodes_count": len(v.nodes)
        }
        for v in sorted_violations[:3]
    ]


async def search_businesses(query: str, max_results: int = 20) -> List[str]:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        urls = []
        
        try:
            search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
            await page.goto(search_url, wait_until="networkidle")
            
            await page.wait_for_selector('div.g', timeout=10000)
            
            links = await page.query_selector_all('div.g a[href^="http"]')
            for link in links[:max_results]:
                href = await link.get_attribute('href')
                if href and 'google.com' not in href and 'youtube.com' not in href:
                    urls.append(href)
                    
        except Exception as e:
            console.log(f"[red]Search error for '{query}':[/red] {e}")
        finally:
            await browser.close()
        
        return list(dict.fromkeys(urls))[:max_results]


async def process_single_site(
    scanner: WebScanner,
    filler: FormFiller,
    url: str,
    query_source: str
) -> Optional[Lead]:
    domain = extract_domain(url)
    
    existing = supabase.table("leads").select("id, status").eq("domain", domain).execute()
    if existing.data:
        console.log(f"[yellow]Already processed:[/yellow] {domain} (status: {existing.data[0]['status']})")
        return None
    
    console.log(f"[cyan]Processing:[/cyan] {url}")
    
    scan_result = await scanner.scan(url)
    
    if scan_result.error:
        lead = Lead(
            domain=domain,
            business_name=extract_business_name(url),
            status=LeadStatus.ERROR,
            scan_result=scan_result.model_dump()
        )
        supabase.table("leads").insert(lead.model_dump(exclude_none=True)).execute()
        return lead
    
    if scan_result.violations_count == 0:
        lead = Lead(
            domain=domain,
            business_name=extract_business_name(url),
            detected_violations_count=0,
            status=LeadStatus.SCANNED,
            scan_result=scan_result.model_dump()
        )
        supabase.table("leads").insert(lead.model_dump(exclude_none=True)).execute()
        console.log(f"[green]No violations:[/green] {domain}")
        return lead
    
    contact_form_url = await scanner.find_contact_form(url)
    
    if not contact_form_url:
        lead = Lead(
            domain=domain,
            business_name=extract_business_name(url),
            detected_violations_count=scan_result.violations_count,
            top_3_violations=get_top_3_violations(scan_result.violations),
            status=LeadStatus.NO_CONTACT_FORM,
            language_detected=detect_language(url),
            scan_result=scan_result.model_dump()
        )
        supabase.table("leads").insert(lead.model_dump(exclude_none=True)).execute()
        console.log(f"[yellow]No contact form:[/yellow] {domain}")
        return lead
    
    language = detect_language(url)
    business_name = extract_business_name(url)
    report_link = f"{REPORT_BASE_URL}/{domain}"
    
    pitch = HEBREW_PITCH_TEMPLATE.format(business_name=business_name, report_link=report_link) if language == Language.HE else ENGLISH_PITCH_TEMPLATE.format(business_name=business_name, report_link=report_link)
    
    fill_result = await filler.fill_and_submit(
        contact_form_url,
        business_name,
        report_link,
        language.value
    )
    
    lead = Lead(
        domain=domain,
        business_name=business_name,
        detected_violations_count=scan_result.violations_count,
        top_3_violations=get_top_3_violations(scan_result.violations),
        contact_form_url=contact_form_url,
        status=LeadStatus.SENT if fill_result.success else LeadStatus.ERROR,
        language_detected=language,
        scan_result=scan_result.model_dump(),
        pitch_sent_at=datetime.now() if fill_result.success else None
    )
    
    supabase.table("leads").insert(lead.model_dump(exclude_none=True)).execute()
    
    comm = Communication(
        lead_id=lead.id or domain,
        form_url=contact_form_url,
        form_fields=fill_result.fields_filled,
        pitch_language=language,
        pitch_content=pitch,
        success=fill_result.success,
        error_message=fill_result.error,
        captcha_detected=fill_result.captcha_detected,
        response_screenshot_url=fill_result.screenshot_path
    )
    supabase.table("communications").insert(comm.model_dump(exclude_none=True)).execute()
    
    if fill_result.captcha_detected:
        supabase.table("leads").update({"status": LeadStatus.BLOCKED_CAPTCHA.value}).eq("domain", domain).execute()
    
    console.log(f"[green]Completed:[/green] {domain} - {'Sent' if fill_result.success else 'Failed'}")
    return lead


async def run_batch(target_count: int = 50, headless: bool = True):
    console.print("[bold cyan]🚀 AccessiShield Batch Processor Started[/bold cyan]")
    console.print(f"Target: {target_count} sites\n")
    
    all_queries = config["search"]["queries_he"] + config["search"]["queries_en"]
    random.shuffle(all_queries)
    
    processed = 0
    results = {"scanned": 0, "sent": 0, "no_form": 0, "captcha": 0, "errors": 0, "no_violations": 0}
    
    async with WebScanner(headless=headless) as scanner, FormFiller(headless=headless) as filler:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:
            task = progress.add_task("Processing sites...", total=target_count)
            
            for query in all_queries:
                if processed >= target_count:
                    break
                
                urls = await search_businesses(query, config["search"]["max_results_per_query"])
                
                for url in urls:
                    if processed >= target_count:
                        break
                    
                    try:
                        lead = await process_single_site(scanner, filler, url, query)
                        if lead:
                            processed += 1
                            progress.update(task, advance=1)
                            
                            if lead.status == LeadStatus.SENT:
                                results["sent"] += 1
                            elif lead.status == LeadStatus.NO_CONTACT_FORM:
                                results["no_form"] += 1
                            elif lead.status == LeadStatus.BLOCKED_CAPTCHA:
                                results["captcha"] += 1
                            elif lead.status == LeadStatus.SCANNED and lead.detected_violations_count == 0:
                                results["no_violations"] += 1
                            elif lead.status == LeadStatus.ERROR:
                                results["errors"] += 1
                            results["scanned"] += 1
                            
                            await asyncio.sleep(random.uniform(2, 5))
                    except Exception as e:
                        console.log(f"[red]Error processing {url}:[/red] {e}")
                        results["errors"] += 1
    
    console.print("\n[bold green]✅ Batch Complete![/bold green]")
    table = Table(title="Results Summary")
    table.add_column("Metric", style="cyan")
    table.add_column("Count", style="green")
    for k, v in results.items():
        table.add_row(k.replace("_", " ").title(), str(v))
    console.print(table)


async def run_single(url: str, headless: bool = False):
    console.print(f"[bold cyan]🔍 Single Site Scan:[/bold cyan] {url}")
    async with WebScanner(headless=headless) as scanner:
        result = await scanner.scan(url)
        console.print(f"Violations: {result.violations_count}")
        for v in result.violations[:5]:
            console.print(f"  - [{v.impact}] {v.id}: {v.description}")
        
        form_url = await scanner.find_contact_form(url)
        console.print(f"Contact form: {form_url or 'Not found'}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python orchestrator.py <batch|single> [target_count|url]")
        sys.exit(1)
    
    mode = sys.argv[1]
    if mode == "batch":
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 50
        asyncio.run(run_batch(count))
    elif mode == "single":
        url = sys.argv[2] if len(sys.argv) > 2 else "https://example.com"
        asyncio.run(run_single(url))
    else:
        print("Invalid mode. Use 'batch' or 'single'")