const fs = require("fs");
const path = require("path");
const ora = require("ora");
const spinner = ora("").start();

const checkConfig = () => {
  spinner.prefixText = "config-check:";
  spinner.text = "Checking config";
  spinner.color = "green";

  // Check if config folder exists
  if (!fs.existsSync("./src/configs")) {
    fs.mkdirSync("./src/configs");
  }

  // The required configs for the app
  const configs = [
    {
      path: path.resolve("./src/configs/osu.json"),
      data: {
        apiKey: "",
      },
    },
    {
      path: path.resolve("./src/configs/osutrack.json"),
      data: {
        link: "https://osutrack-api.ameo.dev",
      }
    }
  ];

  // Check if the configs exist
  configs.forEach((config) => {
    if (!fs.existsSync(config.path)) {
      spinner.info(
        `${path.basename(config.path)} doesn't exist, generating...`
      );
      generateConfig(config);
    }
    return;
  });

  spinner.succeed("Configs checked and passed");
};

const generateConfig = (config) => {
  spinner.text = "Generating config";
  spinner.color = "blue";

  try {
    spinner.text = "Writing config";
    fs.writeFileSync(config.path, JSON.stringify(config.data, null, 2), {
      flag: "wx",
    });
    const baseName = path.basename(config.path);

    // Generate the required fields to warn the user
    const requiredFields = Object.values(config.data).reduce(
      (prev, cur, index) => {
        if (!cur) {
          prev += ` ${Object.keys(config.data)[index]},`;
        }
        return prev;
      },
      ""
    );

    spinner.warn(
      `${baseName} created, manual fields required:${requiredFields.slice(
        0,
        -1
      )}`
    );
  } catch (error) {
    spinner.warn(
      "Failed to write config file, maybe other instances of the sever are running?"
    );
  }
};

checkConfig()
