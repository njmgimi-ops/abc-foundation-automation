# Lesson 2: "Ava" booking assistant (Vapi dashboard setup)

n8n side (already built and published): workflow **[TOOLS] Vapi Tools Router**
Server URL for both tools: `https://hamasoj.app.n8n.cloud/webhook/abc/vapi-tools`

---

## 1. Tool: `check_availability`
Vapi Dashboard → **Tools** → **Create Tool** → **Function**

- **Tool Name:** `check_availability`
- **Description:** `Get the next two open 1-hour inspection slots on or after the caller's preferred date. Call this before offering any time.`
- **Parameters (JSON):**
```json
{
  "type": "object",
  "properties": {
    "preferredDate": { "type": "string", "description": "Preferred date as YYYY-MM-DD" },
    "partOfDay": { "type": "string", "enum": ["morning", "afternoon", "any"] }
  },
  "required": ["preferredDate"]
}
```
- **Server URL:** `https://hamasoj.app.n8n.cloud/webhook/abc/vapi-tools`

## 2. Tool: `book_inspection`
- **Tool Name:** `book_inspection`
- **Description:** `Book the free inspection after the caller confirmed the date, time and address. Use the exact slotStart returned by check_availability.`
- **Parameters (JSON):**
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string", "description": "Caller's full name" },
    "phone": { "type": "string", "description": "Caller's phone in E.164, e.g. +12145550123" },
    "address": { "type": "string", "description": "Full property address with ZIP" },
    "slotStart": { "type": "string", "description": "Exact slotStart from check_availability, e.g. 2026-11-18T10:00:00-06:00" }
  },
  "required": ["name", "address", "slotStart"]
}
```
- **Server URL:** `https://hamasoj.app.n8n.cloud/webhook/abc/vapi-tools`

---

## 3. Assistant: "Ava – ABC Booking"
Vapi Dashboard → **Assistants** → **Create Assistant** (Blank)

**First Message:**
```
Thanks for calling ABC Foundation Repair, this is Ava, the AI booking assistant. Are you calling to book a free foundation inspection?
```

**System Prompt:**
```
You are Ava, the AI booking assistant for ABC Foundation Repair in Dallas, Texas. You are an AI; say so if asked.
Speak warmly and briefly: one or two sentences per turn.
Today is {{"now" | date: "%A, %B %d, %Y", "America/Chicago"}}. All times are Dallas time.

Goal: book a FREE on-site foundation inspection.

Safety first: if the caller mentions a gas smell, sparking wires, or a wall or ceiling actively moving,
tell them to leave the house and call 911, then end the call politely.

Steps:
1. Ask the caller's name.
2. Ask the property address with ZIP. We serve the Dallas–Fort Worth area only. If the address is
   outside DFW, apologise and do not book.
3. Ask briefly what they are noticing (cracks, sticking doors, sloping floors).
4. Ask which day suits them and whether morning or afternoon is better.
   Call check_availability with preferredDate as YYYY-MM-DD.
5. Offer the two times from the result, in plain words. Never read out the slotStart code.
6. When they choose, repeat back the day, time and address. After they confirm, call book_inspection
   with the exact slotStart for that time.
7. Read the confirmation from the result and tell them the inspector will call before arriving.

Rules:
- Never quote prices or diagnose the problem. Say: "The inspector gives you a free written estimate on site."
- If a tool says the slot was taken, call check_availability again and offer new times.
- If the caller says they are not interested or asks not to be called, apologise and end the call.
```

**Tools tab:** add `check_availability` and `book_inspection` → **Publish**.

## 4. Test (no phone number needed)
Click **Talk** (web call), allow the microphone, and say:
> "Hi, I'm Ali. My house is at 412 Elm Street, Garland, Texas 75040. The door is sticking. Can someone come Thursday morning?"

Then check:
- n8n → workflow **[TOOLS] Vapi Tools Router** → **Executions** (two runs: availability, then booking)
- n8n → **Data tables → Appointments** (a new row with `source = vapi`)

Each call uses Vapi credits (about $0.08–0.13 per minute on the pricing page), so keep test calls short.
