# Data model — Google Sheet "ABC CRM"

Start with Google Sheets (free and visual, so you can watch rows appear). Move to Airtable or Supabase later
when you need relations. Create ONE spreadsheet with these tabs and header rows (row 1 = column names exactly).

## Leads
| column | example | notes |
|---|---|---|
| lead_id | L-1007 | n8n generates it: `L-` + timestamp |
| created_at | 2026-11-15T21:04:00-06:00 | |
| name | Daniel Kim | |
| phone | +12145550123 | E.164, the main lookup key for calls/SMS |
| email | dan@example.com | |
| zip | 75214 | used for service-area check |
| service | Concrete Slab Foundation Repair | |
| message | Door won't close | |
| source | website-hero-form / inbound-call / referral | |
| consent_ai_call | TRUE | **required** before any AI outbound call |
| consent_sms | TRUE | |
| dnc | FALSE | set TRUE on "stop calling" / STOP |
| status | New → Calling → Booked / No Answer / Not Interested / Nurture / Estimate Sent / Sold / Lost | |
| score | Hot / Warm / Cold | from A2 |
| last_contact_at | | |
| last_call_id | call_… | Vapi call id |
| notes | | AI call summary |

## Appointments
appointment_id · lead_id · phone · address · slot_start · slot_end · calendar_event_id · inspector · status (Booked/Rescheduled/Cancelled/Done/No-show) · media_folder_url · property_year_built · property_sqft · reminder_24h_sent · reminder_2h_sent

## Proposals
proposal_id · appointment_id · lead_id · items_json · total · deposit · docuseal_submission_id · sign_url · stripe_payment_link · status (Sent/Signed/Deposit Paid/Declined) · sent_at · signed_at · paid_at · followup_step

## Jobs
job_id · proposal_id · address · permit_status · texas811_ticket · texas811_ready_date · crew_date · materials_ordered · status (Sold/Permitting/Scheduled/In Progress/Completed/Paid) · invoice_id · warranty_cert_no · completed_at · maintenance_opt_in · anniversary_date

## Calls
call_id · direction (inbound/outbound) · phone · lead_id · started_at · ended_reason · duration_sec · summary · transcript · recording_url · structured_json

## Events (audit log, written by every workflow)
event_id · at · automation (A4, B1…) · type · payload_json · result

> Tip: every workflow's last step appends a row to **Events**. When something breaks you can see exactly which
> automation ran and what it received. That's how real client systems are debugged.
