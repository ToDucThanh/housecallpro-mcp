---
name: housecallpro
description: >
  Use this skill when working with Housecall Pro API, booking jobs, managing
  customers, creating estimates, tracking invoices, handling leads, or using
  any housecallpro MCP tool. Provides workflows, field formats, tool reference,
  and error recovery guidance for the Housecall Pro public API.
---

## Overview

This skill gives you natural language access to the full Housecall Pro public API
via the housecallpro MCP server. You can manage customers, book and schedule jobs,
create estimates, track invoices, manage leads, and more — all without leaving Claude Code.

**Base URL:** https://api.housecallpro.com
**Auth:** API Key (Token) or OAuth 2.0
**Plan required:** MAX plan

---

## Quick Start — Example Prompts

Copy and paste any of these directly into Claude Code:

### Customers
```
List my first 10 customers
Find customer named "John Smith"
Get all customers with fetch_all true and tell me the total count
Create a customer named Jane Doe with email jane@example.com and mobile +1 555 123 4567
Update customer {customer_id} email to newemail@example.com
Get all addresses for customer {customer_id}
Add a new address 456 Oak Ave, Austin TX 78701 to customer {customer_id}
```

### Booking & Scheduling
```
Book a job for customer {customer_id} at address {address_id} on 2025-05-01 at 9am for 1 hour
Schedule a job and notify both the customer and the assigned employee
Reschedule job {job_id} to 2025-05-10 at 2pm
Dispatch job {job_id} to employee {employee_id}
List all scheduled jobs for next week
List all unscheduled jobs
Cancel the schedule for job {job_id}
Lock all completed jobs between 2025-01-01 and 2025-03-31
Get available booking windows for the next 7 days
```

### Estimates
```
Create an estimate for customer {customer_id} at address {address_id}
Add an option called "Standard Package" with a labor line item to estimate {estimate_id}
List all estimates scheduled this month
Get estimate {estimate_id}
Approve estimate option {option_id}
```

### Invoices
```
Get all invoices for job {job_id}
Get invoice {invoice_id}
List all open invoices
List all paid invoices created this month
Preview invoice {invoice_id} as HTML
```

### Leads
```
Create a lead for customer {customer_id}
List all open leads
Convert lead {lead_id} to a job
Convert lead {lead_id} to an estimate
List line items for lead {lead_id}
```

### Reporting & Bulk Operations
```
Fetch all jobs with fetch_all true completed this quarter
Fetch all customers with fetch_all true and count how many have no address
List all employees
Get company information
Get all tags
Get schedule windows and booking availability
```

---

## Data Model — How Everything Connects

Understanding this hierarchy prevents mistakes when chaining tools:

```
Company
├── GET/PUT /company/schedule_availability     (business hours config)
└── GET     /company/schedule_availability/booking_windows  (available slots)

Customers
└── Addresses (a customer can have multiple addresses)

Jobs (require BOTH customer_id AND address_id to create)
├── Schedule       (start_time, end_time, arrival_window)
├── Dispatched Employees
├── Line Items     (directly on job, not inside options)
├── Input Materials
├── Invoices
├── Appointments   (multi-day jobs only — use update_job_schedule for standard jobs)
├── Attachments
├── Notes
├── Tags
├── Links
└── Lock

Estimates (require BOTH customer_id AND address_id to create)
└── Options        (estimates have OPTIONS first, then line items inside each option)
    ├── Line Items
    ├── Attachments
    └── Schedule
└── Approve Options -> may auto-create a Job if company setting is enabled

Leads (require existing customer_id)
├── Line Items
└── Convert -> Job or Estimate  (/leads/{id}/convert)

Invoices (global — not nested under jobs for the list endpoint)
├── GET /invoices                       (list with rich filters)
├── GET /api/invoices/{uuid}            (get single invoice)
└── GET /api/invoices/{uuid}/preview    (HTML preview)

Employees  (active employees in the organization)
Events     (calendar events, separate from jobs, have assigned employees)
Routes     (groups employees + job appointments by date)
Tags       (global, reusable across jobs, customers, events)
Pipeline   (forward-only status workflow for leads/jobs/estimates)
Webhooks   (per-company event subscriptions)

Price Book
├── Services          (/api/price_book/services)
├── Price Forms       (/api/price_book/price_forms)
└── Materials         (/api/price_book/materials — requires material_category_uuid)

Reference Data
├── Job Types
├── Lead Sources
├── Service Zones     (filter by zip_code or address)
└── Material Categories (/api/price_book/material_categories)
```

**Key rules:**
- You CANNOT create a Job or Estimate without an existing customer_id AND address_id
- You CANNOT create a Lead without an existing customer_id
- Estimates use Options -> Line Items (NOT direct line items like Jobs)
- Jobs link back to their source estimate via original_estimate_id / original_estimate_uuids
- Pipeline only moves FORWARD — target status must have equal or higher order value

---

## Workflow Guides

### Workflow 1: Book a Job for an Existing Customer

Steps to chain in order:

1. `list_customers` with q: "customer name" -> get customer_id
2. `list_customer_addresses` with customer_id -> get address_id
3. `create_job` with customer_id + address_id -> get job_id
4. `update_job_schedule` with job_id + start_time + end_time -> schedules the job
5. (Optional) `list_employees` -> get employee_id
6. (Optional) `dispatch_job` with job_id + dispatched_employees -> assigns technician

Example prompt:
```
Find customer John Smith, get his first address, create a job there
scheduled for 2025-05-01 9am-10am with 60 min arrival window,
notify the customer, and dispatch to employee Mike Johnson
```

Important parameters for update_job_schedule:
- start_time — REQUIRED, ISO 8601 e.g. "2025-05-01T09:00:00"
- end_time — optional but strongly recommended
- arrival_window_in_minutes — integer e.g. 30, 60, 120
- notify: true — sends booking confirmation SMS/email to CUSTOMER at time of scheduling
- notify_pro: true — sends booking confirmation to ASSIGNED EMPLOYEE at time of scheduling
- NOTE: notify/notify_pro fire immediately at scheduling time, NOT at job completion

### Workflow 2: Book a Job for a Brand New Customer

Steps to chain in order:

1. `create_customer` -> get customer_id
2. `create_customer_address` with customer_id + address details -> get address_id
3. `create_job` with customer_id + address_id -> get job_id
4. `update_job_schedule` -> schedules it
5. (Optional) `dispatch_job` -> assigns employee

Example prompt:
```
Create a new customer Sarah Connor, phone +1 555 999 0000,
add her address 123 Main St Austin TX 78701,
then book a job there for 2025-05-02 at 2pm for 2 hours
```

Customer creation rules:
- At least ONE of these is required: first_name, last_name, email,
  mobile_number, home_number, work_number
- All other fields are optional
- Phone format: "+1 555 123 4567" or "(555) 123-4567" or "5551234567"

### Workflow 3: Create an Estimate with Options

Steps to chain in order:

1. `list_customers` -> find customer_id (or create_customer first)
2. `list_customer_addresses` -> find address_id
3. `create_estimate` with customer_id + address_id -> get estimate_id
4. `create_estimate_option` with estimate_id + option name + line items -> get option_id
5. (Optional) `approve_estimate_options` with option_ids -> may auto-create a job

Example prompt:
```
Create an estimate for customer {customer_id} at address {address_id},
add an option called "Standard Package" with a labor line item at $150,
then approve it
```

NOTE: Estimates use a two-level structure — Options first, then Line Items inside
each Option. This is different from Jobs which have Line Items directly.

### Workflow 4: Full Lead to Job Conversion

Steps to chain in order:

1. `create_customer` -> get customer_id
2. `create_customer_address` -> get address_id
3. `create_lead` with customer_id -> get lead_id
4. `list_pipeline_statuses` with resource_type "lead" -> see available statuses
5. `update_pipeline_status` to move lead forward in pipeline
6. `convert_lead` with type "job" or "estimate" -> get job_id or estimate_id
7. `update_job_schedule` to schedule the resulting job

Example prompt:
```
Create a lead for customer {customer_id}, move it to the next pipeline status,
then convert it to a job and schedule it for next Monday at 10am
```

Lead status values: "open", "won", "lost"
Pipeline note: forward movement only — check list_pipeline_statuses first

### Workflow 5: Check Booking Availability

Steps:

1. `get_booking_windows` with show_for_days, start_date, optionally service_id
2. Review available windows (available: true)
3. Pick a window and use start_time/end_time for update_job_schedule

Example prompt:
```
Show me available booking windows for the next 7 days
Show me available windows for service {service_id} starting 2025-05-01
```

NOTE: Booking windows are based on the company's Online Booking settings
and actual open time slots per employee.

### Workflow 6: Invoice Management

Example prompts:
```
Get all invoices for job {job_id}
List all open invoices created between 2025-01-01 and 2025-03-31
Get invoice {invoice_uuid}
Preview invoice {invoice_uuid} as HTML
List all invoices with payment_method credit_card
```

Invoice status values: "open", "pending_payment", "paid", "voided", "uncollectible", "canceled"
Invoice sort fields: "amount", "created_at", "due_amount", "due_at", "invoice_number",
                     "paid_at", "sent_at", "status", "updated_at"

---

## Field Formats & Validation

Always use these formats to avoid validation errors before the API is called:

### Dates & Times
```
✅ "2025-05-01T09:00:00"     ISO 8601 with time (recommended)
✅ "2025-05-01"              ISO 8601 date only
✅ "2025-05-01T00:00:00Z"    ISO 8601 with UTC timezone
❌ "05/01/2025"              US format — will fail validation
❌ "May 1 2025"              Natural language — will fail validation
❌ "next Monday"             Relative dates — will fail validation
```

### Phone Numbers
```
✅ "+1 555 123 4567"
✅ "(555) 123-4567"
✅ "5551234567"
✅ "+84 123 456 789"         International format
❌ "call me"                 Will fail validation
❌ "555-PLUMBER"             Letters not allowed
```

### IDs
- All IDs are strings — never pass numbers
- Customer IDs typically start with "cus_"
- Job IDs, estimate IDs, lead IDs are UUID strings
- Tag IDs, employee IDs, address IDs are also strings
- Never pass an empty string "" as an ID — will fail validation
- material_category_uuid is REQUIRED for listing/creating materials

### Pagination
```
page: integer >= 1 (default: 1)
page_size: integer 1–100 (default: 10)
sort_direction: "asc" or "desc" only — no other values
```

### Work Status (jobs & estimates)
Valid values — use exactly as written, lowercase with underscores:
```
"unscheduled" | "scheduled" | "in_progress" | "completed" | "canceled"
```

### Job Sort Fields
```
"created_at" | "updated_at" | "invoice_number" | "id" | "description" | "work_status"
```

### Lead Status
```
"open" | "won" | "lost"
```

### Lead Sort Fields
```
"created_at" | "updated_at" | "id" | "status"
```

### Invoice Status Filter
```
"open" | "pending_payment" | "paid" | "voided" | "uncollectible" | "canceled"
```

### Invoice Payment Method Filter
```
"consumer_financing" | "credit_card" | "ach" | "external" | "mobile_check_deposit"
```

### Money / Pricing
- All monetary values are in CENTS (integer), not dollars
- $150.00 = 15000, $9.99 = 999
- This applies to: unit_price, unit_cost, price, cost in materials and line items

---

## Fetch All Pages

Several list tools support `fetch_all: true` to automatically retrieve all pages.
Use this when you need complete data for reporting or bulk operations.

Tools that support fetch_all:
- list_customers
- list_jobs
- list_estimates
- list_leads
- list_invoices
- list_employees
- list_events
- list_tags
- list_materials
- list_pricebook_services

Example prompts:
```
Fetch all customers with fetch_all true and count total
Fetch all completed jobs with fetch_all true from 2025-01-01 to 2025-03-31
Fetch all tags with fetch_all true
```

Warning: fetch_all is capped at 20 pages by default (~200 records with default page_size 10).
For very large datasets use explicit page + page_size parameters instead:
```
List customers page 1 with page_size 100
List customers page 2 with page_size 100
```

---

## Tool Reference by Tag

### Application
| Tool | Method + Path | Description |
|---|---|---|
| get_application | GET /application | Get app config for the company |
| enable_application | POST /application/enable | Enable the app for a company |
| disable_application | POST /application/disable | Disable the app for a company |

### Customers
| Tool | Method + Path | Description |
|---|---|---|
| list_customers | GET /customers | List with search + pagination. Supports fetch_all. |
| get_customer | GET /customers/{id} | Get by ID. Expand with attachments or do_not_service. |
| create_customer | POST /customers | Create new. At least one contact field required. |
| update_customer | PUT /customers/{id} | Update attributes. |
| list_customer_addresses | GET /customers/{id}/addresses | All addresses for a customer. |
| get_customer_address | GET /customers/{id}/addresses/{addr_id} | Single address. |
| create_customer_address | POST /customers/{id}/addresses | Add new address to customer. |

### Employees
| Tool | Method + Path | Description |
|---|---|---|
| list_employees | GET /employees | All active employees. Supports fetch_all. |

### Jobs
| Tool | Method + Path | Description |
|---|---|---|
| list_jobs | GET /jobs | List with filters. Supports fetch_all. |
| get_job | GET /jobs/{id} | Get by ID. Expand with attachments or appointments. |
| create_job | POST /jobs | Create. Requires customer_id + address_id. |
| update_job_schedule | PUT /jobs/{id}/schedule | Set or update job schedule. |
| delete_job_schedule | DELETE /jobs/{id}/schedule | Remove schedule from job. |
| dispatch_job | PUT /jobs/{id}/dispatch | Assign employees to job. |
| add_job_attachment | POST /jobs/{id}/attachments | Upload file attachment. |
| list_job_line_items | GET /jobs/{id}/line_items | List line items. |
| add_job_line_item | POST /jobs/{id}/line_items | Add single line item (rate limited). |
| bulk_update_job_line_items | PUT /jobs/{id}/line_items/bulk_update | Bulk update line items. |
| list_job_input_materials | GET /jobs/{id}/job_input_materials | List materials used. |
| bulk_update_job_input_materials | PUT /jobs/{id}/job_input_materials/bulk_update | Bulk update materials. |
| add_job_tag | POST /jobs/{id}/tags | Add tag to job. |
| remove_job_tag | DELETE /jobs/{id}/tags/{tag_id} | Remove tag from job. |
| add_job_note | POST /jobs/{id}/notes | Add note to job. |
| delete_job_note | DELETE /jobs/{id}/notes/{note_id} | Delete a job note. |
| create_job_link | POST /jobs/{id}/links | Add external link to job. |
| lock_job | POST /jobs/{id}/lock | Lock a single job. |
| lock_jobs_by_time_range | POST /jobs/lock | Bulk lock completed/scheduled jobs by date range. |
| get_job_invoices | GET /jobs/{id}/invoices | All invoices for a specific job. |

**Note on add_job_line_item:** This endpoint is rate limited. Use bulk_update_job_line_items
when adding multiple line items to the same job.

**Note on lock_job:** Only completed or scheduled jobs can be locked.

### Job Appointments
| Tool | Method + Path | Description |
|---|---|---|
| list_job_appointments | GET /jobs/{id}/appointments | Appointments for a multi-day job. |

**Important:** list_job_appointments is READ ONLY for multi-day jobs.
For scheduling a standard single-day job, use update_job_schedule instead.

### Estimates
| Tool | Method + Path | Description |
|---|---|---|
| list_estimates | GET /estimates | List with filters. Supports fetch_all. |
| get_estimate | GET /estimates/{id} | Get by ID. Expand with attachments. |
| create_estimate | POST /estimates | Create. Requires customer_id + address_id. |
| create_estimate_option | POST /estimates/{id}/options | Add option to estimate. |
| list_estimate_option_line_items | GET /estimates/{id}/options/{option_id}/line_items | List line items in an option. |
| create_estimate_option_attachment | POST /estimates/{id}/options/{option_id}/attachments | Add attachment to option. |
| approve_estimate_options | POST /estimates/options/approve | Approve one or more options. May auto-create a job. |

**Estimates structure:** Estimates -> Options -> Line Items (NOT direct line items)
When approving options: if company has "Automatically copy approved estimate to new job"
enabled, the response will include copied_on_approval_to_job_id.

### Invoices
| Tool | Method + Path | Description |
|---|---|---|
| list_invoices | GET /invoices | List all invoices with rich filters. Supports fetch_all. |
| get_invoice | GET /api/invoices/{uuid} | Get a single invoice by UUID. |
| preview_invoice | GET /api/invoices/{uuid}/preview | Preview invoice as HTML. |
| get_job_invoices | GET /jobs/{id}/invoices | All invoices for a specific job. |

**Note:** list_invoices supports rich filtering by status, customer_uuid, payment_method,
created_at range, due_at range, paid_at range, and amount_due range.

### Leads
| Tool | Method + Path | Description |
|---|---|---|
| list_leads | GET /leads | List with filters including status, employee_ids, tag_ids. |
| get_lead | GET /leads/{id} | Get by ID. |
| create_lead | POST /leads | Create. Requires existing customer_id. |
| convert_lead | POST /leads/{id}/convert | Convert to job or estimate. |
| list_lead_line_items | GET /leads/{id}/line_items | Line items for a lead. |

**convert_lead type values:** "job" or "estimate"
**list_leads status filter:** "open", "won", "lost"

### Lead Sources
| Tool | Method + Path | Description |
|---|---|---|
| list_lead_sources | GET /lead_sources | Available lead sources. Searchable by name with q param. |

### Webhooks
| Tool | Method + Path | Description |
|---|---|---|
| create_webhook_subscription | POST /webhooks/subscription | Subscribe to webhook events. |
| delete_webhook_subscription | DELETE /webhooks/subscription | Unsubscribe. |

**Note:** Webhooks are disabled by default and must be subscribed per company.

### Materials
| Tool | Method + Path | Description |
|---|---|---|
| list_materials | GET /api/price_book/materials | List materials. REQUIRES material_category_uuid. |
| create_material | POST /api/price_book/materials | Create. REQUIRES material_category_uuid, name, price, cost. |
| update_material | PUT /api/price_book/materials/{uuid} | Update material. |
| delete_material | DELETE /api/price_book/materials/{uuid} | Delete material. |

**Critical:** material_category_uuid is REQUIRED for both listing and creating materials.
Price and cost are in CENTS (integers). $10.00 = 1000.

### Material Categories
| Tool | Method + Path | Description |
|---|---|---|
| list_material_categories | GET /api/price_book/material_categories | List categories. Use parent_uuid to get subcategories. |

**Note:** Omit parent_uuid to get root-level categories.
Include parent_uuid to get subcategories under a specific category.

### Price Forms
| Tool | Method + Path | Description |
|---|---|---|
| list_price_forms | GET /api/price_book/price_forms | List price forms. |
| get_price_form | GET /api/price_book/price_forms/{uuid} | Get price form by UUID. |
| update_price_form | PUT /api/price_book/price_forms/{uuid} | Update price form. |
| delete_price_form | DELETE /api/price_book/price_forms/{uuid} | Delete price form. |

### Price Book Services
| Tool | Method + Path | Description |
|---|---|---|
| list_pricebook_services | GET /api/price_book/services | List services. Searchable by name/description with q. |
| get_pricebook_service | GET /api/price_book/services/{id} | Get by ID. |
| create_pricebook_service | POST /api/price_book/services | Create service. |
| update_pricebook_service | PUT /api/price_book/services/{id} | Update service. |
| delete_pricebook_service | DELETE /api/price_book/services/{id} | Delete service. |

**list_pricebook_services filters:** online_booking_enabled, managed_by, flat_rate_enabled,
taxable, category, organization_industry — all using eq operator.

### Job Types
| Tool | Method + Path | Description |
|---|---|---|
| list_job_types | GET /job_types | List available job types. |

### Service Zones
| Tool | Method + Path | Description |
|---|---|---|
| list_service_zones | GET /service_zones | List service zones. Filter by zip_code or address. |

### Pipeline
| Tool | Method + Path | Description |
|---|---|---|
| list_pipeline_statuses | GET /pipeline/statuses | Statuses for a resource type. resource_type REQUIRED. |
| update_pipeline_status | PUT /pipeline/statuses | Move resource forward in pipeline. |

**Pipeline rules:**
- resource_type is REQUIRED for list_pipeline_statuses: "lead", "job", or "estimate"
- Movement is FORWARD ONLY — target status must have equal or higher order value
- Returns empty array for organizations without pipeline feature enabled

### Routes
| Tool | Method + Path | Description |
|---|---|---|
| list_routes | GET /routes | Routes by date. Uses per_page (not page_size). Defaults to today. |

**Note:** Routes group employees with their job appointments, events, and estimates
for a given date. Date format: "YYYY-MM-DD".

### Company & Schedule
| Tool | Method + Path | Description |
|---|---|---|
| get_company | GET /company | Company info and settings. |
| get_schedule_windows | GET /company/schedule_availability | Business hours and bookable window config. |
| update_schedule_windows | PUT /company/schedule_availability | Update business hours config. |
| get_booking_windows | GET /company/schedule_availability/booking_windows | Available booking slots. |

**get_booking_windows parameters:**
- show_for_days — integer, how many days to show (default 7)
- start_date — "YYYY-MM-DDTHH:MM:SS", defaults to next available day
- service_id — filter by pros assigned to this service
- service_duration — override window size in minutes (positive integer)
- price_form_id — filter by price form's assigned pros
- employee_ids — filter by specific employee availability

**Duration resolution order:** service_duration -> service's configured duration -> 30 minutes

### Events
| Tool | Method + Path | Description |
|---|---|---|
| list_events | GET /events | List calendar events. Supports location_ids filter. |
| get_event | GET /events/{id} | Get event by ID. |

### Tags
| Tool | Method + Path | Description |
|---|---|---|
| list_tags | GET /tags | List all tags. Sort by created_at or name. |
| create_tag | POST /tags | Create a tag. |
| update_tag | PUT /tags/{id} | Update tag name. |
| delete_tag | DELETE /tags/{id} | Delete a tag. |

---

## Authentication

Two methods — set HOUSECALL_AUTH_METHOD in your .env:

### API Key (recommended for single-company use)
```
HOUSECALL_AUTH_METHOD=apikey
HOUSECALL_API_KEY=your_key_here
```
How to generate: HCP Dashboard -> App Store -> API Key Management -> Generate
Header sent: `Authorization: Token your_key_here`

### OAuth 2.0 (for multi-company / partner apps)
```
HOUSECALL_AUTH_METHOD=oauth
HOUSECALL_CLIENT_ID=your_client_id
HOUSECALL_CLIENT_SECRET=your_client_secret
HOUSECALL_OAUTH_TOKEN=your_token
```
Header sent: `Authorization: Bearer your_token`

**Plan requirement:** API access requires the HCP MAX plan.

---

## Multi-location Support

For companies with multiple locations, two mechanisms are available:

**location_ids query param:** Filter results to specific location IDs.
Available on: list_customers, list_jobs, list_estimates, list_employees, list_events.

**X-Company-Id header:** Set this header to pull data across all locations.
When X-Company-Id is set, location_ids param is ignored.

**Franchise support:** Franchisors can pull data across all child locations
using a single API key. Available on: jobs, estimates, employees, customers endpoints.

---

## Known Limitations

**add_job_line_item is rate limited.**
Use bulk_update_job_line_items when adding multiple line items to the same job.

**Pipeline moves forward only.**
You cannot move a resource to a status with a lower order value.
Always call list_pipeline_statuses first to see valid next statuses.

**Multi-day job scheduling.**
For jobs with more than 1 appointment, use list_job_appointments and the appointments
endpoints instead of update_job_schedule.

**Estimate line items are nested inside Options.**
You cannot add line items directly to an estimate — you must create an Option first,
then add line items to the Option.

**Materials require a category.**
material_category_uuid is required for both GET and POST /api/price_book/materials.
Call list_material_categories first to find the right category UUID.

**notify and notify_pro fire at scheduling time.**
These parameters on update_job_schedule send notifications immediately when the
schedule is set — not when the job is completed or started.

**fetch_all cap.**
fetch_all stops at 20 pages maximum (~200 records with default page_size 10).
For larger datasets use explicit pagination with page + page_size.

**Payment processing.**
Not available via public API. Use the HCP dashboard directly.

**Attachment upload via MCP.**
Attachments require a file accessible via URL. Upload the file to a storage
service first, then pass the URL to add_job_attachment.

**Rate limits.**
Not publicly documented. The server retries automatically up to 3 times with
exponential backoff on 429 Too Many Requests responses.

---

## Error Recovery Guide

| Error | Likely Cause | Fix |
|---|---|---|
| HCP API Error (401): unauthorized | Bad or missing API key | Check HOUSECALL_API_KEY in .env |
| HCP API Error (403): forbidden | Not on MAX plan, or wrong auth method | Upgrade plan or check HOUSECALL_AUTH_METHOD |
| HCP API Error (404): not found | Wrong ID, or feature not available on plan | Double-check the ID value |
| HCP API Error (422): unprocessable | Missing required field or wrong format | Check required params for the tool |
| HCP API Error (429): too many requests | Rate limited | Server will auto-retry — wait a moment |
| Must be ISO 8601 format | Wrong date format | Use "2025-05-01T09:00:00" format |
| Must be a valid phone number | Bad phone format | Use "+1 555 123 4567" format |
| ID cannot be empty | Passed empty string as ID | Fetch the correct ID first |
| Pipeline only moves forward | Tried to set a lower-order status | Call list_pipeline_statuses first |
| material_category_uuid required | Missing required param for materials | Call list_material_categories first |
| estimate option not found | Tried to add line items directly to estimate | Create an option first, then add line items |
