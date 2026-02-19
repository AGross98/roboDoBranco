const fetch = require("node-fetch");

async function sendWhite(minute, platform = "Blaze") {
  const url =
    "https://oirjpetwqekfpvrmdsyh.supabase.co/functions/v1/registrar-branco";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      minuto: minute,
      plataforma: platform
    }),
    timeout: 15000
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  console.log("Resposta API:", data);

  return true;
}

module.exports = { sendWhite };