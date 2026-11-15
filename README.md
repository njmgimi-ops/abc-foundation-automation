# ABC Foundation Repair: AI Voice + Automation System

A portfolio build of **23 automations** for a home-services business (foundation repair, Dallas TX),
using **n8n** for workflows, **Vapi** for AI voice agents, and **Claude Code** (via MCP) as the builder.

> Practice/demo project. "ABC Foundation Repair" is fictional.

## What's inside
| Folder | What it is |
|---|---|
| `website/` | Static customer website: lead form, booking/reschedule, crack-photo upload, emergency, proposal + e-sign/deposit, live "on the way" tracking, review & referral, maintenance sign-up. Every form posts JSON to an n8n webhook. |
| `website/roadmap.html` | Client-facing **automation blueprint** (show this in sales calls). |
| `website/lab.html` | **Automation Lab**: fires a realistic test payload at each workflow. |
| `docs/01-build-guide.md` | Step-by-step build order with ready-to-paste Claude Code prompts. |
| `docs/02-data-model.md` | Google Sheets CRM schema. |
| `docs/03-compliance.md` | TCPA/FCC AI-voice consent, A2P 10DLC, WhatsApp window, Google review policy, Texas811. |
| `vapi/` | "Ava" receptionist prompt + function tool definitions. |
| `n8n/` | Exported workflows (added as they're built). |
| `CLAUDE.md` | Project rules Claude Code follows while building. |

## The 23 automations
- **AI Voice Agents:** 24/7 receptionist · lead qualification · direct booking · speed-to-lead outbound · database reactivation · emergency triage & routing
- **Communication:** missed-call text-back · multi-channel nurture · reminders & rescheduling · unsold-estimate follow-up · financing follow-up
- **Sales Ops:** pre-inspection photo collection · property data lookup · on-site proposal generation · e-signature & deposit
- **Field & Dispatch:** inspector routing · "on the way" SMS tracking · permit & 811 requests · crew & material alerts
- **Retention:** invoicing & reminders · review & referral requests · warranty certificates · annual maintenance reminders

## Run the website
```bash
cd website && python3 -m http.server 8080
```
Open http://localhost:8080. With no n8n URL set it runs in **demo mode**: the ⚡ Inspector shows the exact JSON each form would send.
To go live, edit `website/assets/config.js`.

## Stack
n8n · Vapi · Twilio · Google Sheets/Calendar/Drive/Docs/Gmail · Stripe · DocuSeal · ATTOM · Google Maps Platform · WhatsApp Cloud API
