import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import forms from "../api/forms.js";

const originalFetch = globalThis.fetch;
const originalKey = process.env.RESEND_API_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalKey;
});

function request(type, fields, method = "POST") {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  return new Request(`https://apba-web.vercel.app/api/forms?type=${type}`, {
    method,
    body: method === "POST" ? body : undefined,
  });
}

test("rejects invalid submissions before calling the email provider", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response(null, { status: 200 });
  };
  process.env.RESEND_API_KEY = "test-key";

  const response = await forms(
    request("contacto", { nombre: "Ana", email: "bad" }),
  );
  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test("honeypot submissions succeed without sending email", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response(null, { status: 200 });
  };

  const response = await forms(
    request("newsletter", {
      nombre: "Bot",
      email: "bot@example.com",
      website: "spam",
    }),
  );
  assert.equal(response.status, 303);
  assert.equal(called, false);
});

test("sends a valid form to the provisional recipient", async () => {
  process.env.RESEND_API_KEY = "test-key";
  delete process.env.FORM_NOTIFICATION_EMAIL;
  let payload;
  globalThis.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return new Response(null, { status: 200 });
  };

  const response = await forms(
    request("contacto", {
      nombre: "Ana",
      email: "ana@example.com",
      mensaje: "Consulta",
    }),
  );
  assert.equal(response.status, 303);
  assert.deepEqual(payload.to, ["martinfisher086@gmail.com"]);
  assert.equal(payload.reply_to, "ana@example.com");
  assert.match(payload.text, /mensaje: Consulta/);
});

test("shows the alternative contact when email is not configured", async () => {
  delete process.env.RESEND_API_KEY;
  const response = await forms(
    request("asociate", { nombre: "Ana", email: "ana@example.com" }),
  );
  assert.equal(response.status, 503);
  assert.match(await response.text(), /martinfisher086@gmail\.com/);
});
