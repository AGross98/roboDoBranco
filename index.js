const { fetchLatest } = require("./blaze");
const { process } = require("./monitor");
const { sendWhite } = require("./sender");
const health = require("./health");

health.start();

async function loop() {
  try {
    const records = await fetchLatest();
    const result = process(records);

    if (!result) return;

    console.log("Novo giro:", result);

    if (result.roll === 0) {
      const minute = new Date(result.createdAt).getUTCMinutes();
      await sendWhite(minute);
      console.log("⚪ Branco enviado!");
    }

    health.mark("ciclo OK");
  } catch (err) {
    console.error("Erro no loop:", err.message);
  }
}

setInterval(loop, 3000);