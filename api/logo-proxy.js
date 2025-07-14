export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing image URL");

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type");
    
    res.status(200).send(`data:${contentType};base64,${base64}`);
  } catch (error) {
    console.error("Erreur proxy:", error);
    res.status(500).send("Erreur proxy");
  }
}