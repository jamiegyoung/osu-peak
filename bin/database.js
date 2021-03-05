const sqlite3 = require("sqlite3");
const path = require("path");
const fs = require("fs");
const ora = require("ora");
const spinner = ora("").start();

const createTables = async (db) => {
  spinner.text = "Generating databases";
  spinner.color = "blue";
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER,
      username TEXT,
      profileImage TEXT,
      lastUpdated INTEGER
      )`,
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
    }
  );

  spinner.text = "Creating std table in database";
  db.run(
    `CREATE TABLE IF NOT EXISTS std (
      id INTEGER,
      peakRank INTEGER,
      peakAcc REAL
      )`,
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
      spinner.info("Created std table");
    }
  );

  spinner.text = "Creating taiko table in database";
  db.run(
    `CREATE TABLE IF NOT EXISTS taiko (
      id INTEGER,
      peakRank INTEGER,
      peakAcc REAL
      )`,
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
      spinner.info("Created taiko table");
    }
  );

  spinner.text = "Creating ctb table in database";
  db.run(
    `CREATE TABLE IF NOT EXISTS ctb (
      id INTEGER,
      peakRank INTEGER,
      peakAcc REAL
      )`,
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
      spinner.info("Created ctb table");
    }
  );

  spinner.text = "Creating mania table in database";
  db.run(
    `CREATE TABLE IF NOT EXISTS mania (
      id INTEGER,
      peakRank INTEGER,
      peakAcc REAL
      )`,
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
      spinner.info("Created mania table");
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
