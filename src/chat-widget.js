import { CHAT_API_BASE, PROFILE } from './content.js';

const SESSION_KEY = 'chat_session_id';
const NAME_KEY = 'chat_visitor_name';
const POLL_INTERVAL_MS = 4000;

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'sess_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function mountChatWidget() {
  if (!CHAT_API_BASE) return; // not configured yet — see server/README.md

  const sessionId = getOrCreateSessionId();
  let visitorName = localStorage.getItem(NAME_KEY) || '';
  let renderedCount = 0;
  let pollTimer = null;

  const root = document.createElement('div');
  root.className = 'chat-widget';
  root.innerHTML = `
    <button class="chat-fab" id="chat-fab" aria-label="Open chat">💬</button>
    <div class="chat-panel" id="chat-panel" hidden>
      <div class="chat-header">
        <div>
          <p class="chat-title">Chat with ${escapeHtml(PROFILE.name.split(' ')[0])}</p>
          <p class="chat-subtitle">Replies come from WhatsApp, usually within a few hours</p>
        </div>
        <button class="chat-close" id="chat-close" aria-label="Close chat">✕</button>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <p class="chat-error" id="chat-error" hidden></p>
      <form class="chat-form" id="chat-form">
        ${!visitorName ? '<input class="chat-name-input" id="chat-name" placeholder="Your name (optional)" autocomplete="name" />' : ''}
        <div class="chat-input-row">
          <input class="chat-text-input" id="chat-text" placeholder="Type a message…" autocomplete="off" required />
          <button class="chat-send" type="submit" aria-label="Send">→</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(root);

  const fab = root.querySelector('#chat-fab');
  const panel = root.querySelector('#chat-panel');
  const closeBtn = root.querySelector('#chat-close');
  const messagesEl = root.querySelector('#chat-messages');
  const errorEl = root.querySelector('#chat-error');
  const form = root.querySelector('#chat-form');
  const textInput = root.querySelector('#chat-text');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function clearError() {
    errorEl.hidden = true;
  }

  function renderMessages(messages) {
    if (messages.length === renderedCount) return;
    renderedCount = messages.length;
    messagesEl.innerHTML = messages
      .map(
        (m) => `<div class="chat-msg chat-msg-${m.from}">
          <span class="chat-msg-text">${escapeHtml(m.text)}</span>
        </div>`
      )
      .join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function poll() {
    try {
      const res = await fetch(`${CHAT_API_BASE}/api/messages/${sessionId}`);
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      renderMessages(data.messages || []);
      clearError();
    } catch (err) {
      showError('Chat is temporarily unavailable — email me instead at ' + PROFILE.email);
    }
  }

  function startPolling() {
    if (pollTimer) return;
    poll();
    pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  }
  function stopPolling() {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  fab.addEventListener('click', () => {
    panel.hidden = false;
    fab.hidden = true;
    startPolling();
  });
  closeBtn.addEventListener('click', () => {
    panel.hidden = true;
    fab.hidden = false;
    stopPolling();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = textInput.value.trim();
    if (!text) return;

    const nameInput = root.querySelector('#chat-name');
    if (nameInput && nameInput.value.trim()) {
      visitorName = nameInput.value.trim();
      localStorage.setItem(NAME_KEY, visitorName);
      nameInput.remove();
    }

    textInput.value = '';
    textInput.disabled = true;

    try {
      const res = await fetch(`${CHAT_API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, text, visitorName: visitorName || undefined }),
      });
      if (!res.ok) throw new Error('bad response');
      clearError();
      await poll();
    } catch (err) {
      showError('Message not sent — email me instead at ' + PROFILE.email);
    } finally {
      textInput.disabled = false;
      textInput.focus();
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
