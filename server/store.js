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

export function isUsingFirestore() {
  return usingFirestore;
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
    await firestore.collection('chat_sessions').doc(sessionId).collection('messages').add(record);
    return record;
  }
  const list = memMessages.get(sessionId) || [];
  list.push(record);
  memMessages.set(sessionId, list);
  return record;
}

export async function getMessages(sessionId) {
  if (usingFirestore) {
    const snap = await firestore
      .collection('chat_sessions')
      .doc(sessionId)
      .collection('messages')
      .orderBy('at', 'asc')
      .get();
    return snap.docs.map((d) => d.data());
  }
  return memMessages.get(sessionId) || [];
}
