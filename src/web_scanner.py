import asyncio
import json
import os
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from pathlib import Path

from playwright.async_api import async_playwright, Browser, Page
from supabase import create_client, Client
from pydantic import BaseModel, HttpUrl
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from tenacity import retry, stop_after_attempt, wait_exponential

console = Console()

BASE_DIR = Path(__file__).parent.parent
CONFIG_PATH = BASE_DIR / "config.json"

with open(CONFIG_PATH) as f:
    config = json.load(f)

SUPABASE_URL = config["supabase"]["url"]
SUPABASE_KEY = config["supabase"]["service_role_key"]
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

AXE_SCRIPT = """
(function() {
    var script = document.createElement('script');
    script.src = 'https://unpkg.com/axe-core@4.8.4/axe.min.js';
    script.onload = function() {
        window.axeReady = true;
    };
    document.head.appendChild(script);
})();
"""

AXE_RUN_SCRIPT = """
async function runAxe() {
    if (!window.axe) {
        return { error: 'axe not loaded' };
    }
    try {
        const results = await axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
            resultTypes: ['violations', 'incomplete', 'passes']
        });
        return results;
    } catch (e) {
        return { error: e.message };
    }
}
runAxe();
"""


@dataclass
class Violation:
    id: str
    impact: str
    description: str
    help: str
    help_url: str
    nodes: List[Dict[str, Any]]
    tags: List[str]


@dataclass
class ScanResult:
    url: str
    timestamp: str
    violations_count: int
    violations: List[Violation]
    incomplete_count: int
    passes_count: int
    scan_duration_ms: int
    error: Optional[str] = None


class WebScanner:
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.playwright = None

    async def __aenter__(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            args=['--disable-blink-features=AutomationControlled']
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def _inject_axe(self, page: Page) -> bool:
        await page.add_script_tag(url="https://unpkg.com/axe-core@4.8.4/axe.min.js")
        await page.wait_for_function("() => window.axe !== undefined", timeout=10000)
        return True

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def scan(self, url: str) -> ScanResult:
        start_time = datetime.now()
        page = await self.browser.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page.set_default_timeout(config["thresholds"]["scan_timeout_ms"])

        try:
            console.log(f"[cyan]Scanning:[/cyan] {url}")
            response = await page.goto(url, wait_until="networkidle", timeout=30000)
            if not response or response.status >= 400:
                return ScanResult(
                    url=url,
                    timestamp=datetime.now().isoformat(),
                    violations_count=0,
                    violations=[],
                    incomplete_count=0,
                    passes_count=0,
                    scan_duration_ms=0,
                    error=f"HTTP {response.status if response else 'No response'}"
                )

            await self._inject_axe(page)

            results = await page.evaluate(AXE_RUN_SCRIPT)

            if results.get("error"):
                return ScanResult(
                    url=url,
                    timestamp=datetime.now().isoformat(),
                    violations_count=0,
                    violations=[],
                    incomplete_count=0,
                    passes_count=0,
                    scan_duration_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                    error=results["error"]
                )

            violations = [
                Violation(
                    id=v["id"],
                    impact=v["impact"],
                    description=v["description"],
                    help=v["help"],
                    help_url=v["helpUrl"],
                    nodes=v["nodes"],
                    tags=v["tags"]
                )
                for v in results.get("violations", [])
            ]

            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

            result = ScanResult(
                url=url,
                timestamp=datetime.now().isoformat(),
                violations_count=len(violations),
                violations=violations,
                incomplete_count=len(results.get("incomplete", [])),
                passes_count=len(results.get("passes", [])),
                scan_duration_ms=duration_ms
            )

            console.log(f"[green]Done:[/green] {url} - {len(violations)} violations in {duration_ms}ms")
            return result

        except Exception as e:
            console.log(f"[red]Error scanning {url}:[/red] {e}")
            return ScanResult(
                url=url,
                timestamp=datetime.now().isoformat(),
                violations_count=0,
                violations=[],
                incomplete_count=0,
                passes_count=0,
                scan_duration_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                error=str(e)
            )
        finally:
            await page.close()

    async def find_contact_form(self, url: str) -> Optional[str]:
        page = await self.browser.new_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=15000)
            form_selectors = [
                'form[action*="contact"]',
                'form[action*="צור-קשר"]',
                'form[id*="contact"]',
                'form[class*="contact"]',
                'form:has(input[type="email"]):has(textarea)',
                '#contact-form',
                '.contact-form',
                'form'
            ]
            for selector in form_selectors:
                form = await page.query_selector(selector)
                if form:
                    action = await form.get_attribute("action")
                    form_url = action if action else url
                    console.log(f"[yellow]Found contact form at:[/yellow] {form_url}")
                    return form_url
            return None
        except Exception as e:
            console.log(f"[red]Error finding contact form:[/red] {e}")
            return None
        finally:
            await page.close()


async def scan_single(url: str, headless: bool = True) -> ScanResult:
    async with WebScanner(headless=headless) as scanner:
        return await scanner.scan(url)


async def scan_batch(urls: List[str], headless: bool = True) -> List[ScanResult]:
    async with WebScanner(headless=headless) as scanner:
        results = []
        for url in urls:
            result = await scanner.scan(url)
            results.append(result)
        return results


if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com"
    result = asyncio.run(scan_single(url, headless=False))
    print(json.dumps(asdict(result), indent=2, ensure_ascii=False))