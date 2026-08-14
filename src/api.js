import { createStaticApi } from "./static-api";

const serverApi = {
  async get(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`GET ${path} failed`);
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || `POST ${path} failed`);
    return payload;
  },
};

const contactApi = {
  async post(body) {
    const subject = body.purpose === "deep-dive"
      ? "StratHub360 deep dive session request"
      : "StratHub360 contact request";
    const formData = new URLSearchParams({
      email: String(body.email || "").trim(),
      message: String(body.message || "").trim(),
      _subject: subject,
      _template: "table",
      _captcha: "false",
    });
    const res = await fetch("https://formsubmit.co/ajax/contact@r2dw.com", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload.success === false || payload.success === "false") {
      throw new Error(payload.message || "The email could not be sent right now. Please try again.");
    }
    return { ok: true };
  },
};

export const isStaticMode = import.meta.env.VITE_STATIC_API === "true";
const staticApi = isStaticMode ? createStaticApi() : null;

export const api = isStaticMode
  ? {
      get: staticApi.get,
      post(path, body) {
        return path === "/api/contact" ? contactApi.post(body) : staticApi.post(path, body);
      },
    }
  : serverApi;
