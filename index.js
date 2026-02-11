const puppeteer = require("puppeteer");
const fetch = require("node-fetch");

let lastProcessedDate = null;
let monitoring = false;
let lastHealthyActivity = Date.now();

let browser;
let page;

function markHealthy(label = "") {
  lastHealthyActivity = Date.now();
  console.log("[HEALTHY]", label, new Date().toISOString());
}

setInterval(() => {
  const diff = Date.now() - lastHealthyActivity;

  if (diff > 3 * 60 * 1000) {
    console.error("Robô travado por muito tempo. Reiniciando...");
    process.exit(1);
  }
}, 60 * 1000);

setTimeout(() => {
  console.log("Reinício preventivo do robô");
  process.exit(0);
}, 55 * 60 * 1000);

async function main() {
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: "/usr/bin/chromium",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    page = await browser.newPage();

    await openTargetPage(page);
    startMonitor();

  } catch (err) {
    console.error("Erro ao iniciar o robô:", err);
    process.exit(1);
  }
}

async function openTargetPage(page) {
  console.log("Abrindo página alvo...");

  await page.goto(
    "https://www.tipminer.com/br/historico/blaze/double",
    { waitUntil: "networkidle2", timeout: 120000 }
  );

  await page.waitForSelector("button.cell", { timeout: 15000 });

  console.log("Página pronta");
}

async function recreatePage() {
  console.log("Recriando página...");

  try {
    if (page) await page.close();
  } catch (_) {}

  page = await browser.newPage();
  await openTargetPage(page);
}

async function getLatestResult(page) {
  try {
    return await page.evaluate(() => {
      const firstCell = document.querySelector("button.cell");
      if (!firstCell) return null;

      const numberEl = firstCell.querySelector(".cell__result");
      const timeEl = firstCell.querySelector(".cell__date");

      let tooltipEl = null;
      const groupEl = firstCell.closest(".group");
      if (groupEl) {
        tooltipEl = groupEl.querySelector(".cell__tooltip");
      }

      return {
        number: numberEl ? Number(numberEl.innerText.trim()) : null,
        time: timeEl ? timeEl.innerText.trim() : null,
        fullDate: tooltipEl ? tooltipEl.innerText.trim() : null
      };
    });
  } catch (err) {
    if (err.message.includes("Execution context was destroyed")) {
      console.warn("Contexto destruído (reload detectado)");
      return "RELOAD";
    }
    throw err;
  }
}


function startMonitor() {
  if (monitoring) return;
  monitoring = true;

  setInterval(async () => {
    try {
      const result = await getLatestResult(page);

      if (result === "RELOAD") {
        await recreatePage();
        return;
      }

      if (!result || !result.fullDate) return;

      if (result.fullDate === lastProcessedDate) return;
      lastProcessedDate = result.fullDate;

      console.log("Novo resultado:", result);

      if (result.number === 0 && result.time) {
        const minute = Number(result.time.split(":")[1]);
        const sent = await send("Blaze", minute);

        if (sent) {
          markHealthy("evento processado");
        }
      } else {
        // Mesmo sem envio, scraping OK
        markHealthy("scraping OK");
      }

    } catch (err) {
      console.error("Erro no monitor:", err.message);
    }
  }, 3000);
}

async function send(from, minute) {
  console.log("Enviando branco:", minute, from);

  const url =
    "https://oirjpetwqekfpvrmdsyh.supabase.co/functions/v1/registrar-branco";

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        minuto: minute,
        plataforma: from
      }),
      timeout: 15000
    });

    if (!resposta.ok) {
      const text = await resposta.text();
      console.error("Erro HTTP:", resposta.status, text);
      return false;
    }

    const contentType = resposta.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await resposta.text();
      console.error("Resposta não-JSON:", text);
      return false;
    }

    const dados = await resposta.json();
    console.log("Resposta API:", dados);

    return true;

  } catch (erro) {
    console.error("Erro ao enviar:", erro.message);
    return false;
  }
}

main();