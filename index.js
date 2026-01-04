import puppeteer from "puppeteer";
import fetch from "node-fetch";

let lastProcessedDate = null;
let monitoring = false;

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await openTargetPage(page);

  startMonitor(page);
}

/**
 * Garante que estamos na página correta (não no login)
 */
async function openTargetPage(page) {
  await page.goto(
    "https://www.tipminer.com/br/historico/blaze/double",
    { waitUntil: "networkidle2" }
  );

  await page.waitForSelector("button.cell", { timeout: 15000 });
}

/**
 * Verifica se a sessão caiu e recupera automaticamente
 */
async function ensurePageAlive(page) {
  const url = page.url();

  if (url.includes("/login")) {
    console.log("⚠️ Sessão expirada. Recuperando...");

    lastProcessedDate = null; // evita falso duplicado

    await openTargetPage(page);

    console.log("✅ Sessão restaurada.");
    return false;
  }

  return true;
}

/**
 * Extrai o último resultado
 */
async function getLatestResult(page) {
  return await page.evaluate(() => {
    const firstCell = document.querySelector("button.cell");
    if (!firstCell) return null;

    const number = firstCell.querySelector(".cell__result")?.innerText.trim();
    const time = firstCell.querySelector(".cell__date")?.innerText.trim();
    const tooltip = firstCell
      .closest(".group")
      ?.querySelector(".cell__tooltip")
      ?.innerText.trim();

    return {
      number: Number(number),
      time,
      fullDate: tooltip
    };
  });
}

/**
 * Loop principal
 */
function startMonitor(page) {
  if (monitoring) return;
  monitoring = true;

  setInterval(async () => {
    try {
      const alive = await ensurePageAlive(page);
      if (!alive) return;

      const result = await getLatestResult(page);
      if (!result || !result.fullDate) return;

      if (result.fullDate === lastProcessedDate) return;
      lastProcessedDate = result.fullDate;

      console.log("🎯 Novo resultado:", result);

      if (result.number === 0) {
        const minute = Number(result.time.split(":")[1]);
        await send("Blaze", minute);
      }

    } catch (err) {
      console.error("Erro no monitor:", err);
    }
  }, 3000);
}

/**
 * Envia o branco
 */
async function send(from, minut) {
  console.log("📤 Enviando branco:", minut, from);

  try {
    const url =
      "https://oirjpetwqekfpvrmdsyh.supabase.co/functions/v1/registrar-branco";

    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        minuto: minut,
        plataforma: from
      })
    });

    const dados = await resposta.json();
    console.log("✅ Resposta:", dados);

  } catch (erro) {
    console.error("❌ Erro ao enviar:", erro);
  }
}

main();
