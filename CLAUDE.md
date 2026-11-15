# ABC Foundation Repair — n8n + Vapi automation practice project

This repo is a practice/portfolio build of 23 business automations for a (fictional) Dallas
foundation repair company. Claude Code builds the n8n workflows and Vapi assistants through MCP.

## Layout
- `website/` — static site. Every form POSTs JSON to an n8n Webhook. Edit `website/assets/config.js` only.
  - `assets/automations.js` — the 23 automations (id, trigger, flow, sample payload). Source of truth.
  - `lab.html` — fires sample payloads at each webhook. `roadmap.html` — client-facing blueprint.
- `docs/` — build guide, data model (Google Sheets CRM), webhook contracts, compliance rules.
- `vapi/` — assistant system prompts and tool definitions.
- `n8n/` — exported workflow JSON (export after building, for the portfolio).

## Conventions
- Webhook paths: `abc/<name>` (see `config.js` → `WEBHOOKS`). Lab/simulated events go to `abc/lab-event`
  with an `event` field; route them with a Switch node.
- CRM = Google Sheet "ABC CRM" with tabs: Leads, Appointments, Proposals, Jobs, Calls, Events (see docs/02-data-model.md).
- Phone numbers are always E.164 (`+12145550123`). Times are ISO 8601 with timezone `America/Chicago`.
- Vapi function tools point at n8n Production webhook URLs and must answer
  `{"results":[{"toolCallId":"<id>","result":"<string>"}]}` via a "Respond to Webhook" node.
- Workflow names: `[A4] Speed-to-Lead`, `[B1] Missed Call Text-Back`, … (prefix = automation id).

## Hard rules (real-client compliance)
- Never place an AI outbound call unless the lead has `consent_ai_call = true` and `dnc != true` (FCC 24-17 / TCPA).
- Only call 8am–9pm in the recipient's local time; otherwise queue for the next morning.
- Every SMS flow must honour STOP. US SMS from a 10DLC number needs A2P 10DLC registration.
- Review requests go to EVERY customer with the same Google link. Never route by rating (Google Maps content policy).
- Do not quote financing rates/approvals; only the lender can.
- Never hard-code API keys in workflows or this repo. Use n8n credentials.
- Build one automation at a time, test with `website/lab.html`, then publish.
