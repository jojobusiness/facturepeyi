const ALLOWED_ORIGINS = ["https://www.facturepeyi.com", "https://facturepeyi.com"];
const ALLOWED_HOSTS = ["firebasestorage.googleapis.com", "storage.googleapis.com"];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).end();

  const { url } = req.query;
  if (!url) return res.status(400).send("Missing image URL");

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).send("URL invalide");
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return res.status(403).send("Domaine non autorisé");
  }

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/png";
    res.status(200).send(`data:${contentType};base64,${base64}`);
  } catch (error) {
    console.error("Erreur proxy:", error);
    res.status(500).send("Erreur proxy");
  }
}
