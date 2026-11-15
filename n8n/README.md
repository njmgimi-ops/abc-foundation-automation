# n8n workflow exports

After each automation is built and tested, export it from n8n (⋯ → Download) and save it here as
`<ID>-<short-name>.json`, e.g. `A4-speed-to-lead.json`.

Before committing, open the JSON and make sure it contains no API keys. Credentials in n8n are stored
separately and are referenced only by name/id in the export, but check HTTP Request headers you typed by hand.
