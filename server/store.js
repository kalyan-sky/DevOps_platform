import { Firestore } from '@google-cloud/firestore';

let firestore = null;
let usingFirestore = false;

if (process.env.USE_FIRESTORE !== 'false') {
  try {
    firestore = new Firestore();
    usingFirestore = true;
  } catch (err) {
    console.warn('Firestore unavailable, falling back to in-memory store:', err.message);
  }
}

// In-memory fallback: fine for local dev/testing. Not safe for multi-instance
// production use (state is lost on restart and not shared across instances).
const memSessions = new Map();
const memMessages = new Map(); // sessionId -> array of messages
const memOutboundMessages = new Map(); // WhatsApp message id -> sessionId

export function isUsingFirestore() {
  return usingFirestore;
}

// Short, human-readable label for a session (e.g. "V4821") so multiple
// concurrent visitors are distinguishable in WhatsApp even without a name.
export function sessionTag(sessionId) {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) >>> 0;
  }
  return `V${(hash % 9000) + 1000}`;
}

export async function getSession(sessionId) {
  if (usingFirestore) {
    const doc = await firestore.collection('chat_sessions').doc(sessionId).get();
    return doc.exists ? doc.data() : null;
  }
  return memSessions.get(sessionId) || null;
}

export async function upsertSession(sessionId, patch) {
  const now = new Date().toISOString();
  if (usingFirestore) {
    const ref = firestore.collection('chat_sessions').doc(sessionId);
    await ref.set({ ...patch, sessionId, lastActivityAt: now }, { merge: true });
    const doc = await ref.get();
    return doc.data();
  }
  const existing = memSessions.get(sessionId) || { sessionId };
  const updated = { ...existing, ...patch, lastActivityAt: now };
  memSessions.set(sessionId, updated);
  return updated;
}

export async function getMostRecentOpenSession() {
  if (usingFirestore) {
    const snap = await firestore
      .collection('chat_sessions')
      .where('status', '==', 'open')
      .orderBy('lastActivityAt', 'desc')
      .limit(1)
      .get();
    return snap.empty ? null : snap.docs[0].data();
  }
  let best = null;
  for (const s of memSessions.values()) {
    if (s.status !== 'open') continue;
    if (!best || s.lastActivityAt > best.lastActivityAt) best = s;
  }
  return best;
}

export async function addMessage(sessionId, message) {
  const record = { ...message, at: new Date().toISOString() };
  if (usingFirestore) {
    const ref = await firestore.collection('chat_sessions').doc(sessionId).collection('messages').add(record);
    return { ...record, id: ref.id };
  }
  const list = memMessages.get(sessionId) || [];
  list.push(record);
  memMessages.set(sessionId, list);
  return { ...record, id: list.length - 1 };
}

export async function getMessages(sessionId) {
  if (usingFirestore) {
    const snap = await firestore
      .collection('chat_sessions')
      .doc(sessionId)
      .collection('messages')
      .orderBy('at', 'asc')
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return (memMessages.get(sessionId) || []).map((m, id) => ({ id, ...m }));
}

// Marks a visitor's message as read (from a WhatsApp "read" status webhook)
// so the widget can show a seen indicator.
export async function markMessageRead(sessionId, messageId) {
  if (usingFirestore) {
    await firestore
      .collection('chat_sessions')
      .doc(sessionId)
      .collection('messages')
      .doc(messageId)
      .update({ read: true });
    return;
  }
  const list = memMessages.get(sessionId);
  if (list && list[messageId]) list[messageId] = { ...list[messageId], read: true };
}

// Maps a sent WhatsApp message id back to where it came from, so a
// swipe-reply (which carries the original message's id as context.id) can be
// routed to the right visitor instead of guessing "most recently active",
// and a "read" status webhook can mark the right message as seen.
export async function recordOutboundMessage(waMessageId, sessionId, messageId) {
  if (!waMessageId) return;
  if (usingFirestore) {
    await firestore.collection('wa_message_index').doc(waMessageId).set({ sessionId, messageId });
    return;
  }
  memOutboundMessages.set(waMessageId, { sessionId, messageId });
}

export async function getOutboundMessageRef(waMessageId) {
  if (!waMessageId) return null;
  if (usingFirestore) {
    const doc = await firestore.collection('wa_message_index').doc(waMessageId).get();
    return doc.exists ? doc.data() : null;
  }
  return memOutboundMessages.get(waMessageId) || null;
}

export async function getSessionIdForMessage(waMessageId) {
  const ref = await getOutboundMessageRef(waMessageId);
  return ref ? ref.sessionId : null;
}
