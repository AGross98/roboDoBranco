const fetch = require("node-fetch");

async function sendV1(minute, platform = "Blaze") {
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


async function sendV2( minute, platform = "Blaze") {
  console.log(minute)
  const url = "https://tohldyqvxbrmypxtnlpr.supabase.co/functions/v1/registrar-branco"
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvaGxkeXF2eGJybXlweHRubHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTY5NzMsImV4cCI6MjA4NzUzMjk3M30.zb9u8EA_N0RYHlKN0e2wEj3qkM2H-mK--8aGfvWQ6SA',
    apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvaGxkeXF2eGJybXlweHRubHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTY5NzMsImV4cCI6MjA4NzUzMjk3M30.zb9u8EA_N0RYHlKN0e2wEj3qkM2H-mK--8aGfvWQ6SA",

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

module.exports = { sendV1, sendV2 };