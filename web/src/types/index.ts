export type Language = 'he' | 'en';

export interface Violation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
  tags: string[];
}

export interface ScanResult {
  url: string;
  timestamp: string;
  violationsCount: number;
  violations: Violation[];
  incompleteCount: number;
  passesCount: number;
  scanDurationMs: number;
  error?: string;
}

export interface Lead {
  id: string;
  domain: string;
  business_name: string | null;
  detected_violations_count: number;
  top_3_violations: Violation[];
  contact_form_url: string | null;
  status: 'discovered' | 'scanned' | 'sent' | 'replied' | 'paid' | 'blocked_captcha' | 'no_contact_form' | 'error';
  language_detected: Language | 'unknown';
  scan_result: ScanResult | null;
  pitch_sent_at: string | null;
  reply_received_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  lead_id: string;
  report_type: 'pdf' | 'js_widget' | 'both';
  pdf_url: string | null;
  js_widget_code: string | null;
  violations_fixed: Violation[];
  generated_at: string;
  downloaded_at: string | null;
}

export interface Payment {
  id: string;
  lead_id: string | null;
  paypal_order_id: string;
  paypal_capture_id: string | null;
  amount_ils: number;
  amount_usd: number;
  currency: string;
  status: 'created' | 'approved' | 'completed' | 'refunded' | 'failed';
  payer_email: string | null;
  payer_name: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface FormField {
  selector: string;
  fieldType: string;
  name: string | null;
  placeholder: string | null;
  label: string | null;
  required: boolean;
}

export interface FormFillResult {
  success: boolean;
  formUrl: string;
  fieldsFilled: Array<{
    selector: string;
    fieldType: string;
    name: string | null;
    value: string;
  }>;
  error: string | null;
  captchaDetected: boolean;
  screenshotPath: string | null;
}

export interface Communication {
  id: string;
  lead_id: string;
  form_url: string;
  form_fields: FormField[];
  pitch_language: Language;
  pitch_content: string;
  submitted_at: string;
  success: boolean;
  error_message: string | null;
  response_screenshot_url: string | null;
  captcha_detected: boolean;
}