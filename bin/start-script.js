const ora = require("ora");
const spinner = ora("").start();
const { checkConfig } = require("./config");
const { checkDatabase } = require("./database");

const main = async () => {
  await checkConfig();
  await checkDatabase();
  spinner.prefixText = "";
  spinner.succeed("Everything checked! Starting server");
}

main();
