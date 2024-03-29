import sqlite3 from 'sqlite3';
import path from 'path'
import fs from 'fs'
import ora from 'ora'
const spinner = ora("").start();

const createTables = async (db) => {
  spinner.text = "Generating databases";
  spinner.color = "blue";
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER, username TEXT, profileImage TEXT, lastUpdated INTEGER)",
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
    }
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS std (id INTEGER, peakRank INTEGER, peakAcc REAL)",
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
    }
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS taiko (id INTEGER, peakRank INTEGER, peakAcc REAL)",
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
    }
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS ctb (id INTEGER, peakRank INTEGER, peakAcc REAL)",
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
    }
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS mania (id INTEGER, peakRank INTEGER, peakAcc REAL)",
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
    }
  );
};

const checkDatabase = () => {
  spinner.prefixText = "database-check:";
  spinner.text = "Checking database";
  spinner.color = "green";
  const dbPath = path.resolve("./database/database.db");

  spinner.text = "Checking database dir";
  spinner.color = "green";
  if (!fs.existsSync(path.dirname(dbPath))) {
    spinner.info("Making database path");
    fs.mkdirSync(path.dirname(dbPath));
  }

  try {
    const db = new sqlite3.Database(dbPath);
    db.get("SELECT * FROM users", (err) => {
      if (err) {
        spinner.info("Database doesn't exist, generating...");
        createTables(db);
      }
    });
  } catch (error) {
    spinner.warn(
      "Potential invalid database setup, an error occured when attempting to fix"
    );
  }
  spinner.succeed("Checked databases and passed");
  return;
};

checkDatabase();
