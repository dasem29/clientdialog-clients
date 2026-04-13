(function () {
  const CLIENT_ID = "lumea_perdelelor";

  function getApiBase() {
    const current =
      document.currentScript ||
      [...document.querySelectorAll('script[src*="widget-lumea-perdelelor-final.js"]')].pop();

    const src = current?.src || window.location.href;
    return new URL(src, window.location.href).origin;
  }

  const API_BASE = getApiBase();
  const CHAT_ENDPOINT = `${API_BASE}/api/chat`;
  const CONFIG_ENDPOINT = `${API_BASE}/api/config?clientId=${encodeURIComponent(CLIENT_ID)}`;

  const FALLBACK_UI = {
    businessName: "Lumea Perdelelor",
    assistantLabel: "Asistent virtual",
    subtitle: "Perdele, draperii, servicii și asistență personalizată",
    welcome:
      "Bun venit la Lumea Perdelelor! Sunt asistentul virtual al magazinului și te pot ajuta rapid cu informații despre livrare, atelier, servicii și legătura cu un operator.",
    accent: "#7a5a43",
    accentDark: "#5f4330",
    accentSoft: "#f4ece6",
    inputPlaceholder: "Scrie mesajul tău aici...",
    quickActions: [
      "Timp de livrare",
      "Ce servicii oferiți?",
      "Aveți și atelier?",
      "Vreau să vorbesc cu un operator"
    ]
  };

  let UI = { ...FALLBACK_UI };
  let sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function nowTime() {
    return new Intl.DateTimeFormat("ro-RO", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date());
  }

  async function loadRemoteConfig() {
    try {
      const res = await fetch(CONFIG_ENDPOINT, { headers: { Accept: "application/json" } });
      if (!res.ok) return;

      const data = await res.json();

      UI = {
        ...UI,
        businessName: data.widgetTitle || data.name || UI.businessName,
        assistantLabel: data.widgetBadge || UI.assistantLabel,
        subtitle: data.widgetSubtitle || UI.subtitle,
        welcome: data.welcomeMessage || UI.welcome,
        accent: data.brandColor || UI.accent,
        accentDark: UI.accentDark,
        accentSoft: UI.accentSoft
      };
    } catch (_) {}
  }

  function createHost() {
    const existing = document.getElementById("cdg-lp-widget-host");
    if (existing) existing.remove();

    const host = document.createElement("div");
    host.id = "cdg-lp-widget-host";
    host.style.position = "fixed";
    host.style.right = "20px";
    host.style.bottom = "20px";
    host.style.zIndex = "2147483000";
    document.body.appendChild(host);
    return host;
  }

  function buildShadow(host) {
    const shadow = host.attachShadow({ mode: "open" });

    shadow.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; }

        .root {
          position: relative;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #111827;
        }

        .launcher {
          width: 78px;
          height: 78px;
          border: 2px solid rgba(220, 191, 120, .58);
          border-radius: 26px;
          cursor: pointer;
          color: #fffaf0;
          background:
            radial-gradient(circle at 24% 18%, rgba(255,255,255,.28), transparent 20%),
            radial-gradient(circle at 78% 80%, rgba(220,191,120,.16), transparent 24%),
            linear-gradient(145deg, #082a24 0%, #0f4339 48%, #7f6241 100%);
          box-shadow:
            0 24px 52px rgba(6, 22, 19, .42),
            0 0 28px rgba(220,191,120,.16),
            inset 0 1px 0 rgba(255,255,255,.18),
            inset 0 -10px 20px rgba(0,0,0,.14);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
          position: relative;
          overflow: hidden;
        }

        .launcher::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 28%, rgba(255,255,255,.16) 48%, transparent 68%);
          transform: translateX(-135%);
          transition: transform .55s ease;
          pointer-events: none;
        }

        .launcher:hover {
          transform: translateY(-3px) scale(1.04);
          filter: saturate(1.08);
          box-shadow:
            0 30px 62px rgba(6, 22, 19, .52),
            0 0 36px rgba(220,191,120,.24),
            inset 0 1px 0 rgba(255,255,255,.22),
            inset 0 -12px 24px rgba(0,0,0,.18);
        }

        .launcher:hover::after {
          transform: translateX(135%);
        }

        .launcher svg {
          width: 31px;
          height: 31px;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,.18));
        }

        .launcher-badge {
          position: absolute;
          right: -5px;
          top: -5px;
          min-width: 24px;
          height: 24px;
          padding: 0 7px;
          border-radius: 999px;
          background: linear-gradient(135deg, #e6cd8d, #bb8f43);
          color: #16352f;
          font-size: 10px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 10px 20px rgba(187,143,67,.34),
            inset 0 1px 0 rgba(255,255,255,.28);
          z-index: 3;
          letter-spacing: .02em;
        }

        .panel {
          position: absolute;
          right: 0;
          bottom: 92px;
          width: 392px;
          height: 690px;
          display: none;
          flex-direction: column;
          overflow: hidden;
          border-radius: 28px;
          background: rgba(255,255,255,.98);
          border: 1px solid rgba(15,23,42,.08);
          box-shadow: 0 30px 90px rgba(2,6,23,.16);
        }

        .panel.open {
          display: flex;
        }

        .header {
          flex: 0 0 auto;
          padding: 18px 18px 16px;
          color: #fff;
          background:
            radial-gradient(circle at top left, rgba(255,255,255,.14), transparent 28%),
            radial-gradient(circle at bottom right, rgba(255,255,255,.08), transparent 34%),
            linear-gradient(135deg, ${UI.accent}, ${UI.accentDark});
        }

        .pill {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.08);
          font-size: 12px;
          line-height: 1;
          margin-bottom: 14px;
        }

        .head-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .title-wrap { min-width: 0; }

        .title {
          margin: 0;
          font-size: 22px;
          line-height: 1.08;
          font-weight: 700;
          letter-spacing: -.02em;
          color: #fff;
        }

        .subtitle {
          margin: 8px 0 0;
          font-size: 14px;
          line-height: 1.42;
          color: rgba(255,255,255,.92);
          max-width: 250px;
        }

        .close {
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 15px;
          background: rgba(255,255,255,.14);
          color: #fff;
          cursor: pointer;
          font-size: 18px;
          flex: 0 0 auto;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          font-size: 12px;
          color: rgba(255,255,255,.95);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #b9f3d7;
          box-shadow: 0 0 0 5px rgba(185,243,215,.14);
        }

        .body {
          flex: 1 1 auto;
          min-height: 0;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #fbfbfb, #ffffff 24%);
        }

        .messages {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px 14px 10px;
          display: block;
        }

        .messages::-webkit-scrollbar { width: 8px; }
        .messages::-webkit-scrollbar-thumb {
          background: rgba(15,23,42,.10);
          border-radius: 999px;
        }

        .msg {
          width: 100%;
          margin-bottom: 12px;
          clear: both;
        }

        .msg.user {
          text-align: right;
        }

        .msg.bot {
          text-align: left;
        }

        .bubble {
          display: inline-block;
          vertical-align: top;
          max-width: 78%;
          padding: 13px 14px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.52;
          text-align: left;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .bubble.bot {
          background: #fff;
          color: #1f2937;
          border: 1px solid rgba(15,23,42,.08);
          border-bottom-left-radius: 8px;
          box-shadow: 0 10px 20px rgba(15,23,42,.04);
        }

        .bubble.user {
          background: linear-gradient(135deg, ${UI.accent}, ${UI.accentDark});
          color: #fff;
          border-bottom-right-radius: 8px;
          box-shadow: 0 10px 20px rgba(122,90,67,.14);
        }

        .time {
          margin-top: 6px;
          font-size: 11px;
          opacity: .68;
        }

        .actions {
          flex: 0 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 0 14px 12px;
        }

        .action-btn {
          border: 1px solid rgba(122,90,67,.15);
          background: ${UI.accentSoft};
          color: #4b3427;
          border-radius: 16px;
          padding: 11px 12px;
          font-size: 12px;
          line-height: 1.25;
          cursor: pointer;
          text-align: left;
          transition: transform .14s ease, background .14s ease, border-color .14s ease;
        }

        .action-btn:hover {
          transform: translateY(-1px);
          background: #ebddd2;
          border-color: rgba(122,90,67,.22);
        }

        .composer {
          flex: 0 0 auto;
          border-top: 1px solid rgba(15,23,42,.06);
          background: #fff;
          padding: 12px;
        }

        .composer-inner {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          padding: 10px;
          border-radius: 18px;
          background: #fff;
          border: 1px solid rgba(15,23,42,.08);
        }

        .input {
          flex: 1;
          border: 0;
          outline: none;
          resize: none;
          min-height: 22px;
          max-height: 110px;
          background: transparent;
          color: #1f2937;
          font-size: 14px;
          line-height: 1.5;
          font-family: inherit;
        }

        .input::placeholder { color: #9ca3af; }

        .send {
          width: 46px;
          height: 46px;
          border: 0;
          border-radius: 15px;
          cursor: pointer;
          color: #fff;
          background: linear-gradient(135deg, ${UI.accent}, ${UI.accentDark});
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          box-shadow: 0 10px 20px rgba(122,90,67,.16);
        }

        .send:disabled {
          opacity: .55;
          cursor: not-allowed;
          box-shadow: none;
        }

        .note {
          margin-top: 8px;
          color: #6b7280;
          font-size: 11px;
          line-height: 1.45;
        }

        .typing {
          display: inline-flex;
          gap: 5px;
          align-items: center;
        }

        .typing span {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(122,90,67,.55);
          display: inline-block;
          animation: bounce 1.2s infinite ease-in-out;
        }

        .typing span:nth-child(2) { animation-delay: .15s; }
        .typing span:nth-child(3) { animation-delay: .3s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(.65); opacity: .45; }
          40% { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 640px) {
          .launcher {
            width: 70px;
            height: 70px;
            border-radius: 22px;
          }

          .launcher svg {
            width: 28px;
            height: 28px;
          }

          .launcher-badge {
            min-width: 22px;
            height: 22px;
            font-size: 9px;
          }

          .panel {
            width: min(392px, calc(100vw - 24px));
            height: min(78vh, 690px);
          }
        }
      </style>

      <div class="root">
        <button class="launcher" type="button" aria-label="Deschide chatul">
          <span class="launcher-badge">AI</span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6.5 4.5h11a2 2 0 0 1 2 2V17l-2.2-1.9a1.8 1.8 0 0 0-1.2-.46H6.5a2 2 0 0 1-2-2v-6.1a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8.4 8.6h7.2M8.4 11.8h4.8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
            <path d="M4.7 9.1v3.1A2.8 2.8 0 0 0 7.5 15h1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>

        <section class="panel">
          <div class="header">
            <div class="pill">${escapeHtml(UI.assistantLabel)}</div>
            <div class="head-row">
              <div class="title-wrap">
                <h3 class="title">${escapeHtml(UI.businessName)}</h3>
                <p class="subtitle">${escapeHtml(UI.subtitle)}</p>
              </div>
              <button class="close" type="button" aria-label="Închide">✕</button>
            </div>
            <div class="status">
              <span class="status-dot"></span>
              <span>Online acum</span>
            </div>
          </div>

          <div class="body">
            <div class="messages"></div>

            <div class="actions">
              ${UI.quickActions.map((label) => `
                <button class="action-btn" type="button" data-label="${escapeHtml(label)}">${escapeHtml(label)}</button>
              `).join("")}
            </div>

            <div class="composer">
              <div class="composer-inner">
                <textarea class="input" rows="1" placeholder="${escapeHtml(UI.inputPlaceholder)}"></textarea>
                <button class="send" type="button" aria-label="Trimite">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                    <path d="M21 3 10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="m21 3-7 18-4-7-7-4 18-7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div class="note">Spune-mi ce vrei să afli și te ajut rapid.</div>
            </div>
          </div>
        </section>
      </div>
    `;

    return shadow;
  }

  function addMessage(shadow, role, text) {
    const messages = shadow.querySelector(".messages");

    const row = document.createElement("div");
    row.className = `msg ${role}`;

    const bubble = document.createElement("div");
    bubble.className = `bubble ${role}`;

    const textEl = document.createElement("div");
    textEl.textContent = text;

    const timeEl = document.createElement("div");
    timeEl.className = "time";
    timeEl.textContent = nowTime();

    bubble.appendChild(textEl);
    bubble.appendChild(timeEl);
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTyping(shadow) {
    const messages = shadow.querySelector(".messages");

    const row = document.createElement("div");
    row.className = "msg bot";

    const bubble = document.createElement("div");
    bubble.className = "bubble bot";
    bubble.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';

    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  async function sendToBackend(message) {
    const res = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        clientId: CLIENT_ID,
        sessionId,
        pageUrl: window.location.href,
        pageTitle: document.title,
        message
      })
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("CHAT BACKEND ERROR:", res.status, txt);
      throw new Error("HTTP " + res.status);
    }

    return await res.json();
  }

  function scrollToContact() {
    const selectors = [
      "#contact",
      "#contact-us",
      "#contactus",
      "#footer",
      "[id*='contact']",
      "[class*='contact']",
      "a[href^='tel:']",
      "a[href^='mailto:']"
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }
    }

    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    return false;
  }

  function autoresize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 110)}px`;
  }

  function init() {
    const host = createHost();
    const shadow = buildShadow(host);

    const launcher = shadow.querySelector(".launcher");
    const panel = shadow.querySelector(".panel");
    const closeBtn = shadow.querySelector(".close");
    const inputEl = shadow.querySelector(".input");
    const sendBtn = shadow.querySelector(".send");
    const actionButtons = [...shadow.querySelectorAll(".action-btn")];

    let openedOnce = false;
    let sending = false;

    function showWelcomeIfNeeded() {
      if (openedOnce) return;
      addMessage(shadow, "bot", UI.welcome);
      openedOnce = true;
    }

    function openPanel() {
      panel.classList.add("open");
      showWelcomeIfNeeded();
      setTimeout(() => inputEl.focus(), 60);
    }

    async function sendText(text) {
      const value = String(text || "").trim();
      if (!value || sending) return;

      sending = true;
      addMessage(shadow, "user", value);
      const typing = addTyping(shadow);

      try {
        const data = await sendToBackend(value);
        typing.remove();

        const reply =
          data?.reply ||
          "Îți mulțumesc! Am primit mesajul tău și te ajut imediat.";

        addMessage(shadow, "bot", reply);

        if (
          value === "Vreau să vorbesc cu un operator" ||
          value === "Aveți și atelier?" ||
          value === "Ce servicii oferiți?" ||
          value === "Timp de livrare"
        ) {
          setTimeout(() => scrollToContact(), 350);
        }
      } catch (err) {
        typing.remove();
        addMessage(
          shadow,
          "bot",
          "Momentan nu pot răspunde instant. Pentru ajutor direct, ne poți suna la 0253242180. Program: luni-vineri 08:00-20:00, sâmbătă-duminică 08:00-15:00."
        );
        console.error("Widget send error:", err);
      } finally {
        sending = false;
      }
    }

    launcher.addEventListener("click", () => {
      if (panel.classList.contains("open")) {
        panel.classList.remove("open");
      } else {
        openPanel();
      }
    });

    closeBtn.addEventListener("click", () => {
      panel.classList.remove("open");
    });

    actionButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        sendText(btn.dataset.label || btn.textContent || "");
      });
    });

    inputEl.addEventListener("input", () => autoresize(inputEl));

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const value = inputEl.value.trim();
        if (!value) return;
        inputEl.value = "";
        autoresize(inputEl);
        sendText(value);
      }
    });

    sendBtn.addEventListener("click", () => {
      const value = inputEl.value.trim();
      if (!value) return;
      inputEl.value = "";
      autoresize(inputEl);
      sendText(value);
    });
  }

  async function boot() {
    await loadRemoteConfig();
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();