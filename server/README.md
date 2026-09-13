# WhatsApp Chat Bridge

Backend for the site's chat widget. A visitor's message gets sent to your
WhatsApp; your replies (typed normally in your own WhatsApp app) flow back
into their browser.

**Your personal WhatsApp number is never registered with any API and keeps
working completely normally.** The number that gets wired into Meta's Cloud
API is a separate, free test number Meta provides automatically — your
number only ever receives messages from it and replies to it, like any other
WhatsApp contact.

## How it works

```
Visitor types in the site's chat widget
        ↓
This service (Cloud Run) ──stores in Firestore, calls── WhatsApp Cloud API ──→ your WhatsApp
        ↑                                                                          ↓
        └───────────────── you reply normally in your WhatsApp app ───────────────┘
              (Meta calls this service's /webhook, which stores your reply;
               the widget picks it up on its next poll)
```

## One-time manual setup (you have to do this part — it needs your own Meta account and phone)

1. **Create a Meta Developer account** at [developers.facebook.com](https://developers.facebook.com) (free).
2. **Create an app** → add the **WhatsApp** product to it.
3. In the WhatsApp product's quickstart, Meta gives you:
   - A free test phone number and its **Phone Number ID**
   - A **temporary access token** (valid ~24h — fine to start, see step 6 for a permanent one)
4. **Add your own number as a test recipient**: in the same dashboard, add your
   phone number under "To" recipients and verify it with the code WhatsApp
   sends you. This is what makes the whole thing free — you're the only
   recipient your number ever needs to message.
5. **Create a message template** (Meta → WhatsApp → Message Templates):
   - Name: `new_site_message` (or change `WHATSAPP_TEMPLATE_NAME` to match whatever you pick)
   - Category: Utility
   - Body: `New message from {{1}} on your site: {{2}}`
   - Submit for approval — usually takes minutes to a few hours.
6. **Get a permanent access token** (skip this at first if you just want to
   test — the temporary one works for ~24h): Meta Business Suite → Business
   Settings → System Users → create one, assign it your WhatsApp app with
   `whatsapp_business_messaging` permission, generate a token with no expiry.
7. **Enable Firestore** in your GCP project (Firestore → Native mode) — free
   tier is generous and plenty for personal traffic volume.
8. **Create the composite index** the inbound-webhook lookup needs (`chat_sessions`
   filtered by `status` and ordered by `lastActivityAt` — Firestore doesn't
   create this automatically). Either deploy `server/firestore.indexes.json`
   with the Firebase CLI (`firebase deploy --only firestore:indexes`), or run
   the query once against a real deployment and click the index-creation link
   Firestore prints in the error — either way it takes 1-2 minutes to build.

## Deploying this service

This is a **separate Cloud Run service** from the static site — deploy it on
its own:

```bash
cd server
gcloud run deploy whatsapp-chat-bridge \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars ALLOWED_ORIGIN=https://<your-site-domain> \
  --set-secrets WHATSAPP_TOKEN=whatsapp-token:latest,WHATSAPP_PHONE_NUMBER_ID=whatsapp-phone-id:latest,WHATSAPP_TO_NUMBER=whatsapp-to-number:latest,WHATSAPP_VERIFY_TOKEN=whatsapp-verify-token:latest
```

(Create those secrets in Secret Manager first with `gcloud secrets create`,
or just use `--set-env-vars` directly if you'd rather not use Secret Manager
for a personal project — either works.)

`WHATSAPP_VERIFY_TOKEN` isn't from Meta — you make this up yourself (any
random string); you'll paste the same value into Meta's webhook config in
the next step.

## Wire it up

1. **Point the site at this backend**: in `src/content.js`, set
   `CHAT_API_BASE` to this service's Cloud Run URL, then redeploy the site
   (your existing Cloud Build trigger handles this on merge to `main`). The
   chat widget is hidden entirely while `CHAT_API_BASE` is `null`.
2. **Configure the webhook in Meta's dashboard**: WhatsApp → Configuration →
   Webhook → set the callback URL to `<this-service-url>/webhook` and the
   verify token to whatever you set `WHATSAPP_VERIFY_TOKEN` to. Subscribe to
   the `messages` field.

## Local development

```bash
cd server
cp .env.example .env   # edit as needed
npm install
npm start
```

With `WHATSAPP_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_TO_NUMBER` unset,
the server runs in **dry-run mode** — it logs what it would send instead of
calling the real API, so you can develop and test the whole flow (including
the chat widget) without needing real WhatsApp credentials yet.

## Known limitations (honest MVP scope)

- **One active conversation is assumed at a time.** Your WhatsApp replies are
  routed to the *most recently active* open chat session — fine for a
  personal portfolio's traffic, but if two visitors are chatting
  simultaneously, your replies could go to the wrong one. Worth revisiting
  if this ever gets real concurrent traffic.
- **In-memory fallback (`USE_FIRESTORE=false`) is dev-only** — state is lost
  on restart and isn't shared across instances, so production always needs
  Firestore enabled.
- **The 24-hour WhatsApp service window** governs whether a message needs the
  approved template or can be free-form — handled automatically, but if
  you've genuinely never seen it before, read up on Meta's "customer service
  window" if messages seem to not go through as you'd expect.
