const puppeteer = require("puppeteer");
const fetch = require("node-fetch");

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
 * Garante que estamos na página correta
 */
async function openTargetPage(page) {
  await page.goto(
    "https://www.tipminer.com/br/historico/blaze/double",
    { waitUntil: "networkidle2" }
  );

  await page.waitForSelector("button.cell", { timeout: 15000 });
}

/**
 * Verifica se a sessão caiu
 */
async function ensurePageAlive(page) {
  const url = page.url();

  if (url.indexOf("/login") !== -1) {
    console.log("Sessão expirada. Recuperando...");

    lastProcessedDate = null;
    await openTargetPage(page);

    console.log("Sessão restaurada.");
    return false;
  }

  return true;
}

/**
 * Extrai o último resultado
 */
async function getLatestResult(page) {
  return await page.evaluate(function () {
    const firstCell = document.querySelector("button.cell");
    if (!firstCell) return null;

    const numberEl = firstCell.querySelector(".cell__result");
    const timeEl = firstCell.querySelector(".cell__date");
    const tooltipEl = firstCell.closest(".group")
      ? firstCell.closest(".group").querySelector(".cell__tooltip")
      : null;

    return {
      number: numberEl ? Number(numberEl.innerText.trim()) : null,
      time: timeEl ? timeEl.innerText.trim() : null,
      fullDate: tooltipEl ? tooltipEl.innerText.trim() : null
    };
  });
}

/**
 * Loop principal
 */
function startMonitor(page) {
  if (monitoring) return;
  monitoring = true;

  setInterval(async function () {
    try {
      const alive = await ensurePageAlive(page);
      if (!alive) return;

      const result = await getLatestResult(page);
      if (!result || !result.fullDate) return;

      if (result.fullDate === lastProcessedDate) return;
      lastProcessedDate = result.fullDate;

      console.log("Novo resultado:", result);

      if (result.number === 0 && result.time) {
        const parts = result.time.split(":");
        const minute = Number(parts[1]);
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
async function send(from, minute) {
  console.log("Enviando branco:", minute, from);

  try {
    const url =
      "https://oirjpetwqekfpvrmdsyh.supabase.co/functions/v1/registrar-branco";

    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        minuto: minute,
        plataforma: from
      })
    });

    const dados = await resposta.json();
    console.log("Resposta:", dados);
  } catch (erro) {
    console.error("Erro ao enviar:", erro);
  }
}

main();