# Task board

The user wants short task lists in simple Roman Urdu: task + why (kyun) + done-when. No long lessons.
User is on n8n Cloud trial (1,000 executions) and Vapi trial ($5 credit, 1 free inbound-only US number).

## Live resources
- Website: https://njmgimi-ops.github.io/abc-foundation-automation/ (`?n8n=test` sends to /webhook-test/)
- n8n: https://hamasoj.app.n8n.cloud (project id `rZpNJNz8WyWJJl1r`)
  - Workflow `[A4] Lead Capture` id `zFM28M5HfMf2x1Zs`: POST `abc/new-lead` → Leads table (published)
  - Workflow `[TOOLS] Vapi Tools Router` id `m1D7YjNORKeuIT0M`: POST `abc/vapi-tools`, tools `check_availability`, `book_inspection` (published)
  - Data table `Leads` id `H0SeOVPWC4RfHfHr`, `Appointments` id `zDt1nyhaAllFfxwt`
- Notes: website posts form-urlencoded (avoids CORS preflight). n8n expressions block the field name
  `arguments`, so Vapi tool args are read inside Code nodes.

## Status
- [x] T1 Website live
- [x] T2 Form → n8n → Leads table
- [x] T3 n8n tools for Ava (availability + booking)
- [ ] T4 Vapi assistant "Ava – ABC Booking" + 2 function tools → server URL `https://hamasoj.app.n8n.cloud/webhook/abc/vapi-tools` (spec: `vapi/lesson2-ava-setup.md`)
- [ ] T4b `lookup_customer` tool (find caller by phone in Leads/Appointments)
- [ ] T4c FAQ document + knowledge base (RAG) for company questions
- [ ] T5 End-of-call report → Calls table (webhook `abc/vapi-events`)
- [ ] T6 Lead score from Ava structured output
- [ ] T7 Outside-DFW ZIP → no AI call
- [ ] T8 Emergency transfer
- [ ] T9 Free Vapi number → Ava inbound
- [ ] T10 Gmail + Google Calendar credentials in n8n
- [ ] T11 Booking confirmation email
- [ ] T12 24h reminder
- [ ] T13 Reschedule form
- [ ] T14 Photo upload → Drive
- [ ] T15 Proposal page link
- [ ] T16 Proposal follow-up
- [ ] T17 Review + referral
- [ ] T18–T20 Outbound call, SMS, reactivation (after Twilio)
- [ ] T21–T23 Export, demo videos, portfolio links
