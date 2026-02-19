let lastHealthy = Date.now();

function mark(label = "") {
  lastHealthy = Date.now();
  console.log("[HEALTH]", label, new Date().toISOString());
}

function start() {
  setInterval(() => {
    if (Date.now() - lastHealthy > 3 * 60 * 1000) {
      console.error("Robô travado. Reiniciando...");
      process.exit(1);
    }
  }, 60000);
}

module.exports = { mark, start };