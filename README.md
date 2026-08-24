# AccessiShield - Automated Accessibility Lead Generation Platform

An autonomous revenue-generating agent that scans websites for accessibility violations using axe-core, and a dual-language (Hebrew/English) Micro-SaaS platform for delivering fix reports.

## Architecture

```
accessibility-hunter/
├── src/                    # Python automation engine
│   ├── web_scanner.py      # Playwright + axe-core scanning
│   ├── form_filler.py      # Contact form automation
│   ├── orchestrator.py     # Batch processing loop
│   ├── models.py           # Pydantic data models
│   └── requirements.txt    # Python dependencies
├── web/                    # Next.js Micro-SaaS platform
│   ├── src/
│   │   ├── app/            # App Router pages & API routes
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities (Supabase, i18n, utils)
│   │   └── types/          # TypeScript types
│   └── package.json
├── supabase/
│   └── schema.sql          # Database schema
└── config.json             # Global configuration
```

## Features

### Automation Engine (Python)
- **Web Scanner**: Playwright + axe-core for WCAG 2.1 AA compliance scanning
- **Form Filler**: Intelligent contact form detection and filling with human-like behavior
- **Batch Processor**: Processes up to 50 sites per run with configurable search queries
- **Supabase Integration**: Persistent lead tracking, communications logging, payment records

### Micro-SaaS Platform (Next.js)
- **Free Scanner Hook**: Instant accessibility scan with top 3 violations displayed
- **Dual Language**: Hebrew (RTL) / English (LTR) with auto-detection
- **PayPal Integration**: Secure 200 ILS / $55 one-time payment
- **Report Delivery**: PDF download + one-line JS widget for dynamic fixes
- **Responsive Design**: Mobile-first, accessible, dark mode support

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Supabase account
- PayPal Developer account
- Vercel account (for deployment)

### 1. Configure Environment

```bash
# Copy config template
cp config.json config.local.json

# Edit config.local.json with your credentials
# - Supabase URL and keys
# - PayPal client ID and secret
# - Contact email/phone
```

```bash
# Web app environment
cd web
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 2. Setup Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# In Supabase Dashboard -> SQL Editor
# Copy and run contents of supabase/schema.sql
```

### 3. Install Dependencies

```bash
# Python automation
cd src
pip install -r requirements.txt
playwright install chromium

# Web app
cd ../web
npm install
```

### 4. Run Development

```bash
# Terminal 1: Web app
cd web
npm run dev

# Terminal 2: Test scanner
cd src
python web_scanner.py https://example.com

# Terminal 3: Test batch (small)
cd src
python orchestrator.py batch 5
```

## Configuration

### config.json
```json
{
  "contact": {
    "email": "your-email@domain.com",
    "phone": "+972-XX-XXXXXXX"
  },
  "payment": {
    "amount_ils": 200,
    "amount_usd": 55,
    "paypal": {
      "client_id": "",
      "client_secret": "",
      "mode": "sandbox"
    }
  },
  "search": {
    "queries_he": ["מספרה בתל אביב", "מסעדה בירושלים", ...],
    "queries_en": ["hair salon tel aviv", "restaurant jerusalem", ...],
    "max_results_per_query": 20
  }
}
```

### Environment Variables (web/.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_MODE=sandbox
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_REPORT_BASE_URL=https://your-domain.com/report
```

## Deployment

### Vercel (Web App)
1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy - automatic on push to main

### Supabase
1. Run schema.sql in SQL Editor
2. Enable Row Level Security policies
3. Configure auth providers if needed

### PayPal
1. Create PayPal App in Developer Dashboard
2. Add webhook URL: `https://your-domain.com/api/paypal/webhook`
3. Subscribe to events: PAYMENT.CAPTURE.COMPLETED, CHECKOUT.ORDER.APPROVED, etc.
4. Set webhook ID in environment variables

### Python Automation (VPS/Server)
```bash
# On your server
git clone <repo>
cd accessibility-hunter/src
pip install -r requirements.txt
playwright install chromium

# Run batch manually or via cron
python orchestrator.py batch 50

# Or run as service with systemd
```

## Usage

### Run Batch Scan
```bash
cd src
python orchestrator.py batch 50
```

### Single Site Scan
```bash
python web_scanner.py https://example.com
```

### Test Form Filling
```bash
python form_filler.py https://example.com/contact
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scan` | POST | Scan URL for accessibility violations |
| `/api/paypal/create-order` | POST | Create PayPal order for report |
| `/api/paypal/capture-order` | POST | Capture approved PayPal payment |
| `/api/paypal/webhook` | POST | PayPal webhook handler |
| `/api/report/[domain]` | GET | Retrieve generated report |

## Database Schema

Key tables:
- **leads**: Discovered/processed websites with scan results
- **communications**: Form submission logs
- **reports**: Generated fix reports (PDF + JS widget)
- **payments**: PayPal transaction records
- **scan_queue**: Batch processing queue

## Customization

### Add Search Querries
Edit `config.json` search queries for your target markets.

### Modify Pitch Templates
Edit Hebrew/English templates in `src/form_filler.py`.

### Styling
Tailwind config in `web/tailwind.config.ts` - customize colors, fonts, animations.

## Security

- All secrets in environment variables (never committed)
- Supabase RLS policies protect data
- PayPal webhook signature verification
- Rate limiting on API routes
- CSP headers configured

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please use GitHub Issues.# deploy trigger
