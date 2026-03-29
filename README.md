# Housecall Pro MCP

[![npm](https://img.shields.io/npm/v/@toducthanh/housecallpro-mcp)](https://www.npmjs.com/package/@toducthanh/housecallpro-mcp)
[![GitHub release](https://img.shields.io/github/v/release/toducthanh/housecallpro-mcp)](https://github.com/toducthanh/housecallpro-mcp/releases)
[![GitHub](https://img.shields.io/badge/GitHub-toducthanh%2Fhousecallpro--mcp-blue?logo=github)](https://github.com/toducthanh/housecallpro-mcp)

> Terminal CLI and Claude Code plugin for the [Housecall Pro](https://www.housecallpro.com/) public API.
> Manage customers, book jobs, create estimates, track invoices, handle leads and more — all from natural language.

---

## Requirements

- Housecall Pro **MAX plan** account
- A Housecall Pro API key or OAuth credentials ([how to get one](#getting-your-api-key))

---

## Installation

There are two ways to use this tool. Choose the one that fits your workflow.

---

### Option A — hcpro terminal CLI

A standalone terminal tool. One curl command installs everything — no manual config needed.

**Requirements:** [Claude Code](https://claude.ai/code) installed — **macOS and Linux only** (Windows not supported)

#### 1. Install

```bash
curl -fsSL https://raw.githubusercontent.com/ToDucThanh/housecallpro-mcp/feature/cli/install.sh | sh
```

> If `~/.local/bin` is not in your `$PATH`, the installer will print the command to add it.

To pin to a specific version:

```bash
HCPRO_VERSION=v0.2.0 curl -fsSL https://raw.githubusercontent.com/ToDucThanh/housecallpro-mcp/feature/cli/install.sh | sh
```

#### 2. Connect Housecall Pro

```bash
hcpro auth login
```

Choose your authentication method when prompted:

- **API Key** *(recommended)* — paste your Housecall Pro API key
- **OAuth 2.0** *(advanced)* — enter your client ID and secret; a browser window opens for authorization

> **API key is recommended for most users.** OAuth 2.0 requires registering `http://localhost:7891/callback` as an allowed redirect URI in your HCP developer dashboard app settings before running this command. If that step is skipped, the authorization will fail.

> API access requires the **MAX plan**. If you get a 403 error, check your plan.

#### 3. Connect Claude

```bash
hcpro auth claude login
```

Choose your Claude authentication method when prompted:

- **API Key** — paste your Anthropic API key (billed per token)
- **Subscription** — uses your existing Claude.ai Pro/Max subscription via Claude Code

> This step is required even if you're already logged into Claude Code. It's not a re-authentication — it just registers which auth method `hcpro` should use. Choosing **Subscription** will be instant if you're already logged in.

#### 4. Start using it

**One-shot query:**

```bash
hcpro "list my jobs today"
hcpro "find customer John Smith"
hcpro "show all open invoices"
```

**Interactive session:**

```bash
hcpro chat
```

#### Check auth status

```bash
hcpro auth status
```

#### Remove credentials

```bash
hcpro auth logout          # remove HCP credentials
hcpro auth claude logout   # remove Claude credentials from hcpro (does not sign out of Claude Code itself)
```

#### Update hcpro

Re-run the install script — it replaces the existing binary in place:

```bash
curl -fsSL https://raw.githubusercontent.com/ToDucThanh/housecallpro-mcp/feature/cli/install.sh | sh
```

#### Uninstall hcpro

```bash
rm -rf ~/.local/lib/hcpro ~/.local/bin/hcpro
```

#### Get help

```bash
hcpro --help
hcpro auth --help
hcpro auth claude --help
```

---

### Option B — Claude Code plugin

For users who prefer to work entirely inside Claude Code.

**Requirements:** [Claude Code](https://claude.ai/code) installed, Node.js 20+

#### Step 1 — Register the marketplace

```bash
/plugin marketplace add toducthanh/housecallpro-mcp
```

> To scope to the current project only, add `--scope local`. To share with all repo collaborators, add `--scope project`.

#### Step 2 — Install and configure the plugin

Run `/plugin` → open the **Marketplaces** tab → select `toducthanh` → **Browse plugins** → find `housecallpro-mcp` → install it.

After install, go to the **Installed** tab → select `housecallpro-mcp` → **Configure options** and enter your credentials:

**API key auth *(recommended)*:**

| Option | Value |
|---|---|
| Authentication method | `apikey` |
| Housecall Pro API key | your API key |

**OAuth 2.0 *(advanced)*:**

| Option | Value |
|---|---|
| Authentication method | `oauth` |
| Housecall Pro client ID | your OAuth client ID |
| Housecall Pro client secret | your OAuth client secret |
| Housecall Pro OAuth token | your OAuth access token |

> OAuth for the plugin requires you to obtain an access token manually (e.g. from your HCP developer dashboard). There is no automatic token refresh — when the token expires you will need to update it manually in Configure options. **API key is recommended.**

> You can also install via CLI (user scope by default):
> ```bash
> /plugin install housecallpro-mcp@toducthanh
> ```
> Then configure credentials through `/plugin` → Installed tab → Configure options.

Run `/reload-plugins` to activate the plugin.

#### Verify it's working

Run inside Claude Code:

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

The AI will automatically chain these steps:

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
| `/skills` shows nothing | Plugin not loaded | Re-run steps 1 & 2, then `/reload-plugins` |
| `/mcp` doesn't show housecallpro | MCP not started | Go to `/plugin` → Installed → Configure options and verify credentials |
| `HCP credentials not configured` | `hcpro auth login` not run | Run `hcpro auth login` |
| `Claude credentials not configured` | `hcpro auth claude login` not run | Run `hcpro auth claude login` |
| `claude binary not found` | Claude Code not installed | Install from [claude.ai/code](https://claude.ai/code) |

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

**Fast iteration:** load the plugin for the current session only, no install needed:

```bash
claude --plugin-dir .
```

Use `/reload-plugins` inside the session to pick up changes without restarting.

### CLI development

```bash
cd cli
bun install
bun test                  # run all tests
bun run dev               # run CLI in dev mode (no build needed)
```

**Run a command in dev mode:**

```bash
bun run src/index.ts auth status
bun run src/index.ts "list my jobs today"
bun run src/index.ts chat
```

**Build binaries locally:**

```bash
bun run build:darwin-arm64   # macOS Apple Silicon
bun run build:darwin-x64     # macOS Intel
bun run build:linux-x64      # Linux x64
bun run build:linux-arm64    # Linux ARM
```

Binaries are output to `../dist/`.

**Full install flow test:**

```bash
# Register the local marketplace scoped to this project only
claude plugin marketplace add ./ --scope local

# Then in Claude Code: /plugin → Discover → install housecallpro-mcp → Configure options
```

To clean up after testing:

**Option A — Remove the marketplace (removes the plugin too):**

```bash
claude plugin marketplace remove toducthanh --scope local
```

**Option B — Uninstall the plugin first, then remove the marketplace:**

```bash
# Via CLI
claude plugin uninstall housecallpro-mcp --scope local

# Or via UI: /plugin → Installed tab → select housecallpro-mcp → Uninstall
```

Then remove the marketplace:

```bash
# Via CLI
claude plugin marketplace remove toducthanh --scope local

# Or via UI: /plugin → Marketplaces tab → select toducthanh → Remove
```

---

## Links

- [Housecall Pro API Docs](https://docs.housecallpro.com/docs/housecall-public-api)
- [npm package](https://www.npmjs.com/package/@toducthanh/housecallpro-mcp)
- [GitHub repo](https://github.com/toducthanh/housecallpro-mcp)
- [GitHub releases](https://github.com/toducthanh/housecallpro-mcp/releases)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code](https://claude.ai/code)

---

## License

Code released under the [MIT License](LICENSE).
