export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("URL manquante");

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error("⚠️ Erreur Firebase :", response.status, text);
      return res.status(500).send("Erreur téléchargement image");
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type");
    const base64 = Buffer.from(buffer).toString("base64");

    const dataUrl = `data:${contentType};base64,${base64}`;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(dataUrl);
  } catch (err) {
    console.error("❌ Erreur proxy générale :", err);
    res.status(500).send("Erreur proxy");
  }
}