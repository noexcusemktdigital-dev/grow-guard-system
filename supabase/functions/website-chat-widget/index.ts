import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

const WIDGET_JS = `
(function() {
  var API_KEY = document.currentScript.getAttribute("data-org");
  var COLOR = document.currentScript.getAttribute("data-color") || "#6366f1";
  var WELCOME = document.currentScript.getAttribute("data-welcome") || "Olá! Como posso ajudar?";
  var POSITION = document.currentScript.getAttribute("data-position") || "right";
  var AGENT_NAME = document.currentScript.getAttribute("data-agent") || "Atendente";
  var API_URL = document.currentScript.getAttribute("data-api") || "";

  var sessionId = null;
  var lastTimestamp = new Date(0).toISOString();
  var isOpen = false;
  var messages = [];

  // Styles
  var style = document.createElement("style");
  style.textContent = \`
    #noe-chat-widget { position: fixed; bottom: 20px; \${POSITION}: 20px; z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #noe-chat-btn { width: 56px; height: 56px; border-radius: 50%; background: \${COLOR}; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
    #noe-chat-btn:hover { transform: scale(1.05); }
    #noe-chat-btn svg { width: 28px; height: 28px; fill: white; }
    #noe-chat-box { display: none; width: 360px; height: 500px; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.15); background: #fff; flex-direction: column; position: absolute; bottom: 70px; \${POSITION}: 0; }
    #noe-chat-box.open { display: flex; }
    #noe-chat-header { background: \${COLOR}; color: white; padding: 16px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; }
    #noe-chat-header .avatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 16px; }
    #noe-chat-msgs { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .noe-msg { max-width: 80%; padding: 10px 14px; border-radius: 16px; font-size: 13px; line-height: 1.4; word-wrap: break-word; }
    .noe-msg.in { background: #f1f3f5; align-self: flex-start; border-bottom-left-radius: 4px; }
    .noe-msg.out { background: \${COLOR}; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    #noe-chat-input { display: flex; border-top: 1px solid #e5e7eb; padding: 8px; gap: 8px; }
    #noe-chat-input input { flex: 1; border: 1px solid #e5e7eb; border-radius: 24px; padding: 8px 16px; font-size: 13px; outline: none; }
    #noe-chat-input input:focus { border-color: \${COLOR}; }
    #noe-chat-input button { background: \${COLOR}; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    #noe-chat-input button svg { width: 18px; height: 18px; fill: white; }
  \`;
  document.head.appendChild(style);

  // DOM
  var widget = document.createElement("div");
  widget.id = "noe-chat-widget";
  widget.innerHTML = \`
    <div id="noe-chat-box">
      <div id="noe-chat-header">
        <div class="avatar">💬</div>
        <div><div>\${AGENT_NAME}</div><div style="font-size:11px;opacity:0.8">Online</div></div>
      </div>
      <div id="noe-chat-msgs"></div>
      <div id="noe-chat-input">
        <input type="text" placeholder="Digite sua mensagem..." id="noe-input" />
        <button id="noe-send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
      </div>
    </div>
    <button id="noe-chat-btn"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg></button>
  \`;
  document.body.appendChild(widget);

  var btn = document.getElementById("noe-chat-btn");
  var box = document.getElementById("noe-chat-box");
  var msgsDiv = document.getElementById("noe-chat-msgs");
  var input = document.getElementById("noe-input");
  var sendBtn = document.getElementById("noe-send");

  btn.onclick = function() {
    isOpen = !isOpen;
    if (isOpen) {
      box.classList.add("open");
      if (!sessionId) startSession();
    } else {
      box.classList.remove("open");
    }
  };

  function addMsg(text, dir) {
    var div = document.createElement("div");
    div.className = "noe-msg " + dir;
    div.textContent = text;
    msgsDiv.appendChild(div);
    msgsDiv.scrollTop = msgsDiv.scrollHeight;
  }

  function apiCall(data) {
    return fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ api_key: API_KEY }, data))
    }).then(function(r) { return r.json(); });
  }

  function startSession() {
    addMsg(WELCOME, "in");
    apiCall({ action: "start", visitor_name: null, page_url: location.href }).then(function(d) {
      if (d.session_id) {
        sessionId = d.session_id;
        setInterval(pollMessages, 3000);
      }
    });
  }

  function sendMessage() {
    var text = input.value.trim();
    if (!text || !sessionId) return;
    input.value = "";
    addMsg(text, "out");
    apiCall({ action: "send", session_id: sessionId, content: text });
  }

  function pollMessages() {
    if (!sessionId) return;
    apiCall({ action: "poll", session_id: sessionId, since: lastTimestamp }).then(function(d) {
      if (d.messages) {
        d.messages.forEach(function(m) {
          if (m.direction === "outbound") {
            addMsg(m.content, "in");
          }
          lastTimestamp = m.created_at;
        });
      }
    });
  }

  sendBtn.onclick = sendMessage;
  input.addEventListener("keydown", function(e) { if (e.key === "Enter") sendMessage(); });
})();
`;

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'website-chat-widget');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  return new Response(WIDGET_JS, { headers: getCorsHeaders(req) });
});
