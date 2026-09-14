import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import {
  getSession,
  upsertSession,
  getMostRecentOpenSession,
  addMessage,
  getMessages,
  isUsingFirestore,
  sessionTag,
  recordOutboundMessage,
  getSessionIdForMessage,
  getOutboundMessageRef,
  markMessageRead,
} from './store.js';
import { sendTemplateMessage, sendTextMessage, isConfigured } from './whatsapp.js';

const app = express();
// Cloud Run sits exactly one proxy hop in front of the container. Trusting
// only that one hop (not `true`, which trusts any number of hops) is what
// lets req.ip reflect the real client while still stopping a client from
// spoofing their own IP via X-Forwarded-For to dodge the rate limit below.
app.set('trust proxy', 1);
app.use(express.json());

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Caps how fast a single visitor can send messages — this endpoint triggers a
// real WhatsApp send (and counts against Meta's messaging quota) per request.
const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages — please wait a moment before sending another.' },
});

// Named /status rather than /healthz: some platform infrastructure (Cloud Run's
// underlying Knative/Envoy layer) appears to intercept /healthz at the edge
// before it reaches the container, regardless of app-level routing.
app.get('/status', (req, res) => {
  res.json({ ok: true, firestore: isUsingFirestore(), whatsappConfigured: isConfigured() });
});

// ---- Meta webhook verification handshake (one-time, done from the Meta dashboard) ----
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ---- Inbound WhatsApp messages (your replies, typed in your own WhatsApp app) ----
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // ack immediately; Meta expects a fast response

  try {
    const change = req.body?.entry?.[0]?.changes?.[0];

    // "Read" receipts: Meta reports when you've read a message you were
    // sent, so the widget can show the visitor their message was seen.
    const statuses = change?.value?.statuses || [];
    for (const status of statuses) {
      if (status.status !== 'read') continue;
      const ref = await getOutboundMessageRef(status.id);
      if (ref) await markMessageRead(ref.sessionId, ref.messageId);
    }

    const message = change?.value?.messages?.[0];
    if (!message || message.type !== 'text') return;

    const text = message.text?.body;
    if (!text) return;

    // Swipe-replying to a specific message in WhatsApp routes to that
    // visitor's session; otherwise fall back to the most recently active one
    // (fine when only one conversation is going on).
    const repliedToId = message.context?.id;
    const targetSessionId = repliedToId ? await getSessionIdForMessage(repliedToId) : null;
    const session = targetSessionId ? await getSession(targetSessionId) : await getMostRecentOpenSession();
    if (!session) {
      console.warn('Received a WhatsApp reply but no open chat session was found.');
      return;
    }

    await addMessage(session.sessionId, { from: 'owner', text });
    await upsertSession(session.sessionId, { lastOwnerMessageAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error handling inbound webhook:', err);
  }
});

// ---- Visitor sends a message from the site's chat widget ----
app.post('/api/chat', chatRateLimit, async (req, res) => {
  try {
    const { sessionId, text, visitorName } = req.body || {};
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }

    let session = await getSession(sessionId);
    const isNewSession = !session;
    session = await upsertSession(sessionId, {
      status: 'open',
      visitorName: visitorName || session?.visitorName || 'Site visitor',
    });

    const stored = await addMessage(sessionId, { from: 'visitor', text: text.trim() });

    const lastOwnerMessageAt = session.lastOwnerMessageAt ? new Date(session.lastOwnerMessageAt).getTime() : 0;
    const withinServiceWindow = Date.now() - lastOwnerMessageAt < TWENTY_FOUR_HOURS_MS;

    // The visitor's message is already durably stored above, so a WhatsApp
    // delivery failure here (e.g. template pending Meta approval) shouldn't
    // read to the visitor as "your message was lost" — it wasn't.
    // The widget requires a name, so it's usually enough on its own to tell
    // visitors apart; fall back to a tag only if one really wasn't given
    // (e.g. a direct API call that skips the widget's validation).
    const label = session.visitorName === 'Site visitor'
      ? `${session.visitorName} (${sessionTag(sessionId)})`
      : session.visitorName;
    try {
      const result = withinServiceWindow && !isNewSession
        ? await sendTextMessage(`${label}: ${text.trim()}`)
        : await sendTemplateMessage([label, text.trim()]);
      const waMessageId = result?.messages?.[0]?.id;
      await recordOutboundMessage(waMessageId, sessionId, stored.id);
    } catch (sendErr) {
      console.error('WhatsApp delivery failed (message is still saved):', sendErr);
    }

    res.json({ ok: true, message: stored });
  } catch (err) {
    console.error('Error handling /api/chat:', err);
    res.status(500).json({ error: 'Something went wrong sending your message. Please try again.' });
  }
});

// ---- Widget polls this to pick up your WhatsApp replies ----
app.get('/api/messages/:sessionId', async (req, res) => {
  try {
    const messages = await getMessages(req.params.sessionId);
    res.json({ messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Could not load messages.' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`WhatsApp chat bridge listening on :${port} (firestore=${isUsingFirestore()}, whatsappConfigured=${isConfigured()})`);
});
