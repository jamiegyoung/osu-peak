const sqlite3 = require("sqlite3");
const { promisify } = require("util");

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) throw new Error("Could not connect to database!");
});

const dbGet = promisify(db.get).bind(db);
const dbRun = promisify(db.run).bind(db);

const getPeakRank = (id) => dbGet("SELECT peak FROM users WHERE id = ?", [id]);

const setPeakRank = (id, peak) => {
  if (getPeakRank(id))
    dbRun("UPDATE users SET peak = ? WHERE id = ?", [peak, id]);
  dbRun("INSERT INTO users (id, peak) VALUES (?, ?)", [id, peak]);
};

module.exports = { getPeakRank, setPeakRank };
