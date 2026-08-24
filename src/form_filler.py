import asyncio
import json
import os
import random
from datetime import datetime
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, asdict
from pathlib import Path

from playwright.async_api import async_playwright, Browser, Page, ElementHandle
from supabase import create_client, Client
from rich.console import Console
from tenacity import retry, stop_after_attempt, wait_exponential

console = Console()

BASE_DIR = Path(__file__).parent.parent
CONFIG_PATH = BASE_DIR / "config.json"

with open(CONFIG_PATH) as f:
    config = json.load(f)

SUPABASE_URL = config["supabase"]["url"]
SUPABASE_KEY = config["supabase"]["service_role_key"]
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

PROJECT_EMAIL = config["contact"]["email"]
PROJECT_PHONE = config["contact"]["phone"]


@dataclass
class FormField:
    selector: str
    field_type: str
    name: Optional[str] = None
    placeholder: Optional[str] = None
    label: Optional[str] = None
    required: bool = False
    value: Optional[str] = None


@dataclass
class FormFillResult:
    success: bool
    form_url: str
    fields_filled: List[Dict[str, Any]]
    error: Optional[str] = None
    captcha_detected: bool = False
    screenshot_path: Optional[str] = None


HEBREW_PITCH_TEMPLATE = """היי {business_name},

עברתי על האתר שלכם ובזמן שהעיצוב נראה אחלה, הקוד שלו קצת מפלה אנשים. הרצתי בדיקת נגישות קצרה (תקן ת"י 5568) וגיליתי שהרבה תמונות מפתח שלכם פשוט שקופות לחלוטין עבור עיוורים (אין להן Alt tags), וכפתור השליחה בטופס שלכם בלתי ניתן לניווט עם מקלדת.

בישראל, עורכי דין מתפרנסים מתביעות של 50,000 ש"ח על דברים כאלה בדיוק, בלי שהם צריכים להוכיח שאפילו נגרם נזק. חבל על הכסף שלכם.

שמתי לכם את הדוח המלא והפתרון בקוד כאן ב-AccessiShield. פתרנו את זה ככה שזה יעלה לכם פחות מארוחה זוגית (200 ש"ח) ויסגור לכם את הפינה המשפטית הזו לצמיתות.

הנה הלינק ישירות לדוח שלכם: {report_link}

תהיו נגישים, חבל על הקנס,
צוות AccessiShield."""


ENGLISH_PITCH_TEMPLATE = """Hey {business_name},

Stumbled upon your site and love what you're doing, but your front-end code is currently blocking a chunk of your audience. Ran a quick WCAG 2.1 compliance check and found that your main checkout/contact buttons are completely invisible to screen readers, and your color contrast violates basic accessibility laws.

In plain English: You are highly vulnerable to a drive-by accessibility lawsuit (which average $10k-$25k settling costs in the US).

We mapped out the exact 5 lines of code you need to change to fix this completely. It costs $55—cheaper than a bad lunch. Grab the instant fix report here before a compliance lawyer finds you: {report_link}

Stay safe,
The AccessiShield Team."""


class FormFiller:
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.playwright = None
        self.screenshots_dir = BASE_DIR / "screenshots"
        self.screenshots_dir.mkdir(exist_ok=True)

    async def __aenter__(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox'
            ]
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def _detect_form_fields(self, page: Page) -> List[FormField]:
        fields = []
        forms = await page.query_selector_all('form')
        
        for form in forms:
            inputs = await form.query_selector_all('input, textarea, select')
            for input_el in inputs:
                field_type = await input_el.get_attribute('type') or 'text'
                if field_type in ['hidden', 'submit', 'button', 'image', 'reset']:
                    continue
                
                name = await input_el.get_attribute('name')
                placeholder = await input_el.get_attribute('placeholder')
                required = await input_el.get_attribute('required') is not None
                selector = await self._get_unique_selector(input_el)
                
                label_text = None
                if name:
                    label_el = await page.query_selector(f'label[for="{await input_el.get_attribute("id")}"]')
                    if label_el:
                        label_text = await label_el.inner_text()
                
                fields.append(FormField(
                    selector=selector,
                    field_type=field_type,
                    name=name,
                    placeholder=placeholder,
                    label=label_text,
                    required=required
                ))
        return fields

    async def _get_unique_selector(self, element: ElementHandle) -> str:
        id_attr = await element.get_attribute('id')
        if id_attr:
            return f'#{id_attr}'
        
        name_attr = await element.get_attribute('name')
        if name_attr:
            return f'[name="{name_attr}"]'
        
        placeholder = await element.get_attribute('placeholder')
        if placeholder:
            return f'[placeholder="{placeholder}"]'
        
        class_attr = await element.get_attribute('class')
        if class_attr:
            classes = '.'.join(class_attr.split())
            return f'.{classes}'
        
        tag = await element.evaluate('el => el.tagName.toLowerCase()')
        return tag

    def _match_field_to_value(self, field: FormField, business_name: str, report_link: str, language: str) -> Optional[str]:
        field_identifiers = ' '.join(filter(None, [
            field.name or '',
            field.placeholder or '',
            field.label or '',
            field.selector or ''
        ])).lower()

        email_keywords = ['email', 'mail', 'אימייל', 'מייל', 'דואר']
        name_keywords = ['name', 'שם', 'fullname', 'full-name', 'your-name']
        phone_keywords = ['phone', 'tel', 'mobile', 'טלפון', 'נייד']
        message_keywords = ['message', 'msg', 'content', 'body', 'הודעה', 'תוכן', 'פירוט', 'comments']
        subject_keywords = ['subject', 'נושא', 'כותרת']
        company_keywords = ['company', 'organization', 'חברה', 'ארגון']

        if any(kw in field_identifiers for kw in email_keywords):
            return PROJECT_EMAIL
        elif any(kw in field_identifiers for kw in name_keywords):
            return "AccessiShield Bot"
        elif any(kw in field_identifiers for kw in phone_keywords):
            return PROJECT_PHONE if field.required else ""
        elif any(kw in field_identifiers for kw in company_keywords):
            return "AccessiShield"
        elif any(kw in field_identifiers for kw in subject_keywords):
            return f"דוח נגישות לאתר {business_name}" if language == 'he' else f"Accessibility Report for {business_name}"
        elif any(kw in field_identifiers for kw in message_keywords):
            if language == 'he':
                return HEBREW_PITCH_TEMPLATE.format(business_name=business_name, report_link=report_link)
            else:
                return ENGLISH_PITCH_TEMPLATE.format(business_name=business_name, report_link=report_link)
        return None

    async def _detect_captcha(self, page: Page) -> bool:
        captcha_selectors = [
            'iframe[src*="recaptcha"]',
            'iframe[src*="hcaptcha"]',
            '.g-recaptcha',
            '#recaptcha',
            '[data-sitekey]',
            '.cf-turnstile',
            'iframe[src*="turnstile"]'
        ]
        for selector in captcha_selectors:
            if await page.query_selector(selector):
                return True
        return False

    async def _human_like_type(self, page: Page, selector: str, text: str):
        element = await page.query_selector(selector)
        if not element:
            return False
        
        await element.click()
        await asyncio.sleep(random.uniform(0.1, 0.3))
        await element.fill('')
        await asyncio.sleep(random.uniform(0.1, 0.2))
        
        for char in text:
            await element.type(char, delay=random.uniform(30, 120))
            if random.random() < 0.1:
                await asyncio.sleep(random.uniform(0.1, 0.4))
        
        return True

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=5))
    async def fill_and_submit(
        self,
        form_url: str,
        business_name: str,
        report_link: str,
        language: str = 'he',
        lead_id: Optional[str] = None
    ) -> FormFillResult:
        page = await self.browser.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page.set_default_timeout(config["thresholds"]["form_fill_timeout_ms"])

        fields_filled = []
        screenshot_path = None

        try:
            console.log(f"[cyan]Navigating to form:[/cyan] {form_url}")
            await page.goto(form_url, wait_until="networkidle", timeout=20000)

            if await self._detect_captcha(page):
                console.log("[red]CAPTCHA detected![/red]")
                screenshot_path = str(self.screenshots_dir / f"captcha_{lead_id or 'unknown'}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
                await page.screenshot(path=screenshot_path, full_page=True)
                return FormFillResult(
                    success=False,
                    form_url=form_url,
                    fields_filled=[],
                    error="CAPTCHA detected",
                    captcha_detected=True,
                    screenshot_path=screenshot_path
                )

            fields = await self._detect_form_fields(page)
            console.log(f"[yellow]Found {len(fields)} fillable fields[/yellow]")

            for field in fields:
                value = self._match_field_to_value(field, business_name, report_link, language)
                if value is not None and value != "":
                    success = await self._human_like_type(page, field.selector, value)
                    if success:
                        fields_filled.append({
                            "selector": field.selector,
                            "field_type": field.field_type,
                            "name": field.name,
                            "value": value[:50] + "..." if len(value) > 50 else value
                        })
                        console.log(f"[green]Filled:[/green] {field.selector} ({field.name or field.placeholder})")
                        await asyncio.sleep(random.uniform(0.2, 0.5))
                    else:
                        console.log(f"[red]Failed to fill:[/red] {field.selector}")

            if not fields_filled:
                return FormFillResult(
                    success=False,
                    form_url=form_url,
                    fields_filled=[],
                    error="No fields could be filled"
                )

            submit_selectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("שלח")',
                'button:has-text("Send")',
                'button:has-text("Submit")',
                'button:has-text("שליחה")',
                '[role="button"]:has-text("שלח")',
                '[role="button"]:has-text("Send")'
            ]

            submitted = False
            for selector in submit_selectors:
                btn = await page.query_selector(selector)
                if btn and await btn.is_visible() and await btn.is_enabled():
                    await btn.click()
                    submitted = True
                    console.log(f"[green]Submitted via:[/green] {selector}")
                    break

            if not submitted:
                console.log("[red]No submit button found[/red]")
                return FormFillResult(
                    success=False,
                    form_url=form_url,
                    fields_filled=fields_filled,
                    error="No submit button found"
                )

            await page.wait_for_load_state("networkidle", timeout=10000)
            await asyncio.sleep(2)

            screenshot_path = str(self.screenshots_dir / f"success_{lead_id or 'unknown'}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
            await page.screenshot(path=screenshot_path, full_page=True)

            return FormFillResult(
                success=True,
                form_url=form_url,
                fields_filled=fields_filled,
                screenshot_path=screenshot_path
            )

        except Exception as e:
            console.log(f"[red]Form fill error:[/red] {e}")
            screenshot_path = str(self.screenshots_dir / f"error_{lead_id or 'unknown'}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
            await page.screenshot(path=screenshot_path, full_page=True)
            return FormFillResult(
                success=False,
                form_url=form_url,
                fields_filled=fields_filled,
                error=str(e),
                screenshot_path=screenshot_path
            )
        finally:
            await page.close()

    async def log_communication(
        self,
        lead_id: str,
        result: FormFillResult,
        pitch_language: str,
        pitch_content: str
    ):
        try:
            supabase.table("communications").insert({
                "lead_id": lead_id,
                "form_url": result.form_url,
                "form_fields": result.fields_filled,
                "pitch_language": pitch_language,
                "pitch_content": pitch_content,
                "success": result.success,
                "error_message": result.error,
                "captcha_detected": result.captcha_detected,
                "response_screenshot_url": result.screenshot_path
            }).execute()
        except Exception as e:
            console.log(f"[red]Failed to log communication:[/red] {e}")


async def fill_single_form(
    form_url: str,
    business_name: str,
    report_link: str,
    language: str = 'he',
    lead_id: Optional[str] = None,
    headless: bool = True
) -> FormFillResult:
    async with FormFiller(headless=headless) as filler:
        result = await filler.fill_and_submit(form_url, business_name, report_link, language, lead_id)
        if lead_id:
            pitch_content = HEBREW_PITCH_TEMPLATE.format(business_name=business_name, report_link=report_link) if language == 'he' else ENGLISH_PITCH_TEMPLATE.format(business_name=business_name, report_link=report_link)
            await filler.log_communication(lead_id, result, language, pitch_content)
        return result


if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com/contact"
    result = asyncio.run(fill_single_form(url, "Test Business", "https://accessishield.io/report/123", "he", headless=False))
    print(json.dumps(asdict(result), indent=2, ensure_ascii=False))