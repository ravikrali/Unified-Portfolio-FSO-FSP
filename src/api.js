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

export const isStaticMode = import.meta.env.VITE_STATIC_API === "true";
const staticApi = isStaticMode ? createStaticApi() : null;

export const api = isStaticMode
  ? {
      get: staticApi.get,
      post(path, body) {
        return path === "/api/contact" ? serverApi.post(path, body) : staticApi.post(path, body);
      },
    }
  : serverApi;
