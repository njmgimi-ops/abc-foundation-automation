# Task board

The user wants short task lists in simple Roman Urdu: task + why (kyun) + done-when. No long lessons.
User is on n8n Cloud trial (1,000 executions) and Vapi trial ($5 credit, 1 free inbound-only US number).

## Live resources
- Website: https://njmgimi-ops.github.io/abc-foundation-automation/ (`?n8n=test` sends to /webhook-test/)
- n8n: https://hamasoj.app.n8n.cloud (project id `rZpNJNz8WyWJJl1r`)
  - Workflow `[A4] Lead Capture` id `zFM28M5HfMf2x1Zs`: POST `abc/new-lead` → Leads table (published)
  - Workflow `[TOOLS] Vapi Tools Router` id `m1D7YjNORKeuIT0M`: POST `abc/vapi-tools`, tools `check_availability`, `book_inspection` (published)
  - Workflow `[A5] Vapi End-of-Call Report` id `GiWtYzvoP79M2upQ`: POST `abc/vapi-events` → Calls table (published)
  - Data table `Calls` id `2f6MOpfY1rJWV7D0`
  - Data table `Leads` id `H0SeOVPWC4RfHfHr`, `Appointments` id `zDt1nyhaAllFfxwt`
- Notes: website posts form-urlencoded (avoids CORS preflight). n8n expressions block the field name
  `arguments`, so Vapi tool args are read inside Code nodes.

## Status
- [x] T1 Website live
- [x] T2 Form → n8n → Leads table
- [x] T3 n8n tools for Ava (availability + booking)
- [x] T4 Vapi assistant "Ava – ABC Booking" (id `d3eb4d51-cdcd-4e4f-9442-0af065491385`, v2, GPT-4o-mini + Shimmer) + tools check_availability, book_inspection, end_after_booking_or_decline. check_availability tested OK (exec #12); booking row in Appointments to be confirmed
- [ ] T4b `lookup_customer` tool (find caller by phone in Leads/Appointments)
- [ ] T4c FAQ document + knowledge base (RAG) for company questions
- [x] T5 End-of-call report → Calls table. Workflow `[A5] Vapi End-of-Call Report` id `GiWtYzvoP79M2upQ` (POST `abc/vapi-events`, published), data table `Calls` id `2f6MOpfY1rJWV7D0`. Assistant Server URL set, Server Messages = end-of-call-report only. Tested with 2 real web calls
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
