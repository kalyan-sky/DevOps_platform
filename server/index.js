import express from 'express';
import cors from 'cors';
import {
  getSession,
  upsertSession,
  getMostRecentOpenSession,
  addMessage,
  getMessages,
  isUsingFirestore,
} from './store.js';
import { sendTemplateMessage, sendTextMessage, isConfigured } from './whatsapp.js';

const app = express();
app.use(express.json());

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

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
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    if (!message || message.type !== 'text') return;

    const text = message.text?.body;
    if (!text) return;

    const session = await getMostRecentOpenSession();
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
app.post('/api/chat', async (req, res) => {
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
    try {
      if (withinServiceWindow && !isNewSession) {
        await sendTextMessage(`${session.visitorName}: ${text.trim()}`);
      } else {
        await sendTemplateMessage([session.visitorName, text.trim()]);
      }
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
