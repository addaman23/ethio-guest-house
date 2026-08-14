import { config } from "../config";

export type SmsSendResult = { ok: true } | { ok: false; error: string };

/**
 * Send a plain SMS. Providers are selected via SMS_PROVIDER:
 * - console — log only (local/dev)
 * - twilio  — Twilio Messages API
 * - http    — generic JSON POST (AfroMessage, GeezSMS, custom gateway)
 * - none    — refuse to send
 */
export async function sendSms(to: string, body: string): Promise<SmsSendResult> {
  const provider = config.sms.provider;

  if (provider === "none") {
    return { ok: false, error: "SMS_PROVIDER is none — SMS sending is disabled" };
  }

  if (provider === "console") {
    console.log(`[sms:console] to=${to} body=${body}`);
    return { ok: true };
  }

  if (provider === "twilio") {
    return sendViaTwilio(to, body);
  }

  if (provider === "http") {
    return sendViaHttp(to, body);
  }

  return { ok: false, error: `Unknown SMS_PROVIDER: ${provider}` };
}

async function sendViaTwilio(to: string, body: string): Promise<SmsSendResult> {
  const { accountSid, authToken, from } = config.sms.twilio;
  if (!accountSid || !authToken || !from) {
    return {
      ok: false,
      error: "Twilio requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM",
    };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const form = new URLSearchParams({ To: to, From: from, Body: body });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Twilio ${res.status}: ${text.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Generic HTTP JSON gateway.
 * Body template placeholders: {{to}}, {{message}}, {{from}}
 * Default shape matches common Ethiopian gateways (to + message + optional from/sender).
 */
async function sendViaHttp(to: string, body: string): Promise<SmsSendResult> {
  const { url, apiKey, apiKeyHeader, from, bodyTemplate } = config.sms.http;
  if (!url) {
    return { ok: false, error: "SMS_HTTP_URL is required when SMS_PROVIDER=http" };
  }

  const payloadRaw = (bodyTemplate || '{"to":"{{to}}","message":"{{message}}","from":"{{from}}"}')
    .replaceAll("{{to}}", to)
    .replaceAll("{{message}}", body)
    .replaceAll("{{from}}", from);

  let payload: unknown;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return { ok: false, error: "SMS_HTTP_BODY_TEMPLATE must be valid JSON after substitution" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (apiKey) {
    const headerName = apiKeyHeader || "Authorization";
    if (headerName.toLowerCase() === "authorization") {
      headers.Authorization = apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`;
    } else {
      headers[headerName] = apiKey;
    }
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `SMS HTTP ${res.status}: ${text.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
