/* Shared helpers for every page: layout, n8n sender, Automation Inspector. */
(function () {
  const CFG = window.ABC_CONFIG;
  const B = CFG.BUSINESS;

  /* ---------- Layout (header/footer) ---------- */
  const NAV = [
    ["index.html", "Home"],
    ["book.html", "Book / Reschedule"],
    ["upload.html", "Send Photos"],
    ["emergency.html", "Emergency"],
    ["maintenance.html", "Maintenance Plan"],
    ["roadmap.html", "Automation Blueprint"],
    ["lab.html", "Automation Lab"]
  ];

  function renderChrome() {
    const here = location.pathname.split("/").pop() || "index.html";
    const header = document.getElementById("site-header");
    if (header) {
      header.innerHTML = `
        <div class="topbar">
          <span>🕐 24/7 AI booking · Free inspections across DFW</span>
          <a href="tel:${B.phoneE164}">📞 ${B.phoneDisplay}</a>
        </div>
        <nav class="nav">
          <a class="brand" href="index.html"><span class="logo">ABC</span><span>${B.name}<small>${B.city}</small></span></a>
          <button class="nav-toggle" aria-label="Menu" onclick="document.body.classList.toggle('nav-open')">☰</button>
          <div class="nav-links">
            ${NAV.map(([h, t]) => `<a href="${h}" class="${h === here ? "active" : ""}">${t}</a>`).join("")}
          </div>
        </nav>`;
    }
    const footer = document.getElementById("site-footer");
    if (footer) {
      footer.innerHTML = `<div class="container">
        <div class="footer-grid">
          <div><strong>${B.name}</strong><p>${B.city}<br>${B.phoneDisplay}<br>${B.email}</p></div>
          <div><strong>Customers</strong><p><a href="book.html">Book inspection</a><br><a href="upload.html">Upload crack photos</a><br><a href="maintenance.html">Annual maintenance</a></p></div>
          <div><strong>Portfolio</strong><p><a href="roadmap.html">Automation blueprint</a><br><a href="lab.html">Automation lab</a></p></div>
        </div>
        <p class="fine">Practice/demo project. Not a real company. Calls and texts are only made with prior express consent, and you can reply STOP to opt out at any time.</p>`;
    }
    renderInspector();
    updateModeBadge();
  }

  /* ---------- Automation Inspector (shows what is sent to n8n) ---------- */
  function renderInspector() {
    if (document.getElementById("inspector")) return;
    const el = document.createElement("aside");
    el.id = "inspector";
    el.innerHTML = `
      <button id="inspector-toggle" title="Show what this page sends to n8n">⚡ Inspector <span id="mode-badge"></span></button>
      <div id="inspector-body">
        <div class="insp-head"><strong>Automation Inspector</strong><button onclick="ABC.clearLog()">clear</button></div>
        <p class="insp-hint">Every form on this site sends JSON to an n8n Webhook. The requests appear here.</p>
        <div id="insp-log"></div>
      </div>`;
    document.body.appendChild(el);
    document.getElementById("inspector-toggle").onclick = () => el.classList.toggle("open");
  }

  function updateModeBadge() {
    const b = document.getElementById("mode-badge");
    if (!b) return;
    if (!CFG.N8N_BASE_URL) { b.textContent = "DEMO"; b.className = "badge demo"; }
    else { b.textContent = CFG.USE_TEST_URL ? "TEST" : "LIVE"; b.className = "badge " + (CFG.USE_TEST_URL ? "test" : "live"); }
  }

  function log(entry) {
    const box = document.getElementById("insp-log");
    if (!box) return;
    const div = document.createElement("div");
    div.className = "insp-item " + (entry.ok ? "ok" : entry.demo ? "demo" : "err");
    div.innerHTML = `
      <div class="insp-meta"><b>${entry.method || "POST"}</b> <code>${escapeHtml(entry.url)}</code></div>
      <div class="insp-status">${entry.status}</div>
      <pre>${escapeHtml(JSON.stringify(entry.payload, null, 2))}</pre>
      ${entry.response ? `<div class="insp-resp">Response:</div><pre>${escapeHtml(typeof entry.response === "string" ? entry.response : JSON.stringify(entry.response, null, 2))}</pre>` : ""}`;
    box.prepend(div);
    document.getElementById("inspector").classList.add("open");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function webhookUrl(key) {
    const path = CFG.WEBHOOKS[key];
    if (!path) throw new Error("Unknown webhook key: " + key);
    if (!CFG.N8N_BASE_URL) return "(demo) /webhook/" + path;
    const base = CFG.N8N_BASE_URL.replace(/\/+$/, "");
    return `${base}/${CFG.USE_TEST_URL ? "webhook-test" : "webhook"}/${path}`;
  }

  function meta() {
    const p = new URLSearchParams(location.search);
    const utm = {};
    ["utm_source", "utm_medium", "utm_campaign", "gclid"].forEach(k => p.get(k) && (utm[k] = p.get(k)));
    return {
      eventId: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)),
      submittedAt: new Date().toISOString(),
      page: location.pathname.split("/").pop() || "index.html",
      userAgent: navigator.userAgent,
      ...(Object.keys(utm).length ? { utm } : {})
    };
  }

  /**
   * Send a payload to an n8n webhook.
   * @param {string} key - key from ABC_CONFIG.WEBHOOKS
   * @param {object} data - JSON payload
   * @param {FileList|File[]} [files] - optional files → sent as multipart/form-data
   */
  async function send(key, data, files) {
    const url = webhookUrl(key);
    const payload = { ...data, _meta: meta() };

    if (!CFG.N8N_BASE_URL) {
      const shown = files && files.length ? { ...payload, files: [...files].map(f => `${f.name} (${Math.round(f.size / 1024)} KB)`) } : payload;
      log({ url, payload: shown, status: "DEMO MODE: not sent. Set N8N_BASE_URL in assets/config.js", demo: true });
      await new Promise(r => setTimeout(r, 400));
      return { ok: true, demo: true };
    }

    const headers = {};
    if (CFG.WEBHOOK_SECRET) headers[CFG.WEBHOOK_SECRET_HEADER] = CFG.WEBHOOK_SECRET;
    let body;
    if (files && files.length) {
      body = new FormData();
      body.append("data", JSON.stringify(payload));
      [...files].forEach((f, i) => body.append("file" + i, f, f.name));
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(payload);
    }

    try {
      const res = await fetch(url, { method: "POST", headers, body });
      const text = await res.text();
      let parsed = text; try { parsed = JSON.parse(text); } catch (_) {}
      log({ url, payload, status: `HTTP ${res.status}`, ok: res.ok, response: parsed });
      return { ok: res.ok, status: res.status, data: parsed };
    } catch (err) {
      log({ url, payload, status: "Network/CORS error: " + err.message + " (check the URL, that the workflow is listening/published, and Allowed Origins on the Webhook node)", ok: false });
      return { ok: false, error: err };
    }
  }

  /* ---------- Form helpers ---------- */
  function formToObject(form) {
    const out = {};
    new FormData(form).forEach((v, k) => {
      if (v instanceof File) return;
      if (out[k] !== undefined) out[k] = [].concat(out[k], v);
      else out[k] = v;
    });
    form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (!cb.name) return;
      const group = form.querySelectorAll(`input[type="checkbox"][name="${cb.name}"]`);
      if (group.length === 1) out[cb.name] = cb.checked;
    });
    return out;
  }

  /** E.164 normaliser for US numbers (practice-level, not a full validator). */
  function toE164US(raw) {
    const d = String(raw || "").replace(/\D/g, "");
    if (d.length === 10) return "+1" + d;
    if (d.length === 11 && d.startsWith("1")) return "+" + d;
    if (String(raw).trim().startsWith("+") && d.length >= 8) return "+" + d;
    return null;
  }

  function bindForm(formId, key, opts = {}) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const btn = form.querySelector('button[type="submit"]');
      const msg = form.querySelector(".form-msg");
      let data = formToObject(form);
      if (data.phone !== undefined) {
        const e164 = toE164US(data.phone);
        if (!e164) { show(msg, "Please enter a valid phone number.", "err"); return; }
        data.phone = e164;
      }
      if (opts.transform) data = opts.transform(data);
      const fileInput = form.querySelector('input[type="file"]');
      btn.disabled = true; const label = btn.textContent; btn.textContent = "Sending…";
      const r = await send(key, data, fileInput ? fileInput.files : null);
      btn.disabled = false; btn.textContent = label;
      if (r.ok) {
        show(msg, opts.success || "Thanks! We got it.", "ok");
        if (opts.onSuccess) opts.onSuccess(data, r); else form.reset();
      } else show(msg, "Something went wrong. Please call us at " + B.phoneDisplay + ".", "err");
    });
  }

  function show(el, text, cls) { if (!el) return; el.textContent = text; el.className = "form-msg " + cls; }

  function qs(name, fallback = "") { return new URLSearchParams(location.search).get(name) || fallback; }

  window.ABC = { send, bindForm, webhookUrl, qs, toE164US, clearLog: () => (document.getElementById("insp-log").innerHTML = ""), escapeHtml };
  document.addEventListener("DOMContentLoaded", renderChrome);
})();
