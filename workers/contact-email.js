const CONTACT_EMAIL = "contact@r2dw.com";
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;
const MAX_MESSAGE_LENGTH = 5000;

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export default {
  async fetch(request) {
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
    const formData = new URLSearchParams({
      email,
      message,
      _subject: subject,
      _template: "table",
      _captcha: "false",
    });

    try {
      const providerResponse = await fetch(FORMSUBMIT_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      let providerResult = null;
      try {
        providerResult = await providerResponse.json();
      } catch {
        // The status code remains the source of truth if the provider omits JSON.
      }

      if (!providerResponse.ok || providerResult?.success === "false" || providerResult?.success === false) {
        throw new Error(providerResult?.message || `FormSubmit returned ${providerResponse.status}`);
      }

      console.log(JSON.stringify({ event: "contact_email_accepted", provider: "formsubmit" }));
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
