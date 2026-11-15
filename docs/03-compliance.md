# Compliance checklist for US clients (read before calling or texting real people)

This is a practice project, not legal advice. When a real client goes live, their attorney signs off.

| Area | Rule | Source |
|---|---|---|
| AI voice outbound calls | AI-generated voices count as "artificial or prerecorded voice" under the TCPA, so prior express consent is required (except emergencies/exemptions). The call must identify the business, and telemarketing calls must offer an opt-out. | FCC Declaratory Ruling FCC 24-17 — https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf |
| Telemarketing consent | Prerecorded/artificial telemarketing calls need prior written consent (website forms count). Consumers can revoke consent in any reasonable way. | FCC consumer guide — https://www.fcc.gov/consumers/guides/stop-unwanted-robocalls-and-texts |
| SMS from US 10DLC numbers | Anyone sending app-to-person SMS to US numbers over 10DLC must register Brand + Campaign (A2P 10DLC). Trial accounts can't register. Campaign review takes up to ~5 business days. | Twilio — https://www.twilio.com/docs/messaging/compliance/a2p-10dlc |
| WhatsApp | Free-form messages only inside the 24-hour customer service window. Outside it, use approved templates. Recipients must have opted in. | Meta — https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages |
| Google reviews | Merchants may not "discourage or prohibit negative reviews, or selectively solicit positive reviews". Send everyone the same link and offer no incentives. | Google Business Profile help — https://support.google.com/business/answer/16816815 · Maps UGC policy (Rating Manipulation) |
| Digging (811) | Texas law requires contacting 811 at least two business days before excavating (weekends/holidays excluded). | Texas811 — https://texas811.org/ |
| Outbound from Vapi | Free Vapi numbers can't make outbound or international calls, so import a Twilio/Vonage/Telnyx number. | Vapi — https://docs.vapi.ai/calls/outbound-calling |

## How the website already follows these
- Lead form: AI-call consent checkbox is **unticked by default** and required, and SMS consent is separate.
- `review.html`: the same Google button for everyone. Private feedback is a separate, optional form.
- `emergency.html`: tells the visitor to call 911 first for life-safety situations.
- Footer: STOP opt-out notice.
