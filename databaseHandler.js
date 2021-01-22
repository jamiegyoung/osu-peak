const sqlite3 = require("sqlite3");
const { promisify } = require("util");

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) throw new Error("Could not connect to database!");
});

const dbGet = promisify(db.get).bind(db);
const dbRun = promisify(db.run).bind(db);

const getUserExists = (id, mode) => {
  if (mode === 0)
    return dbGet("SELECT id FROM std WHERE id = ?", [id]).then((user) =>
      user ? true : false
    );

  if (mode === 1)
    return dbGet("SELECT id FROM taiko WHERE id = ?", [id]).then((user) =>
      user ? true : false
    );

  if (mode === 2)
    return dbGet("SELECT id FROM ctb WHERE id = ?", [id]).then((user) =>
      user ? true : false
    );

  if (mode === 3)
    return dbGet("SELECT id FROM mania WHERE id = ?", [id]).then((user) =>
      user ? true : false
    );

  return dbGet("SELECT id FROM users WHERE id = ?", [id]).then((user) =>
    user ? true : false
  );
};

const getUserDetails = (id, mode) => {
  if (mode === 0)
    return dbGet("SELECT peakRank, peakAcc FROM std WHERE id = ?", [id]);

  if (mode === 1)
    return dbGet("SELECT peakRank, peakAcc FROM taiko WHERE id = ?", [id]);

  if (mode === 2)
    return dbGet("SELECT peakRank, peakAcc FROM ctb WHERE id = ?", [id]);

  if (mode === 3)
    return dbGet("SELECT peakRank, peakAcc FROM mania WHERE id = ?", [id]);

  return dbGet("SELECT * FROM users WHERE id = ?", [id]);
};

const setPeakRank = async (id, mode, peak) => {
  // God there must be a better way
  const userExists = await getUserExists(id, mode);
  if (mode === 0) {
    if (userExists) {
      return dbRun("UPDATE std SET peakRank = ? WHERE id = ?", [peak, id]);
    }
    return dbRun("INSERT INTO std (id, peakRank) VALUES (?, ?)", [id, peak]);
  }

  if (mode === 1) {
    if (userExists) {
      return dbRun("UPDATE taiko SET peakRank = ? WHERE id = ?", [peak, id]);
    }
    return dbRun("INSERT INTO taiko (id, peakRank) VALUES (?, ?)", [id, peak]);
  }

  if (mode === 2) {
    if (userExists) {
      return dbRun("UPDATE ctb SET peakRank = ? WHERE id = ?", [peak, id]);
    }
    return dbRun("INSERT INTO ctb (id, peakRank) VALUES (?, ?)", [id, peak]);
  }

  if (mode === 3) {
    if (userExists) {
      return dbRun("UPDATE mania SET peakRank = ? WHERE id = ?", [peak, id]);
    }
    return dbRun("INSERT INTO mania (id, peakRank) VALUES (?, ?)", [id, peak]);
  }
};

const setPeakAcc = async (id, mode, peak) => {
  const userExists = await getUserExists(id, mode);
  if (mode === 0) {
    if (userExists) {
      return dbRun("UPDATE std SET peakAcc = ? WHERE id = ?", [peak, id]);
    }
    return dbRun("INSERT INTO std (id, peakAcc) VALUES (?, ?)", [id, peak]);
  }

  if (mode === 1) {
    if (userExists) {
      return dbRun("UPDATE taiko SET peakAcc = ? WHERE id = ?", [peak, id]);
    }
    return dbRun("INSERT INTO taiko (id, peakAcc) VALUES (?, ?)", [id, peak]);
  }

  if (mode === 2) {
    if (userExists) {
      return dbRun("UPDATE ctb SET peakAcc = ? WHERE id = ?", [peak, id]);
    }
    return dbRun("INSERT INTO ctb (id, peakAcc) VALUES (?, ?)", [id, peak]);
  }

  if (mode === 3) {
    if (userExists) {
      return dbRun("UPDATE mania SET peakAcc = ? WHERE id = ?", [peak, id]);
    }
    return dbRun("INSERT INTO mania (id, peakAcc) VALUES (?, ?)", [id, peak]);
  }
};

const setPeaks = async (id, mode, peak) => {
  if (peak.rank) {
    await setPeakRank(id, mode, peak.rank);
  }

  if (peak.acc) {
    await setPeakAcc(id, mode, peak.acc);
  }
};

const getLastUpdated = (id) =>
  dbGet("SELECT lastUpdated FROM users WHERE id = ?", [id]).then((res) =>
    res ? res.lastUpdated : false
  );

const setLastUpdatedNow = async (id) => {
  if (await getUserExists(id))
    return dbRun("UPDATE users SET lastUpdated = ? WHERE id = ?", [
      new Date(),
      id,
    ]);
  dbRun("INSERT INTO users (id, lastUpdated) VALUES (?, ?)", [id, new Date()]);
};

const setUserDetails = async (id, username, profileImage) => {
  if (await getUserExists(id, undefined)) {
    return dbRun(
      "UPDATE users SET username = ?, profileImage = ? WHERE id = ?",
      [username, profileImage, id]
    );
  }
  dbRun("INSERT INTO users (id, username, profileImage) VALUES (?, ?, ?)", [
    id,
    username,
    profileImage,
  ]);
};

module.exports = {
  getUserDetails,
  setPeaks,
  getLastUpdated,
  setLastUpdatedNow,
  setUserDetails,
};
