/*
 * Single source of truth for all 23 automations.
 * Used by: roadmap.html (client-facing blueprint) and lab.html (test console).
 *
 * phase = recommended build order (1 = build first). Each phase reuses what the earlier one built.
 * webhook = key in ABC_CONFIG.WEBHOOKS that the Lab fires. "labEvent" = simulated backend event.
 */
window.ABC_AUTOMATIONS = [
  /* ───────────── A. AI VOICE AGENTS ───────────── */
  {
    id: "A1", cat: "AI Voice Agents", title: "24/7 Inbound Call Receptionist", phase: 2, level: "Intermediate",
    problem: "Calls after 5pm and on weekends go to voicemail, and most callers who reach voicemail call a competitor.",
    trigger: "Inbound call to the business number (Vapi phone number → assistant)",
    flow: [
      "Vapi assistant 'Ava' answers, identifies intent (new inspection, existing job, emergency, other)",
      "Tool lookup_customer → n8n Webhook → Google Sheets 'Leads' search by phone",
      "Tool check_availability / book_inspection → n8n → Google Calendar",
      "Vapi end-of-call-report → n8n → save transcript, summary, recording URL to Sheets",
      "n8n → Slack/Email to office with call summary"
    ],
    vapi: "Inbound assistant + function tools (server URL = n8n webhook)",
    tools: ["Vapi", "n8n", "Google Sheets", "Google Calendar", "Gmail/Slack"],
    webhook: "labEvent",
    sample: { event: "vapi.end_of_call_report", callId: "call_demo_001", customer: { number: "+12145550199" }, endedReason: "customer-ended-call", summary: "Caller noticed a stair-step crack in brick. Booked free inspection Tue 10am.", structured: { intent: "new_inspection", urgency: "normal" } }
  },
  {
    id: "A2", cat: "AI Voice Agents", title: "Automated Lead Qualification", phase: 2, level: "Intermediate",
    problem: "Inspectors waste trips on renters, out-of-area addresses and tyre-kickers.",
    trigger: "During any AI call (inbound or outbound)",
    flow: [
      "Assistant asks the qualification questions: owner or renter, ZIP in service area, foundation type, symptoms, timeline",
      "Vapi structured output extracts {isOwner, zip, foundationType, symptoms[], timeline}",
      "n8n Code node scores the lead (e.g. owner+in-area+symptoms = Hot)",
      "Update Sheets 'Leads'.score + .status, route Hot → booking, Cold → nurture (B2)"
    ],
    vapi: "Structured output on the assistant (create-structured-output skill)",
    tools: ["Vapi", "n8n", "Google Sheets"],
    webhook: "labEvent",
    sample: { event: "vapi.structured_output", callId: "call_demo_002", data: { isOwner: true, zip: "75040", foundationType: "slab", symptoms: ["sticking doors", "drywall cracks"], timeline: "this month" } }
  },
  {
    id: "A3", cat: "AI Voice Agents", title: "Direct Inspection Appointment Booking", phase: 2, level: "Intermediate",
    problem: "Back-and-forth phone tag to schedule an inspection loses leads.",
    trigger: "Caller agrees to an inspection during a Vapi call, or the website booking page",
    flow: [
      "Tool check_availability → n8n → Google Calendar free/busy for the next 5 business days",
      "Assistant offers 2 slots and the caller picks one",
      "Tool book_inspection → n8n → Calendar event + Sheets 'Appointments' row",
      "n8n → confirmation SMS (Twilio) + email (Gmail) with the photo upload link (C1)"
    ],
    vapi: "Function tools: check_availability, book_inspection (or Vapi's native Google Calendar tools)",
    tools: ["Vapi", "n8n", "Google Calendar", "Twilio", "Gmail"],
    webhook: "appointment",
    sample: { action: "book", name: "Maria Lopez", phone: "+12145550111", email: "maria@example.com", address: "412 Elm St, Garland, TX 75040", slotStart: "2026-11-18T10:00:00-06:00", source: "website" }
  },
  {
    id: "A4", cat: "AI Voice Agents", title: "Instant Speed-to-Lead Outbound Calling", phase: 1, level: "Beginner → Intermediate",
    problem: "Web leads called back hours later have gone cold. Calling within a minute books far more inspections.",
    trigger: "Website form submit → n8n Webhook 'abc/new-lead'",
    flow: [
      "Webhook receives lead (with consent = true) → Respond 200 immediately",
      "IF consent_ai_call = true AND inside calling hours (8am–9pm Central) → continue, else queue for morning",
      "Sheets: append lead (status = New)",
      "HTTP Request → POST https://api.vapi.ai/call {assistantId, phoneNumberId, customer.number, assistantOverrides.variableValues}",
      "Vapi end-of-call-report → n8n → update lead status (Booked / No answer / Not interested)"
    ],
    vapi: "Outbound assistant on an IMPORTED number (free Vapi numbers can't make outbound calls)",
    tools: ["Website", "n8n", "Vapi", "Twilio number", "Google Sheets"],
    webhook: "newLead",
    sample: { name: "Daniel Kim", phone: "+12145550123", email: "dan@example.com", zip: "75214", service: "Concrete Slab Foundation Repair", message: "Door won't close, crack over window", consent_ai_call: true, consent_sms: true, source: "website-hero-form" }
  },
  {
    id: "A5", cat: "AI Voice Agents", title: "Old Database Reactivation Calls", phase: 4, level: "Advanced",
    problem: "Hundreds of past estimates and old leads sit unused in a spreadsheet.",
    trigger: "Manual run or Schedule Trigger (e.g. 1st of the month)",
    flow: [
      "Sheets: read 'Leads' where status in (Estimate Sent, Lost) AND last_contact > 180 days AND consent_ai_call = true AND dnc = false",
      "Loop Over Items (batch of 20) → Vapi Campaign or POST /call per lead",
      "Assistant opens with context (\"we inspected your home in March…\")",
      "end-of-call-report → update status, book if interested, mark DNC on opt-out"
    ],
    vapi: "Vapi Campaigns (create-campaign skill) or batched POST /call",
    tools: ["n8n", "Vapi", "Google Sheets"],
    webhook: "labEvent",
    sample: { event: "reactivation.run", filter: { statuses: ["Estimate Sent", "Lost"], olderThanDays: 180 }, batchSize: 20 }
  },
  {
    id: "A6", cat: "AI Voice Agents", title: "Emergency Triage & Call Routing", phase: 3, level: "Intermediate",
    problem: "A real emergency (water flooding, a wall pulling away, gas smell) must reach a human now, not a booking slot.",
    trigger: "Caller describes an emergency on the AI line, or the website emergency form",
    flow: [
      "Assistant runs the triage questions. Gas smell or immediate danger → tell the caller to leave and call 911 or the gas utility first",
      "Structural/water emergency → Vapi Transfer Call tool → on-call manager (warm transfer with summary on Twilio)",
      "Transfer not answered → n8n → SMS + call the backup on-call person, log the incident",
      "Non-emergency → normal booking (A3)"
    ],
    vapi: "Transfer Call tool (warm-transfer-say-summary needs Twilio telephony)",
    tools: ["Vapi", "Twilio", "n8n", "Google Sheets"],
    webhook: "emergency",
    sample: { name: "Robert Hayes", phone: "+12145550177", address: "88 Oak Ln, Dallas, TX 75218", issue: "Water coming up through slab crack in kitchen", danger: false, source: "website-emergency" }
  },

  /* ───────────── B. COMMUNICATION & FOLLOW-UP ───────────── */
  {
    id: "B1", cat: "Communication & Follow-up", title: "Missed Call Text-Back", phase: 1, level: "Beginner",
    problem: "When the office line rings out, the caller gets nothing back.",
    trigger: "Twilio call status callback with CallStatus = no-answer / busy (office line), or a Vapi call that ended unanswered",
    flow: [
      "Webhook ← Twilio status callback (form-encoded)",
      "IF CallStatus in [no-answer, busy, failed]",
      "Twilio node → SMS: 'Sorry we missed you — reply here or book: <link>'",
      "Sheets: log missed call. Optional: wait 2 min, then an AI callback (A4)"
    ],
    vapi: "Optional AI callback",
    tools: ["Twilio", "n8n", "Google Sheets"],
    webhook: "labEvent",
    sample: { event: "twilio.call_status", CallSid: "CA_demo", From: "+12145550155", To: "+12145550142", CallStatus: "no-answer" }
  },
  {
    id: "B2", cat: "Communication & Follow-up", title: "Multi-Channel Lead Nurture (SMS, Email, WhatsApp)", phase: 3, level: "Intermediate",
    problem: "Leads that didn't book get one call and are then forgotten.",
    trigger: "Lead status = Not Booked (from A4/A2)",
    flow: [
      "Day 0: SMS 'Here's what Blackland clay does to slabs' + booking link",
      "Day 2: Email with photos of common signs (doors, cracks, gaps)",
      "Day 5: WhatsApp template message (needs an approved template outside the 24h window)",
      "Before each step: re-read the lead. Stop if status = Booked or opted out (STOP)"
    ],
    vapi: "—",
    tools: ["n8n (Wait nodes or Schedule + Sheets)", "Twilio", "Gmail", "WhatsApp Business Cloud"],
    webhook: "labEvent",
    sample: { event: "nurture.start", leadId: "L-1007", phone: "+12145550123", email: "dan@example.com", channels: ["sms", "email", "whatsapp"] }
  },
  {
    id: "B3", cat: "Communication & Follow-up", title: "Appointment Reminders & Rescheduling", phase: 2, level: "Beginner",
    problem: "Homeowners forget the inspection, so the inspector drives out to an empty house.",
    trigger: "Schedule Trigger every hour → Calendar events starting in 24h and in 2h",
    flow: [
      "Google Calendar: get events in window → match Sheets 'Appointments'",
      "SMS reminder with a reschedule link (website/book.html?appt=…)",
      "Reschedule form → Webhook 'abc/appointment' action=reschedule → move the Calendar event → confirm",
      "Optional: Vapi reminder call if the SMS gets no reply"
    ],
    vapi: "Optional scheduled reminder call (POST /call supports scheduling)",
    tools: ["n8n", "Google Calendar", "Twilio", "Website"],
    webhook: "appointment",
    sample: { action: "reschedule", appointmentId: "APT-2041", phone: "+12145550111", newSlotStart: "2026-11-19T14:00:00-06:00", reason: "Work conflict" }
  },
  {
    id: "B4", cat: "Communication & Follow-up", title: "Unsold Estimate / Quote Follow-up Sequence", phase: 3, level: "Intermediate",
    problem: "Most estimates are never followed up, and that is money left on the table.",
    trigger: "Proposal status = Sent and not signed after 2 days (daily Schedule Trigger)",
    flow: [
      "Day 2 SMS: 'Any questions on your proposal?' + link",
      "Day 5 AI call: answers FAQs (warranty, timeline, financing) and offers a callback from the estimator",
      "Day 10 Email: case study + financing option (B5)",
      "Stop on: signed, declined or opt-out"
    ],
    vapi: "Outbound follow-up assistant with proposal variables",
    tools: ["n8n", "Twilio", "Vapi", "Gmail", "Google Sheets"],
    webhook: "labEvent",
    sample: { event: "estimate.followup_due", proposalId: "P-3301", daysSinceSent: 5, amount: 8450, phone: "+12145550188" }
  },
  {
    id: "B5", cat: "Communication & Follow-up", title: "Financing Options Follow-up", phase: 4, level: "Intermediate",
    problem: "Price is the #1 objection, and many homeowners don't know financing exists.",
    trigger: "Proposal page 'Ask about financing' button, or a financing intent detected on a call",
    flow: [
      "Webhook 'abc/financing-interest' → Sheets tag lead 'Financing'",
      "Email/SMS with the lender's application link (the company's real financing partner)",
      "Task for the estimator: call within 1 business day",
      "Never quote rates or approval. Only the lender can do that"
    ],
    vapi: "Assistant may say financing is available but must not promise terms",
    tools: ["Website", "n8n", "Gmail", "Twilio"],
    webhook: "financing",
    sample: { proposalId: "P-3301", name: "Daniel Kim", phone: "+12145550123", email: "dan@example.com", amount: 8450, preferredContact: "sms" }
  },

  /* ───────────── C. PRE-INSPECTION & SALES ───────────── */
  {
    id: "C1", cat: "Pre-Inspection & Sales Ops", title: "Pre-Inspection Crack Photo/Video Collection", phase: 2, level: "Intermediate",
    problem: "The inspector arrives blind. Photos beforehand let them bring the right tools and a better estimate.",
    trigger: "Upload page (website/upload.html) linked in the booking confirmation",
    flow: [
      "Webhook (multipart, Binary Property enabled) receives files + appointmentId",
      "Google Drive: create folder /Jobs/<appointmentId>/ and upload files",
      "Optional: AI vision node describes each photo (crack type, width, location)",
      "Sheets: save Drive folder link to the appointment. Notify the inspector"
    ],
    vapi: "—",
    tools: ["Website", "n8n", "Google Drive", "OpenAI/Claude vision (optional)"],
    webhook: "inspectionMedia",
    sample: { appointmentId: "APT-2041", phone: "+12145550111", locations: ["exterior brick", "interior drywall"], notes: "Crack wider at top", files: "(multipart files)" }
  },
  {
    id: "C2", cat: "Pre-Inspection & Sales Ops", title: "Automated Property Data Lookup", phase: 3, level: "Intermediate",
    problem: "Estimators manually look up year built, square footage and foundation type before each visit.",
    trigger: "New appointment booked (A3)",
    flow: [
      "HTTP Request → ATTOM Property API /property/detail?address1=…&address2=…",
      "Set node: extract yearBuilt, livingSqft, lotSize, stories, foundation (if available)",
      "Sheets: write to appointment row. Add to the inspector's briefing email",
      "Fallback when no match: flag 'manual lookup'"
    ],
    vapi: "—",
    tools: ["n8n", "ATTOM API (paid, has trial)", "Google Sheets"],
    webhook: "labEvent",
    sample: { event: "property.lookup", appointmentId: "APT-2041", address1: "412 Elm St", address2: "Garland, TX 75040" }
  },
  {
    id: "C3", cat: "Pre-Inspection & Sales Ops", title: "Instant On-Site Proposal & Contract Generation", phase: 4, level: "Advanced",
    problem: "Proposals typed up at the office days later lose deals. The client wants them signed at the kitchen table.",
    trigger: "Inspector submits an on-site form (n8n Form Trigger or a tablet form): line items + photos",
    flow: [
      "Code node: compute totals (piers × unit price, drainage, permit fee)",
      "DocuSeal API POST /submissions/html (or a template) with the line items prefilled",
      "Stripe: create a Payment Link for the deposit (e.g. 25%)",
      "SMS/email the homeowner: proposal.html?id=…&sign=<docuseal>&pay=<stripe>"
    ],
    vapi: "—",
    tools: ["n8n Form", "DocuSeal", "Stripe", "Twilio", "Website"],
    webhook: "proposal",
    sample: { action: "accept", proposalId: "P-3301", name: "Daniel Kim", amount: 8450, deposit: 2112.5 }
  },
  {
    id: "C4", cat: "Pre-Inspection & Sales Ops", title: "E-Signature & Deposit Collection", phase: 4, level: "Advanced",
    problem: "Signed paper contracts get lost, and nobody knows when a deposit has landed.",
    trigger: "DocuSeal webhook 'submission.completed' + Stripe webhook 'checkout.session.completed'",
    flow: [
      "Webhook ← DocuSeal: mark proposal Signed, store the signed PDF in Drive",
      "Webhook ← Stripe: mark deposit Paid (verify the Stripe signature)",
      "When both are true → status Sold → triggers D3 (permits) + D4 (crew & materials)",
      "Thank-you SMS + email with next steps"
    ],
    vapi: "—",
    tools: ["DocuSeal", "Stripe", "n8n", "Google Drive", "Google Sheets"],
    webhook: "labEvent",
    sample: { event: "docuseal.submission.completed", proposalId: "P-3301", signedPdfUrl: "https://example.com/signed.pdf" }
  },

  /* ───────────── D. FIELD & DISPATCH ───────────── */
  {
    id: "D1", cat: "Field & Dispatch", title: "Smart Inspector Routing & Dispatch", phase: 5, level: "Advanced",
    problem: "Inspectors zig-zag across DFW, so fewer inspections fit in a day.",
    trigger: "Schedule Trigger 6pm daily (plan tomorrow)",
    flow: [
      "Get tomorrow's appointments + inspector home bases",
      "Google Maps Routes API: compute the route matrix (drive times)",
      "Code node: assign the nearest inspector and order the stops",
      "Update Calendar events per inspector. Email each inspector their route"
    ],
    vapi: "—",
    tools: ["n8n", "Google Maps Platform", "Google Calendar"],
    webhook: "labEvent",
    sample: { event: "dispatch.plan", date: "2026-11-18", inspectors: ["Mike", "Sara"], appointments: 7 }
  },
  {
    id: "D2", cat: "Field & Dispatch", title: "\"Inspector On The Way\" Live SMS Tracking", phase: 3, level: "Beginner",
    problem: "'When will they get here?' calls flood the office.",
    trigger: "Inspector taps 'On my way' (n8n Form/link) → Webhook",
    flow: [
      "Compute ETA (Routes API) from the inspector's current location",
      "SMS homeowner: 'Mike is on the way, ETA 25 min' + track.html?name=Mike&eta=25",
      "On arrival tap → 'Mike has arrived'"
    ],
    vapi: "—",
    tools: ["n8n", "Twilio", "Website", "Google Maps (optional)"],
    webhook: "labEvent",
    sample: { event: "inspector.on_the_way", appointmentId: "APT-2041", inspector: "Mike", etaMinutes: 25, phone: "+12145550111" }
  },
  {
    id: "D3", cat: "Field & Dispatch", title: "Automated Permit & Utility Marking Requests", phase: 5, level: "Advanced",
    problem: "Digging without an 811 ticket breaks Texas law and is dangerous. Missed permits delay jobs.",
    trigger: "Job status = Sold (C4)",
    flow: [
      "Create task 'Open Texas811 ticket' with the address prefilled (online ticket or dial 811)",
      "Wait at least 2 business days (weekends/holidays excluded) before the dig date, then check that all utilities responded",
      "Permit checklist for the city (Dallas, Garland…) → task + email to the permit coordinator with the job packet",
      "Block crew scheduling (D4) until both are done"
    ],
    vapi: "—",
    tools: ["n8n", "Google Sheets/Tasks", "Gmail"],
    webhook: "labEvent",
    sample: { event: "job.sold", jobId: "J-5502", address: "412 Elm St, Garland, TX 75040", plannedDigDate: "2026-11-25" }
  },
  {
    id: "D4", cat: "Field & Dispatch", title: "Crew Scheduling & Material Ordering Alerts", phase: 5, level: "Advanced",
    problem: "Crews show up without enough piers or concrete, and the job slips a day.",
    trigger: "Permits + 811 cleared",
    flow: [
      "Code node: build the material list from the line items (piers, brackets, foam kits)",
      "Email the supplier the PO. Slack the warehouse",
      "Book the crew on the Calendar. SMS the homeowner the job date",
      "Day-before reminder to the crew lead"
    ],
    vapi: "—",
    tools: ["n8n", "Gmail", "Slack", "Google Calendar", "Twilio"],
    webhook: "labEvent",
    sample: { event: "job.ready_to_schedule", jobId: "J-5502", materials: [{ sku: "PIER-STEEL", qty: 12 }, { sku: "BRACKET", qty: 12 }] }
  },

  /* ───────────── E. POST-JOB & RETENTION ───────────── */
  {
    id: "E1", cat: "Post-Job & Retention", title: "Automated Invoicing & Payment Reminders", phase: 4, level: "Intermediate",
    problem: "Final invoices go out late and unpaid balances aren't chased.",
    trigger: "Job status = Completed",
    flow: [
      "Stripe: create the invoice for the balance (total − deposit) and send it",
      "Schedule daily: unpaid invoices → reminders at day 3, 7 and 14 (SMS + email)",
      "Stripe webhook invoice.paid → status Paid → triggers E2 + E3"
    ],
    vapi: "Optional polite reminder call",
    tools: ["Stripe", "n8n", "Twilio", "Gmail"],
    webhook: "labEvent",
    sample: { event: "job.completed", jobId: "J-5502", total: 8450, depositPaid: 2112.5, email: "dan@example.com" }
  },
  {
    id: "E2", cat: "Post-Job & Retention", title: "Google Review & Referral Requests", phase: 2, level: "Beginner",
    problem: "Happy customers rarely leave reviews unless asked, and local search ranking depends on reviews.",
    trigger: "Invoice paid (E1) + 1 day",
    flow: [
      "SMS + email to EVERY customer with the same Google review link (no 'happy-only' filter)",
      "review.html also offers a separate private feedback form and a referral form",
      "Private feedback → Webhook → alert the owner within 1 hour",
      "Referral → new lead (A4) with referredBy"
    ],
    vapi: "—",
    tools: ["n8n", "Twilio", "Gmail", "Website"],
    webhook: "review",
    sample: { jobId: "J-5502", name: "Daniel Kim", rating: 4, feedback: "Crew was great, cleanup could be better", wantsCallback: false }
  },
  {
    id: "E3", cat: "Post-Job & Retention", title: "Warranty Certificate Delivery", phase: 4, level: "Intermediate",
    problem: "Lifetime transferable warranties are a selling point, but certificates are made by hand (or never).",
    trigger: "Invoice paid (E1)",
    flow: [
      "Google Docs: copy the 'Warranty Template' and replace {{name}}, {{address}}, {{piers}}, {{date}}, {{certNo}}",
      "Google Drive: export as PDF → store in /Jobs/<jobId>/",
      "Gmail: send the PDF to the homeowner. Sheets: save the cert number (for transfers on resale)"
    ],
    vapi: "—",
    tools: ["n8n", "Google Docs", "Google Drive", "Gmail"],
    webhook: "labEvent",
    sample: { event: "warranty.issue", jobId: "J-5502", name: "Daniel Kim", address: "412 Elm St, Garland, TX 75040", piers: 12 }
  },
  {
    id: "E4", cat: "Post-Job & Retention", title: "Annual Sump Pump / Drainage Maintenance Reminders", phase: 3, level: "Beginner",
    problem: "Repeat maintenance revenue is forgotten, and neglected drainage voids warranty conditions.",
    trigger: "Daily Schedule Trigger: customers whose job anniversary is in 14 days",
    flow: [
      "Sheets: filter maintenance_opt_in = true AND anniversary in 14 days",
      "SMS + email: 'Time for your annual drainage check' + booking link",
      "No booking in 7 days → optional AI reminder call (consent required)"
    ],
    vapi: "Optional outbound reminder",
    tools: ["n8n", "Google Sheets", "Twilio", "Gmail", "Website"],
    webhook: "maintenance",
    sample: { name: "Daniel Kim", phone: "+12145550123", email: "dan@example.com", address: "412 Elm St, Garland, TX 75040", hasSumpPump: true, preferredMonth: "March" }
  }
];
