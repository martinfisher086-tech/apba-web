const FORM_CONFIG = {
  asociate: {
    subject: "Nueva solicitud de asociación",
    required: ["nombre", "email"],
  },
  contacto: {
    subject: "Nuevo mensaje de contacto",
    required: ["nombre", "email", "mensaje"],
  },
  newsletter: {
    subject: "Nueva suscripción al newsletter",
    required: ["nombre", "email"],
  },
};

const FALLBACK_EMAIL = "martinfisher086@gmail.com";
const MAX_FIELD_LENGTH = 5_000;

function textResponse(message, status = 400) {
  return new Response(`${message}\n\nContacto alternativo: ${FALLBACK_EMAIL}`, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function sanitizeFields(formData) {
  return Object.fromEntries(
    [...formData.entries()]
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, value.trim().slice(0, MAX_FIELD_LENGTH)]),
  );
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return textResponse("Método no permitido.", 405);
  }

  const type = new URL(request.url).searchParams.get("type");
  const config = FORM_CONFIG[type];
  if (!config) {
    return textResponse("Formulario desconocido.");
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 25_000) {
    return textResponse("El formulario supera el tamaño permitido.", 413);
  }

  let fields;
  try {
    fields = sanitizeFields(await request.formData());
  } catch {
    return textResponse("No se pudo interpretar el formulario.");
  }

  if (fields.website) {
    return Response.redirect(new URL("/mensaje-enviado/", request.url), 303);
  }

  const missing = config.required.filter((field) => !fields[field]);
  if (missing.length > 0) {
    return textResponse(`Faltan campos obligatorios: ${missing.join(", ")}.`);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return textResponse("El correo electrónico no es válido.");
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return textResponse(
      "El envío por correo todavía no está configurado.",
      503,
    );
  }

  const recipient = process.env.FORM_NOTIFICATION_EMAIL || FALLBACK_EMAIL;
  const sender =
    process.env.FORM_FROM_EMAIL || "APBA Web <onboarding@resend.dev>";
  const body = Object.entries(fields)
    .filter(([key]) => key !== "website")
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  let emailResponse;
  try {
    emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "APBA-Web/1.0",
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: fields.email,
        subject: `[APBA Web] ${config.subject}`,
        text: body,
      }),
    });
  } catch (error) {
    console.error(
      "Could not reach Resend",
      error instanceof Error ? error.message : error,
    );
    return textResponse(
      "No pudimos enviar el formulario. Intentá nuevamente más tarde.",
      502,
    );
  }

  if (!emailResponse.ok) {
    console.error("Resend rejected form email", emailResponse.status);
    return textResponse(
      "No pudimos enviar el formulario. Intentá nuevamente más tarde.",
      502,
    );
  }

  return Response.redirect(new URL("/mensaje-enviado/", request.url), 303);
}
