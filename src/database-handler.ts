import sqlite3 from "sqlite3";
import { promisify } from "util";
import { Mode } from './types';

const db = new sqlite3.Database("./database.db", (err: any) => {
  if (err) throw new Error("Could not connect to database!");
});

const dbGet = promisify(db.get).bind(db) as (
  sql: string,
  params: any[]
) => Promise<any>;

const dbRun = promisify(db.run).bind(db) as (
  sql: string,
  params: any[]
) => Promise<any>;

export const getLastUpdated = (id: number) =>
  dbGet("SELECT lastUpdated FROM users WHERE id = ?", [id]).then((res: any) =>
    res ? res.lastUpdated : false
  );

export const getUserDetails = async (
  id: number,
  mode?: Mode
): Promise<any> => {
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

const getUserExists = (id: number, mode?: Mode) => {
  if (mode === 0)
    return dbGet("SELECT id FROM std WHERE id = ?", [id]).then((user: any) =>
      user ? true : false
    );

  if (mode === 1)
    return dbGet("SELECT id FROM taiko WHERE id = ?", [id]).then((user: any) =>
      user ? true : false
    );

  if (mode === 2)
    return dbGet("SELECT id FROM ctb WHERE id = ?", [id]).then((user: any) =>
      user ? true : false
    );

  if (mode === 3)
    return dbGet("SELECT id FROM mania WHERE id = ?", [id]).then((user: any) =>
      user ? true : false
    );

  return dbGet("SELECT id FROM users WHERE id = ?", [id]).then((user: any) =>
    user ? true : false
  );
};

export const setLastUpdatedNow = async (id: number) => {
  if (await getUserExists(id))
    return dbRun("UPDATE users SET lastUpdated = ? WHERE id = ?", [
      new Date(),
      id,
    ]);
  dbRun("INSERT INTO users (id, lastUpdated) VALUES (?, ?)", [id, new Date()]);
};

const setPeakAcc = async (id: number, mode: Mode, peak: string) => {
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

const setPeakRank = async (id: number, mode: Mode, peak: number) => {
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

export const setPeaks = async (
  id: number,
  mode: Mode,
  peak: { rank?: number; acc?: string }
) => {
  if (peak.rank) {
    await setPeakRank(id, mode, peak.rank);
  }

  if (peak.acc) {
    await setPeakAcc(id, mode, peak.acc);
  }
};

export const setUserDetails = async (
  id: number,
  username: string,
  profileImage: string
) => {
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
