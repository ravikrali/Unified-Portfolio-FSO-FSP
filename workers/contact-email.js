const CONTACT_EMAIL = "contact@r2dw.com";
const SENDER_EMAIL = "noreply@strathub360.com";
const MAX_MESSAGE_LENGTH = 5000;

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    if (request.method !== "POST" || requestUrl.pathname !== "/api/contact") {
      return json({ error: "Not found." }, 404);
    }

    const origin = request.headers.get("Origin");
    if (origin !== requestUrl.origin) {
      return json({ error: "This request must be submitted from the StratHub360 contact form." }, 403);
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > 12000) {
      return json({ error: "The contact request is too large." }, 413);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Enter a valid email address and message." }, 400);
    }

    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    const isDeepDive = body.purpose === "deep-dive";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Enter a valid email address." }, 400);
    }
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return json({ error: `Enter a message of ${MAX_MESSAGE_LENGTH.toLocaleString()} characters or fewer.` }, 400);
    }

    const subject = isDeepDive ? "StratHub360 deep dive session request" : "StratHub360 contact request";
    const text = `A visitor submitted a request through StratHub360.\n\nReply to: ${email}\n\nMessage:\n${message}`;
    const html = `<p>A visitor submitted a request through StratHub360.</p><p><strong>Reply to:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`;

    try {
      const result = await env.EMAIL.send({
        to: CONTACT_EMAIL,
        from: { email: SENDER_EMAIL, name: "StratHub360" },
        replyTo: email,
        subject,
        text,
        html,
      });
      console.log(JSON.stringify({ event: "contact_email_sent", messageId: result.messageId }));
      return json({ ok: true });
    } catch (error) {
      console.error(JSON.stringify({
        event: "contact_email_failed",
        code: error?.code || "unknown",
        message: error instanceof Error ? error.message : String(error),
      }));
      return json({ error: "The email could not be sent right now. Please try again." }, 502);
    }
  },
};
