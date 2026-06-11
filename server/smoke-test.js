const http = require("http");

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:4317${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, data }));
    }).on("error", reject);
  });
}

(async () => {
  const health = await get("/api/health");
  if (health.status !== 200) throw new Error("Health check failed");
  const bootstrap = await get("/api/bootstrap");
  const parsed = JSON.parse(bootstrap.data);
  if (!parsed.engagements?.length || !parsed.zones?.length) throw new Error("Bootstrap data missing");
  console.log("Smoke test passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
