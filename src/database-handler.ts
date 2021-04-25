import sqlite3 from "sqlite3";
import { promisify } from "util";
import { Mode, UserDetails, GameDetails } from "./osu.types";

const dbPath = process.env["DB_PATH"];
const modes = ["std", "taiko", "ctb", "mania"];

if (!dbPath) throw new Error("DB not given through path");

const db = new sqlite3.Database(dbPath, (err: any) => {
  if (err) throw new Error(`Could not connect to database at ${dbPath}!`);
});

const dbGet = promisify(db.get).bind(db) as (
  sql: string,
  params: any[]
) => Promise<any>;

const dbRun = promisify(db.run).bind(db) as (
  sql: string,
  params: any[]
) => Promise<any>;

export const getLastUpdatedDate = (id: number): Promise<Date> =>
  dbGet("SELECT lastUpdated FROM users WHERE id = ?", [id]).then(
    (res: { lastUpdated: number }) => new Date(res ? res.lastUpdated : 0)
  );

export const getGameDetails = async (
  id: number,
  mode: Mode
): Promise<GameDetails> => {
  if (!mode) {
    return dbGet("SELECT peakRank, peakAcc FROM std WHERE id = ?", [id]);
  }

  return dbGet(`SELECT peakRank, peakAcc FROM ${modes[mode]} WHERE id = ?`, [
    id,
  ]);
};

export const getUserDetails = async (id: number): Promise<UserDetails> =>
  dbGet("SELECT * FROM users WHERE id = ?", [id]);

const getUserExists = (id: number, mode?: Mode): Promise<boolean> => {
  if (mode === undefined) {
    return dbGet("SELECT id FROM users WHERE id = ?", [id]).then((user: any) =>
      user ? true : false
    );
  }

  return dbGet(`SELECT id FROM ${modes[mode]} WHERE id = ?`, [
    id,
  ]).then((user: any) => (user ? true : false));
};

export const setLastUpdatedNow = async (id: number): Promise<void> => {
  if (await getUserExists(id)) {
    dbRun("UPDATE users SET lastUpdated = ? WHERE id = ?", [new Date(), id]);
    return;
  }
  dbRun("INSERT INTO users (id, lastUpdated) VALUES (?, ?)", [id, new Date()]);
};

const setPeakAcc = async (
  id: number,
  mode: Mode,
  peak: string
): Promise<void> => {
  const userExists = await getUserExists(id, mode);

  if (userExists) {
    await dbRun(`UPDATE ${modes[mode]} SET peakAcc = ? WHERE id = ?`, [
      peak,
      id,
    ]);
    return;
  }
  await dbRun(`INSERT INTO ${modes[mode]} (id, peakAcc) VALUES (?, ?)`, [
    id,
    peak,
  ]);
};

const setPeakRank = async (
  id: number,
  mode: Mode,
  peak: number
): Promise<void> => {
  // God there must be a better way
  const userExists = await getUserExists(id, mode);
  if (mode === 0) {
    return userExists
      ? dbRun("UPDATE std SET peakRank = ? WHERE id = ?", [peak, id])
      : dbRun("INSERT INTO std (id, peakRank) VALUES (?, ?)", [id, peak]);
  }

  if (mode === 1) {
    return userExists
      ? dbRun("UPDATE taiko SET peakRank = ? WHERE id = ?", [peak, id])
      : dbRun("INSERT INTO taiko (id, peakRank) VALUES (?, ?)", [id, peak]);
  }

  if (mode === 2) {
    userExists
      ? dbRun("UPDATE ctb SET peakRank = ? WHERE id = ?", [peak, id])
      : dbRun("INSERT INTO ctb (id, peakRank) VALUES (?, ?)", [id, peak]);
  }

  if (mode === 3) {
    userExists
      ? dbRun("UPDATE mania SET peakRank = ? WHERE id = ?", [peak, id])
      : dbRun("INSERT INTO mania (id, peakRank) VALUES (?, ?)", [id, peak]);
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
  profileImage: string | undefined
): Promise<void> => {
  if (await getUserExists(id)) {
    dbRun("UPDATE users SET username = ?, profileImage = ? WHERE id = ?", [
      username,
      profileImage,
      id,
    ]);
    return;
  }
  dbRun("INSERT INTO users (id, username, profileImage) VALUES (?, ?, ?)", [
    id,
    username,
    profileImage,
  ]);
};
