// import sqlite3 from "sqlite3";
import Knex from "knex";
import { ModeNumber, User, Mode } from "./types.js";

const dbPath = process.env["DB_PATH"];
const modes = ["std", "taiko", "ctb", "mania"];

if (!dbPath) throw new Error("DB not given through path");

const knex = Knex({
  client: "sqlite3",
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
});

export const getLastUpdatedDate = (id: string): Promise<Date> =>
  knex<User>("users").where({ id }).first("lastUpdated");

export const getGameDetails = (id: string, mode: ModeNumber): Promise<Mode> => {
  if (!mode) {
    return knex<Mode>("std").where({ id }).first("peakRank", "peakAcc");
  }
  return knex<Mode>(modes[mode]).where({ id }).first("peakRank", "peakAcc");
};

export const getUserDetails = (id: string): Promise<User> =>
  knex<User>("users").where({ id }).first("*");

const getUserExists = (id: string, mode?: ModeNumber): Promise<boolean> => {
  if (mode === undefined) {
    return knex<User>("users")
      .where({ id })
      .first("*")
      .then((user: User) => (user ? true : false));
  }

  return knex<Mode>(modes[mode])
    .where({ id })
    .first("*")
    .then((user: Mode) => (user ? true : false));
};

export const setLastUpdatedNow = async (id: string): Promise<void> => {
  if (await getUserExists(id)) {
    await knex<User>("users")
      .where({ id })
      .update({ lastUpdated: Number(new Date()) });
    return;
  }
  await knex<User>("users").insert({ id, lastUpdated: Number(new Date()) });
};

const setPeak = async (
  id: string,
  mode: ModeNumber,
  peak: number | string,
  peakType: String
) => {
  const userExists = await getUserExists(id, mode);
  if (userExists) {
    await knex<Mode>(modes[mode])
      .where({ id })
      .update({ [`${peakType}`]: peak });
    return;
  }
  await knex<Mode>(modes[mode]).insert({ id, [`${peakType}`]: peak });
};

const setPeakAcc = (
  id: string,
  mode: ModeNumber,
  peak: string
): Promise<void> => setPeak(id, mode, peak, "peakAcc");

const setPeakRank = (
  id: string,
  mode: ModeNumber,
  peak: number
): Promise<void> => setPeak(id, mode, peak, "peakRank");

export const setPeaks = async (
  id: string,
  mode: ModeNumber,
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
  id: string,
  username: string,
  profileImage: string | undefined
): Promise<void> => {
  if (await getUserExists(id)) {
    await knex<User>("users").where({ id }).update({ username, profileImage });
    return;
  }
  await knex<User>("users").insert({ id, username, profileImage });
};
