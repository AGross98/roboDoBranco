const fetch = require("node-fetch");

const BASE_URL =
  "https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/history/1";

function buildUrl() {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

  return (
    BASE_URL +
    `?startDate=${start.toISOString()}` +
    `&endDate=${end.toISOString()}` +
    `&page=1`
  );
}

async function fetchLatest() {
  const response = await fetch(buildUrl(), {
    headers: {
      "accept": "application/json",
      "user-agent": "Mozilla/5.0"
    },
    timeout: 15000
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.records;
}

module.exports = { fetchLatest };