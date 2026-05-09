export default function handler(req, res) {
  return res.status(404).json({ error: "Endpoint supprimé — utiliser /api/get-session-info" });
}
