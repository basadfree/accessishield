from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class LeadStatus(str, Enum):
    DISCOVERED = "discovered"
    SCANNED = "scanned"
    SENT = "sent"
    REPLIED = "replied"
    PAID = "paid"
    BLOCKED_CAPTCHA = "blocked_captcha"
    NO_CONTACT_FORM = "no_contact_form"
    ERROR = "error"


class Language(str, Enum):
    HE = "he"
    EN = "en"
    UNKNOWN = "unknown"


class Violation(BaseModel):
    id: str
    impact: str
    description: str
    help: str
    help_url: str
    nodes: List[Dict[str, Any]]
    tags: List[str]


class ScanResult(BaseModel):
    url: str
    timestamp: str
    violations_count: int
    violations: List[Violation]
    incomplete_count: int
    passes_count: int
    scan_duration_ms: int
    error: Optional[str] = None


class Lead(BaseModel):
    id: Optional[str] = None
    domain: str
    business_name: Optional[str] = None
    detected_violations_count: int = 0
    top_3_violations: List[Dict[str, Any]] = []
    contact_form_url: Optional[str] = None
    status: LeadStatus = LeadStatus.DISCOVERED
    language_detected: Language = Language.UNKNOWN
    scan_result: Optional[Dict[str, Any]] = None
    pitch_sent_at: Optional[datetime] = None
    reply_received_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Communication(BaseModel):
    id: Optional[str] = None
    lead_id: str
    form_url: str
    form_fields: List[Dict[str, Any]]
    pitch_language: Language
    pitch_content: str
    submitted_at: datetime = datetime.now()
    success: bool = False
    error_message: Optional[str] = None
    response_screenshot_url: Optional[str] = None
    captcha_detected: bool = False


class Report(BaseModel):
    id: Optional[str] = None
    lead_id: str
    report_type: str
    pdf_url: Optional[str] = None
    js_widget_code: Optional[str] = None
    violations_fixed: List[Dict[str, Any]] = []
    generated_at: datetime = datetime.now()
    downloaded_at: Optional[datetime] = None


class Payment(BaseModel):
    id: Optional[str] = None
    lead_id: Optional[str] = None
    paypal_order_id: str
    paypal_capture_id: Optional[str] = None
    amount_ils: int
    amount_usd: int
    currency: str = "ILS"
    status: str = "created"
    payer_email: Optional[str] = None
    payer_name: Optional[str] = None
    created_at: datetime = datetime.now()
    completed_at: Optional[datetime] = None


class ScanQueueItem(BaseModel):
    id: Optional[str] = None
    url: str
    query_source: Optional[str] = None
    priority: int = 0
    status: str = "pending"
    attempts: int = 0
    last_error: Optional[str] = None
    scheduled_at: datetime = datetime.now()
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None