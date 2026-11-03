async function main() {
  const loginRes = await fetch("http://127.0.0.1:3000/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD || "admin123" })
  });

  const setCookie = loginRes.headers.get("set-cookie") || "";
  console.log("Login status:", loginRes.status, "Cookie:", setCookie ? "OK" : "NONE");

  const match = setCookie.match(/admin_session=([^;]+)/);
  const cookieHeader = match ? `admin_session=${match[1]}` : "";

  const res = await fetch("http://127.0.0.1:3000/api/admin/suppliers/inspect-deposit", {
    method: "POST",
    headers: {
      "Cookie": cookieHeader,
      "Content-Type": "application/json",
      "x-internal-secret": process.env.CRON_SECRET || "internal_sync_secret_token"
    },
  });

  console.log("Inspect status:", res.status);
  const data = await res.json();
  console.log("INSPECT DATA:\n", JSON.stringify(data, null, 2));
}

main().catch(console.error);
