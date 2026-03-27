# @toducthanh/housecallpro-mcp

> MCP server and Claude Code plugin for the [Housecall Pro](https://www.housecallpro.com/) public API.
> Manage customers, book jobs, create estimates, track invoices, handle leads and more — all from natural language in Claude Code.

---

## Requirements

- [Claude Code](https://claude.ai/code) installed
- Housecall Pro **MAX plan** account
- A Housecall Pro API key ([how to get one](#getting-your-api-key))
- Node.js 20+

---

## Installation — 3 steps

### Step 1 — Register the marketplace

```bash
/plugin marketplace add toducthanh/housecallpro-mcp
```

### Step 2 — Install the plugin (skills)

```bash
/plugin install housecallpro-mcp@toducthanh
```

This loads the Housecall Pro skill into Claude Code — workflow guides,
field formats, example prompts, and tool reference.

### Step 3 — Register the MCP server with your API key

```bash
claude mcp add housecallpro --scope user \
  -e HOUSECALL_API_KEY=your_api_key_here \
  -- npx -y @toducthanh/housecallpro-mcp@latest
```

Replace `your_api_key_here` with your real API key.

### Verify it's working

Restart Claude Code, then run:

```bash
/skills    ← should list housecallpro
/mcp       ← should show housecallpro connected
```

Then try a live test:

```bash
Use the housecallpro MCP to get my company information
```

---

## Getting your API key

1. Log into your Housecall Pro account
2. Go to **App Store** → **API Key Management** → **Generate**
3. Copy the key and keep it secure

> API access requires the **MAX plan**. If you get a 403 error, check your plan.

---

## Usage — Example prompts

### Customers

```bash
List my first 10 customers
Find customer named "John Smith"
Create a customer Jane Doe with email jane@example.com and mobile +1 555 123 4567
Get all addresses for customer {customer_id}
Fetch all customers with fetch_all true and tell me the total count
```

### Booking & scheduling

```bash
Book a job for customer {customer_id} at address {address_id} on 2025-05-01 at 9am for 1 hour
Find customer John Smith, get his address, create a job and schedule it for next Monday 9am
Reschedule job {job_id} to 2025-05-10 at 2pm and notify the customer
Dispatch job {job_id} to employee {employee_id}
List all scheduled jobs for this week
List all unscheduled jobs
Get available booking windows for the next 7 days
```

### Estimates & invoices

```bash
Create an estimate for customer {customer_id} at address {address_id}
Add an option "Standard Package" with a labor line item to estimate {estimate_id}
Approve estimate option {option_id}
List all open invoices
Get all invoices for job {job_id}
List invoices created between 2025-01-01 and 2025-03-31
```

### Leads

```bash
Create a lead for customer {customer_id}
List all open leads
Convert lead {lead_id} to a job
```

### Reporting & bulk

```bash
Fetch all completed jobs with fetch_all true for Q1 2025
Fetch all customers with fetch_all true and count how many have no address
List all employees
Get company information
```

---

## Workflow guides

### Book a job for an existing customer

Claude Code will automatically chain these steps:

1. `list_customers` → find customer_id
2. `list_customer_addresses` → find address_id
3. `create_job` → create the job
4. `update_job_schedule` → schedule it
5. `dispatch_job` → assign a technician (optional)

**Example prompt:**

```bash
Find customer John Smith, get his first address, create a job there
scheduled for 2025-05-01 9am-10am with 60 min arrival window,
notify the customer, and dispatch to employee Mike Johnson
```

### Book a job for a brand new customer

```bash
Create a new customer Sarah Connor, phone +1 555 999 0000,
add her address 123 Main St Austin TX 78701,
then book a job there for 2025-05-02 at 2pm for 2 hours
```

### Create an estimate with options

Estimates use a two-level structure — **Options first, then Line Items inside each Option**.

```bash
Create an estimate for customer {customer_id} at address {address_id},
add an option called "Standard Package" with a labor line item at $150,
then approve it
```

### Lead to job conversion

```bash
Create a lead for customer {customer_id},
show me the pipeline statuses,
move it to the next status,
then convert it to a job and schedule it for next Monday at 10am
```

---

## Field formats

| Field | Valid format | Invalid |
|---|---|---|
| Dates | `"2025-05-01T09:00:00"` | `"05/01/2025"`, `"next Monday"` |
| Phones | `"+1 555 123 4567"` | `"555-PLUMBER"` |
| Work status | `"scheduled"`, `"completed"` etc | `"done"`, `"pending"` |
| Money | Integer cents — `$150 = 15000` | `150.00` |
| IDs | Non-empty strings | `""` (empty) |

Valid work status values: `unscheduled` · `scheduled` · `in_progress` · `completed` · `canceled`

---

## Fetch all pages

Several list tools support `fetch_all: true` to automatically retrieve all pages:

```bash
Fetch all customers with fetch_all true
Fetch all completed jobs with fetch_all true from 2025-01-01 to 2025-03-31
```

Supported on: `list_customers`, `list_jobs`, `list_estimates`, `list_leads`,
`list_invoices`, `list_employees`, `list_events`, `list_tags`, `list_materials`,
`list_pricebook_services`

> Capped at 20 pages (~200 records) by default. Use explicit `page` + `page_size` for larger datasets.

---

## Authentication

### API Key (single-company use — recommended)

```bash
claude mcp add housecallpro --scope user \
  -e HOUSECALL_API_KEY=your_key \
  -e HOUSECALL_AUTH_METHOD=apikey \
  -- npx -y @toducthanh/housecallpro-mcp
```

### OAuth 2.0 (multi-company / partner apps)

```bash
claude mcp add housecallpro --scope user \
  -e HOUSECALL_AUTH_METHOD=oauth \
  -e HOUSECALL_OAUTH_TOKEN=your_oauth_token \
  -- npx -y @toducthanh/housecallpro-mcp
```

---

## Error reference

| Error | Cause | Fix |
|---|---|---|
| `HCP API Error (401)` | Bad or missing API key | Check `HOUSECALL_API_KEY` |
| `HCP API Error (403)` | Not on MAX plan | Upgrade plan or check `HOUSECALL_AUTH_METHOD` |
| `HCP API Error (404)` | Wrong ID or unavailable endpoint | Double-check the ID |
| `HCP API Error (422)` | Missing required field | Check required params |
| `HCP API Error (429)` | Rate limited | Server auto-retries — wait and retry |
| `Must be ISO 8601 format` | Wrong date format | Use `"2025-05-01T09:00:00"` |
| `Must be a valid phone number` | Invalid phone | Use `"+1 555 123 4567"` |
| `ID cannot be empty` | Empty string as ID | Fetch the correct ID first |
| `/skills` shows nothing | Plugin not loaded | Re-run steps 1 & 2, restart Claude Code |
| `/mcp` doesn't show housecallpro | MCP not registered | Re-run step 3 |

---

## Known limitations

- **Pipeline** moves forward only — you cannot set a lower-order status
- **Availability/booking slot endpoints** — use `get_booking_windows` for available slots
- **Estimates** use Options → Line Items (not direct like Jobs)
- **Materials** require `material_category_uuid` — call `list_material_categories` first
- **Payment processing** — not available via public API, use HCP dashboard
- **fetch_all** is capped at 20 pages by default
- **Rate limits** — not published by HCP; server auto-retries up to 3 times with backoff

---

## Tools overview

70+ tools across all Housecall Pro API resources:

| Resource | Tools |
|---|---|
| Customers | list, get, create, update, addresses |
| Jobs | list, get, create, schedule, dispatch, line items, notes, tags, lock, invoices |
| Estimates | list, get, create, options, line items, approve |
| Invoices | list, get, preview |
| Leads | list, get, create, convert, line items |
| Employees | list |
| Tags | list, create, update, delete |
| Events | list, get |
| Materials | list, create, update, delete |
| Price Book | services, price forms |
| Pipeline | statuses, update status |
| Routes | list |
| Company | get, schedule windows, booking windows |
| Webhooks | subscribe, unsubscribe |
| Application | get, enable, disable |

---

## Development

```bash
git clone https://github.com/toducthanh/housecallpro-mcp
cd housecallpro-mcp
npm install
npm run generate-types   # generate types from housecall_v1.yaml
npm run build
npm run dev
```

Test locally with Claude Code:

```bash
claude --plugin-dir .
```

Then register the MCP pointing to your local build:

```bash
claude mcp add housecallpro --scope user \
  -e HOUSECALL_API_KEY=your_key \
  -e HOUSECALL_AUTH_METHOD=apikey \
  -- node /path/to/housecallpro-mcp/dist/index.js
```

---

## Links

- [Housecall Pro API Docs](https://docs.housecallpro.com/docs/housecall-public-api)
- [npm package](https://www.npmjs.com/package/@toducthanh/housecallpro-mcp)
- [GitHub repo](https://github.com/toducthanh/housecallpro-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code](https://claude.ai/code)
