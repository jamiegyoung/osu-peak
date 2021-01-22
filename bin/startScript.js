const fs = require("fs");
const path = require("path");
const ora = require("ora");
const sqlite3 = require("sqlite3");
const spinner = ora("").start();

const handleConfig = () => {
  spinner.text = "Checking config";
  const configPath = path.resolve("config.json");

  if (!fs.existsSync(configPath)) {
    spinner.text = "Generating config";
    spinner.color = "blue";

    const configData = JSON.stringify({
      apiKey: "",
    });

    try {
      spinner.text = "Writing config";
      fs.writeFileSync(configPath, configData, { flag: "wx" });
    } catch (error) {
      spinner.warn(
        "Failed to write config file, maybe other instances of the sever are running?"
      );
    }
  }
};

const createUsersTable = (db) => {
  spinner.text = "Creating users table in database";
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT,
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
      id TEXT,
      peakRank INTEGER,
      peakAcc REAL
      )`,
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
    }
  );

  spinner.text = "Creating taiko table in database";
  db.run(
    `CREATE TABLE IF NOT EXISTS taiko (
      id TEXT,
      peakRank INTEGER,
      peakAcc REAL
      )`,
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
    }
  );

  spinner.text = "Creating ctb table in database";
  db.run(
    `CREATE TABLE IF NOT EXISTS ctb (
      id TEXT,
      peakRank INTEGER,
      peakAcc REAL
      )`,
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
    }
  );

  spinner.text = "Creating mania table in database";
  db.run(
    `CREATE TABLE IF NOT EXISTS mania (
      id TEXT,
      peakRank INTEGER,
      peakAcc REAL
      )`,
    (_runRes, err) => {
      if (err) spinner.warn("An error occured when creating the user table");
    }
  );
};

const handleDatabase = () => {
  spinner.text = "Checking database";
  spinner.color = "green";

  const dbPath = path.resolve("./database.db");

  try {
    const db = new sqlite3.Database(dbPath);
    db.get("SELECT * FROM users", (err) => {
      if (err) {
        createUsersTable(db);
      }
    });
  } catch (error) {
    spinner.warn(
      "Potential invalid database setup, an error occured when attempting to fix"
    );
  }
};

spinner.prefixText = "start script:";

spinner.color = "green";
handleConfig();
handleDatabase();

spinner.prefixText = "";

spinner.succeed("Everything checked! Starting server");
