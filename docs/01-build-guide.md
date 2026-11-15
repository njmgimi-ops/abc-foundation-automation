# 🧭 Build guide: n8n + Vapi + Claude Code (step by step)

> Rule: **one automation at a time.** Build → test with `website/lab.html` → check the n8n execution → publish → next.
> Har step ke saath ek "Claude Code prompt" diya hai. Pehle khud samjho kya ho raha hai, phir Claude se banwao, phir n8n mein khol kar har node dekho.

---

## Phase 0 — Setup (one time) ⚙️

```
Step 0.1 Accounts ─► 0.2 Google Sheet ─► 0.3 MCP connect ─► 0.4 Website config ─► 0.5 First test
```

### 0.1 Accounts
- **n8n** (Cloud trial or self-hosted Community Edition). Use n8n **2.18.4+** for MCP workflow building.
- **Vapi**: dashboard.vapi.ai, then copy the private API key.
- **Google**: one Gmail account for Sheets, Calendar, Drive, Gmail.
- **Twilio** (later, Phase 1B+): a US number for SMS and for outbound Vapi calls (free Vapi numbers can't call out).

### 0.2 Google Sheet
Create the sheet **"ABC CRM"** with the tabs and headers from `docs/02-data-model.md`.

### 0.3 Connect Claude Code (run in your terminal, in this project folder)
```bash
claude mcp add --transport http n8n https://<your-n8n-domain>/mcp-server/http
```
```bash
claude mcp add --transport http vapi https://mcp.vapi.ai/mcp --header "Authorization: Bearer <VAPI_PRIVATE_KEY>"
```
Then inside `claude`:
```
/plugin marketplace add VapiAI/skills
/plugin install vapi-voice-ai@vapi-skills
/mcp
```
`/mcp` → select **n8n** → finish the OAuth login. ✅ Test: ask *"List my Vapi assistants"* and *"List my n8n workflows"*.
In n8n, enable **Settings → Instance-level MCP** first.

### 0.4 Website config
Open `website/assets/config.js` → set `N8N_BASE_URL` and keep `USE_TEST_URL: true` while building.
Run locally:
```bash
cd website && python3 -m http.server 8080
```
Then open http://localhost:8080. Any static host works for going live (Netlify, Vercel, GitHub Pages…).

### 0.5 CORS
The browser calls n8n directly, so on every Webhook node set **Options → Allowed Origins (CORS)** to your site's origin
(e.g. `http://localhost:8080, https://your-site.netlify.app`).

---

## Phase 1 — First money-maker: A4 Speed-to-Lead + B1 Missed Call Text-Back 🟢

### Lesson A4 — what you are building
```
Website form ─► [Webhook abc/new-lead] ─► [Respond 200] 
                     └─► [IF consent_ai_call] ─► [Code: in calling hours?]
                              ├─ yes ─► [Sheets: append lead] ─► [HTTP: POST api.vapi.ai/call] ─► [Sheets: status=Calling]
                              └─ no  ─► [Sheets: append lead, status=Queued]   (a morning schedule calls them)
Vapi end-of-call ─► [Webhook abc/vapi-events] ─► [Switch on message.type] ─► end-of-call-report ─► [Sheets: update lead]
```

**Step 1 — Vapi assistant** (Claude Code prompt):
> Use the create-assistant skill. Create a Vapi assistant named "Ava – ABC Outbound" using the system prompt in
> vapi/receptionist-prompt.md. First message for outbound: the opener in that file. Set the assistant server URL to
> https://<n8n>/webhook/abc/vapi-events and enable the end-of-call-report server message. Don't add tools yet.
> Show me the config before creating it.

**Step 2 — n8n workflow** (Claude Code prompt):
> Using the n8n MCP, build a workflow "[A4] Speed-to-Lead" exactly as in docs/01-build-guide.md Phase 1.
> Webhook path abc/new-lead (POST, respond immediately with 200 {"ok":true}), Allowed Origins = http://localhost:8080.
> IF consent_ai_call is true. Code node: calling hours 08:00–21:00 America/Chicago.
> Google Sheets "ABC CRM" tab Leads: append (generate lead_id).
> HTTP Request POST https://api.vapi.ai/call with header auth credential "Vapi API",
> body {assistantId, phoneNumberId, customer:{number: phone, name}, assistantOverrides:{variableValues:{name}}}.
> Use placeholders for IDs and credentials, and tell me which credentials to create in the n8n UI.
> Don't publish. I'll test first.

**Step 3 — Test**
1. In n8n click **Execute workflow** (listening on the test URL).
2. `website/lab.html` → card **A4** → ⚡ Fire. Or submit the home page form.
3. Check: execution green? Row in Sheets? (Use your own phone number for the real call test.)

**Step 4 — End-of-call workflow** (prompt):
> Build "[A4b] Vapi Events": Webhook abc/vapi-events → Switch on body.message.type →
> end-of-call-report: find the lead by message.call.customer.number in Leads and update status from endedReason,
> notes = the call summary, last_call_id. Inspect the first real execution to confirm the exact field paths
> (summary/analysis vs artifact.transcript) before mapping them. Append to Calls and Events tabs.

**Step 5 — Publish** both workflows. Set `USE_TEST_URL: false` in config.js.

### Lesson B1 — Missed Call Text-Back
> Build "[B1] Missed Call Text-Back": Webhook abc/twilio-status (form-urlencoded) → IF CallStatus in
> [no-answer, busy, failed] → Twilio node send SMS to From: "Sorry we missed your call! Reply here or book: <site>/book.html"
> → Sheets append Events. Then explain where to paste this URL in the Twilio number's call status callback.

⚠️ Real US SMS needs **A2P 10DLC** registration first (see docs/03-compliance.md). For practice, text your own number.

---

## Phase 2 — Inbound receptionist + booking + reviews 🔵 (A1, A2, A3, B3, C1, E2)
Prompts to give Claude Code, one at a time:
1. *"Build '[TOOLS] Vapi Tools Router': Webhook abc/vapi-tools (respond via Respond to Webhook) → Switch on
   message.toolCallList[0].function.name → lookup_customer / save_qualification / check_availability / book_inspection.
   Each branch returns {results:[{toolCallId, result}]}. Use Google Calendar for availability/booking."*
2. *"Create the 4 function tools from vapi/tools.json in Vapi (server URL = my n8n production URL) and attach them +
   the transferCall tool to a new inbound assistant 'Ava – ABC Inbound'. Then attach it to my phone number."*
3. *"Add a structured output to Ava for {isOwner, zip, foundationType, symptoms, timeline, urgency} (A2)."*
4. *"Build [A3/B3] Appointments: Webhook abc/appointment handles action=book|reschedule from website/book.html."*
5. *"Build [B3] Reminders: hourly schedule → events 24h and 2h ahead → SMS with book.html?appt=<id>."*
6. *"Build [C1] Media: Webhook abc/inspection-media (binary on) → Drive folder /Jobs/<appointmentId>/ → save link."*
7. *"Build [E2] Reviews: send review.html?job=…&name=… to every paid customer. Webhook abc/review-feedback emails the owner."*

## Phase 3 — Nurture & field ops 🟣 (A6, B2, B4, C2, D2, E4)
## Phase 4 — Money: proposals, e-sign, deposits, invoices 🟠 (A5, B5, C3, C4, E1, E3)
## Phase 5 — Advanced dispatch & permits 🔴 (D1, D3, D4)

The flow for each automation is in `website/assets/automations.js` (also visible on `roadmap.html`).
Prompt pattern:
> "Build automation <ID> from website/assets/automations.js. Follow CLAUDE.md conventions.
> List the credentials I must create, build it unpublished, then give me the Lab payload to test it."

---

## ✅ Definition of done (for every automation — this is what real clients check)
- [ ] Works with the Lab payload **and** with the real trigger (form / call / webhook)
- [ ] Error path: Error Trigger workflow emails you when anything fails
- [ ] Writes one row to **Events**
- [ ] No hard-coded keys; credentials in n8n
- [ ] Consent / STOP / calling-hours respected
- [ ] Exported JSON saved to `n8n/<ID>-name.json` + a 60-second Loom for your portfolio
