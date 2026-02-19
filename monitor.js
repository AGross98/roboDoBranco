let lastId = null;

function process(records) {
  if (!records || records.length === 0) return null;

  const latest = records[0];

  if (latest.id === lastId) {
    return null;
  }

  lastId = latest.id;

  return {
    id: latest.id,
    roll: latest.roll,
    color: latest.color,
    createdAt: latest.created_at
  };
}

module.exports = { process };