/*
 * ABC Foundation Repair — site configuration
 * ------------------------------------------
 * The ONLY file you need to edit to connect this website to n8n.
 *
 * 1. Put your n8n base URL below (n8n Cloud: https://<name>.app.n8n.cloud).
 * 2. While building/testing in the n8n editor keep USE_TEST_URL = true
 *    (n8n listens on /webhook-test/<path> only while you click "Listen for test event").
 * 3. When the workflow is published, set USE_TEST_URL = false
 *    (n8n production URLs are /webhook/<path>).
 *    Docs: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/workflow-development
 *
 * If N8N_BASE_URL is empty, the site runs in DEMO MODE: nothing is sent,
 * and the "Automation Inspector" panel shows the exact JSON that WOULD be sent.
 */
window.ABC_CONFIG = {
  N8N_BASE_URL: "https://hamasoj.app.n8n.cloud",
  USE_TEST_URL: false,      // workflows are published, so use /webhook/ (production)

  // Optional shared secret. Add a header check (Header Auth) on your n8n Webhook nodes.
  WEBHOOK_SECRET_HEADER: "X-ABC-Secret",
  WEBHOOK_SECRET: "",

  BUSINESS: {
    name: "ABC Foundation Repair",
    city: "Dallas, TX",
    phoneDisplay: "(214) 555-0142",   // placeholder — replace with your Vapi/Twilio number
    phoneE164: "+12145550142",
    email: "office@abcfoundation.example",
    timezone: "America/Chicago",
    // Get this from Google Business Profile → Read reviews → Get more reviews → Copy
    // https://support.google.com/business/answer/16816815
    googleReviewUrl: "https://g.page/r/REPLACE_ME/review"
  },

  // One n8n Webhook node per path. Paths are what you type in the Webhook node "Path" field.
  WEBHOOKS: {
    newLead:        "abc/new-lead",           // A1/A2/A4 — form → AI speed-to-lead call
    emergency:      "abc/emergency",          // A6 — urgent request from website
    inspectionMedia:"abc/inspection-media",   // C1 — crack photos/videos upload
    appointment:    "abc/appointment",        // A3/B3 — book or reschedule
    proposal:       "abc/proposal-action",    // C3/C4 — accept / ask question
    financing:      "abc/financing-interest", // B5
    review:         "abc/review-feedback",    // E2 — private feedback (never gates the Google link)
    referral:       "abc/referral",           // E2
    maintenance:    "abc/maintenance-signup", // E4
    labEvent:       "abc/lab-event"           // Automation Lab — simulated backend events
  }
};
