const express = require("express");
const app = express();
const osu = require("node-osu");
const https = require("https");
const escapeStringRegexp = require("escape-string-regexp");
const { createCanvas, loadImage, registerFont, Image } = require("canvas");
const { apiKey } = require("./config.json");
const db = require("./databaseHandler");
const { profile } = require("console");

const osuApi = new osu.Api(apiKey);

// Thanks https://stackoverflow.com/a/3368118 !
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === "undefined") {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius.br,
    y + height
  );
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}

const generateImageFromDB = async (id, mode, theme) => {
  const backgroundColor = theme === "light" ? "#dedbdb" : "#242121";
  const textColor = theme === "light" ? "#000000" : "#ffffff";

  const gameDetails = await db.getUserDetails(id, mode);
  const userDetails = await db.getUserDetails(id, undefined);
  const peakAcc = gameDetails.peakAcc;
  const peakRank = gameDetails.peakRank;
  const userName = userDetails.username;

  const canvas = createCanvas(400, 100);
  const ctx = canvas.getContext("2d");
  registerFont("./Torus.otf", { family: "Torus" });

  // Generate background
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 10, true, false);

  // Clip everything into the roundrect
  ctx.clip();

  // Get image
  const bg = await loadImage(theme === "light" ? "./media/bg-light.png" : "./media/bg.png");
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  const getSrc = () => {
    if (userDetails.profileImage) return userDetails.profileImage;
    return "./media/avatar-guest.png";
  };

  ctx.strokeStyle = "#424242";
  roundRect(ctx, 5, 5, 90, 90, 5, true, true);

  const profileImage = new Image();
  profileImage.onload = () => {
    ctx.drawImage(profileImage, 10, 10, 80, 80);
  };
  profileImage.onerror = (err) => {
    throw err;
  };
  profileImage.src = getSrc();

  // Generate Name
  ctx.fillStyle = textColor;
  ctx.font = '400 31px "Torus"';
  ctx.fillText(userName, 110, 35);

  ctx.fillStyle = textColor;
  ctx.font = '400 22px "Torus"';

  const formattedRank = `#${(peakRank ? peakRank : -1)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  if (peakAcc === null) {
    peakAcc = "Bot";
  }

  ctx.fillText("Peak Rank: " + formattedRank, 110, 65);
  ctx.fillText(`Peak Acc: ${peakAcc}`, 110, 90);

  const base64Data = canvas
    .toDataURL("image/png")
    .replace(/^data:image\/png;base64,/, "");

  return Buffer.from(base64Data, "base64");
};

const getUserInfo = async (userId, mode) => {
  const user = await osuApi
    .getUser({ u: escapeStringRegexp(userId), m: mode })
    .catch(() => false);

  if (!user) {
    res.status(400).send("Invalid user");
    return;
  }

  return user;
};

app.get("/u/:userId", async (req, res) => {
  // const mode = ["std", "taiko", "ctb", "mania"];

  // Test if the user id is a user id
  if (!/^\d+$/.test(req.params.userId)) {
    res.status(400).send("Invalid user id");
    return;
  }

  const getMode = () => {
    const mode = req.query.mode;
    if (mode === 0 || mode === "std" || mode === "standard" || mode === "osu") {
      return 0;
    }

    if (mode === "1" || mode === "taiko") {
      return 1;
    }

    if (mode === "2" || mode === "ctb") {
      return 2;
    }

    if (mode === "3" || mode === "mania") {
      return 3;
    }

    return 0;
  };

  const userId = req.params.userId;

  const lastUpdated = await db.getLastUpdated(userId);
  const fiveMin = 5  * 1000;
  const dateNow = new Date();

  if (dateNow - new Date(lastUpdated) < fiveMin) {
    const img = await generateImageFromDB(userId, getMode(), req.query.theme);
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": img.length,
    });

    res.end(img);
    return;
  }

  const user = await getUserInfo(userId, getMode());

  const currentRank = user.pp.rank ? user.pp.rank : -1;
  const prevDetails = await db.getUserDetails(user.id, getMode());

  if (user.accuracy === null) {
    user.accuracyFormatted = "Bot";
  }

  if (!prevDetails) {
    await db.setPeaks(user.id, getMode(), {
      rank: currentRank,
      acc: user.accuracyFormatted,
    });
  }

  if (prevDetails) {
    let finalChanges = {};
    if (currentRank > prevDetails.peakRank) {
      finalChanges.rank = currentRank;
    }

    if (user.accuracy > parseFloat(prevDetails.peakAcc.slice(0, -1))) {
      finalChanges.acc = user.accuracyFormatted;
    }

    await db.setPeaks(user.id, getMode(), finalChanges);
  }

  await db.setUserDetails(
    user.id,
    user.name,
    await loadProfileImageBuffer(user.id)
  );

  await db.setLastUpdatedNow(userId);

  const img = await generateImageFromDB(userId, getMode(), req.query.theme);

  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });

  res.end(img);
  return;
});

app.listen(3000);

const loadProfileImageBuffer = (id) =>
  new Promise((resolve, reject) => {
    https
      .get(`https://a.ppy.sh/${id}`, (res) => {
        res.setEncoding("base64");
        let body = "data:" + res.headers["content-type"] + ";base64,";
        res.on("data", (data) => (body += data));
        res.on("end", async () => {
          resolve(body);
        });
      })
      .on("error", (e) => {
        console.log("Got error when getting image: " + e.message);
        reject(e.message);
      });
  });
