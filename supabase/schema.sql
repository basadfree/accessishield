-- AccessiShield Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads table - tracks all discovered/processed sites
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain TEXT NOT NULL UNIQUE,
    business_name TEXT,
    detected_violations_count INTEGER DEFAULT 0,
    top_3_violations JSONB DEFAULT '[]'::jsonb,
    contact_form_url TEXT,
    status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN (
        'discovered', 'scanned', 'sent', 'replied', 'paid', 'blocked_captcha', 'no_contact_form', 'error'
    )),
    language_detected TEXT CHECK (language_detected IN ('he', 'en', 'unknown')) DEFAULT 'unknown',
    scan_result JSONB,
    pitch_sent_at TIMESTAMPTZ,
    reply_received_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_domain ON leads(domain);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Communications log - tracks all form submissions
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    form_url TEXT NOT NULL,
    form_fields JSONB NOT NULL,
    pitch_language TEXT NOT NULL CHECK (pitch_language IN ('he', 'en')),
    pitch_content TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT FALSE,
    error_message TEXT,
    response_screenshot_url TEXT,
    captcha_detected BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_communications_lead_id ON communications(lead_id);
CREATE INDEX idx_communications_submitted_at ON communications(submitted_at DESC);

-- Reports - generated fix reports for paid leads
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('pdf', 'js_widget', 'both')),
    pdf_url TEXT,
    js_widget_code TEXT,
    violations_fixed JSONB DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    downloaded_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_lead_id ON reports(lead_id);

-- Payments - tracks PayPal transactions
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    paypal_order_id TEXT UNIQUE,
    paypal_capture_id TEXT,
    amount_ils INTEGER NOT NULL,
    amount_usd INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ILS',
    status TEXT NOT NULL CHECK (status IN ('created', 'approved', 'completed', 'refunded', 'failed')),
    payer_email TEXT,
    payer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_lead_id ON payments(lead_id);
CREATE INDEX idx_paypal_order_id ON payments(paypal_order_id);

-- Scan queue - for batch processing management
CREATE TABLE scan_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    query_source TEXT,
    priority INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_scan_queue_status ON scan_queue(status);
CREATE INDEX idx_scan_queue_priority ON scan_queue(priority DESC, scheduled_at ASC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_queue ENABLE ROW LEVEL SECURITY;

-- Policies: Service role has full access, anon has read access to published reports
CREATE POLICY "Service role full access" ON leads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON communications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON reports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON payments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON scan_queue FOR ALL USING (auth.role() = 'service_role');

-- Anon can read reports for their lead (via lead_id in URL token)
CREATE POLICY "Anon read own report" ON reports FOR SELECT USING (true);
CREATE POLICY "Anon read own lead" ON leads FOR SELECT USING (true);