// Express ou tout autre framework léger
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// 🔧 Route pour proxyfier une image Firebase
app.get("/proxy-logo", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing image URL");

  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    const base64 = buffer.toString("base64");
    const contentType = response.headers.get("content-type");

    res.send(`data:${contentType};base64,${base64}`);
  } catch (err) {
    console.error("Erreur proxy logo:", err);
    res.status(500).send("Erreur lors du chargement du logo");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy Logo Server running on port ${PORT}`);
});