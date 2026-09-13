const GRAPH_VERSION = 'v23.0';

function isConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TO_NUMBER);
}

async function callGraphApi(payload) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`WhatsApp API error ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

// First message in a session (or after the 24h customer-service window has
// closed) must use a pre-approved template. `bodyParams` fills the template's
// {{1}}, {{2}}, ... placeholders in order.
export async function sendTemplateMessage(bodyParams) {
  const to = process.env.WHATSAPP_TO_NUMBER;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;

  if (!isConfigured() || !templateName) {
    console.log('[whatsapp:dry-run] would send template', templateName, 'to', to, 'params:', bodyParams);
    return { dryRun: true };
  }

  return callGraphApi({
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: bodyParams.map((text) => ({ type: 'text', text })),
        },
      ],
    },
  });
}

// Free-form text — only allowed within 24h of the recipient's last message to you.
export async function sendTextMessage(text) {
  const to = process.env.WHATSAPP_TO_NUMBER;

  if (!isConfigured()) {
    console.log('[whatsapp:dry-run] would send text to', to, ':', text);
    return { dryRun: true };
  }

  return callGraphApi({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  });
}

export { isConfigured };
