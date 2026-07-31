# Admin User Guide — SM Travels International ERP

## Sign-in

1. Open https://smtravelsinternational.com/login
2. Use your staff email + password
3. You land in `/erp` if your role is staff/admin (not Customer/Agent portals)

## Roles (high level)

| Role | Typical access |
|------|----------------|
| SUPER_ADMIN | Full ERP + can assign Company Admin |
| COMPANY_ADMIN | Full company settings & modules |
| BRANCH_MANAGER / STAFF / executives | Branch-scoped CRM, bookings, documents |
| ACCOUNTANT | Accounts, invoices, reports |
| AGENT / CUSTOMER / SUPPLIER | Portals only (`/agent`, `/portal`, `/supplier`) — not ERP modules |

## Core workflows

### Customers (CRM)
- **Create** lead → convert / create customer
- **Search / filter / paginate** on list views
- **Update** profile, notes, assignee
- Soft-delete where available (respect permissions)

### Bookings
- Create booking linked to customer/package
- Update status through pipeline
- Attach travelers / charges as configured
- Print voucher when status allows

### Documents & OCR
- Upload PDF/JPG/PNG (max 10 MB)
- Run OCR on supported kinds (passport, visa, NID, flight, hotel, medical)
- Review extracted fields before applying to records

### Invoices & payments
- Create draft → Issue → Record payment
- Print uses live invoice data (SM Travels branding)
- Screens labeled **Sample data** (online payment gateway stats, vouchers) are not live yet

### CMS
- Manage pages (privacy/terms/etc.), menus, banners, media
- Public site reads published CMS content

### Communications
- Notification dashboard shows Email/SMS/WhatsApp flags
- Email is live when SMTP configured
- SMS/WhatsApp stay off until credentials are provided
- Retry failed outbound rows from the queue UI

### Reports
- Overview + customers/notifications reports
- Export `format=csv|xlsx|pdf` where exposed

## Sample / mock screens

Amber **Sample data** banners mean the view is UI-only. Do not use those numbers for decisions.

## Security tips

- Never share OTP codes
- Disable users immediately when staff leave (tokens invalidate)
- Only SUPER_ADMIN should promote admins
