const puppeteer = require("puppeteer");
const fetch = require("node-fetch");

let lastProcessedDate = null;
let monitoring = false;

async function main() {
  let browser;

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

    const page = await browser.newPage();

    await openTargetPage(page);
    startMonitor(page);

  } catch (err) {
    console.error("Erro ao iniciar o robô:", err);

    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
}

async function openTargetPage(page) {
  await page.goto(
    "https://www.tipminer.com/br/historico/blaze/double",
    { waitUntil: "networkidle2", timeout: 120000 }
  );

  await page.waitForSelector("button.cell", { timeout: 15000 });
}

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

async function getLatestResult(page) {
  return await page.evaluate(function () {
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
}

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