const express = require("express");
const app = express();
const osu = require("node-osu");
const escapeStringRegexp = require("escape-string-regexp");
const { createCanvas, loadImage, registerFont } = require("canvas");
const { apiKey } = require("./config.json");
const db = require("./databaseHandler");

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

app.get("/u/:user", async (req, res) => {
  const osuApi = new osu.Api(apiKey);
  const lightMode = req.query.theme === "light" ? true : false;
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
  };

  const backgroundColor = lightMode ? "#dedbdb" : "#242121";
  const textColor = lightMode ? "#000000" : "#ffffff";
  // Better safe than sorry!
  const user = await osuApi
    .getUser({ u: escapeStringRegexp(req.params.user), m: getMode() })
    .catch(() => false);

  if (!user) {
    res.status(400).send("Invalid user");
    return;
  }

  const safeUserID = user.id;

  const canvas = createCanvas(400, 100);
  const ctx = canvas.getContext("2d");
  registerFont("./Torus.otf", { family: "Torus" });

  // Generate background
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 10, true, false);
  ctx.clip();
  const bg = await loadImage(
    lightMode ? "./media/bg-light.png" : "./media/bg.png"
  );
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // Generate Name
  ctx.fillStyle = textColor;
  ctx.font = '400 31px "Torus"';
  ctx.fillText(user.name, 110, 35);

  // Generate peak rank
  const peakRank = await getPeakRank(user);

  const formattedRank = `#${peakRank
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  if (user.accuracy === null) {
    user.accuracyFormatted = "Bot";
  }

  ctx.fillStyle = textColor;
  ctx.font = '400 22px "Torus"';
  ctx.fillText("Peak Rank: " + formattedRank, 110, 65);
  ctx.fillText(`Peak Acc: ${user.accuracyFormatted}`, 110, 90);

  // Generate user picture
  const imageRes = await generateUserPicture(safeUserID, ctx, backgroundColor);
  if (!imageRes) {
    res.status(400).send("Invalid user");
    return;
  }

  const base64Data = canvas
    .toDataURL("image/png")
    .replace(/^data:image\/png;base64,/, "");

  const img = Buffer.from(base64Data, "base64");

  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });

  res.end(img);
});

app.listen(3000);

async function getPeakRank(user) {
  
  const currentRank = user.pp.rank ? user.pp.rank : -1;

  const peakRank = await db.getPeakRank(user.id);

  // Check if user exists
  if (peakRank === undefined) {
    db.setPeakRank(user.id, currentRank);
    return currentRank;
  };

  // Update peak rank if current is less
  if (currentRank < peakRank.peak) {
    db.setPeakRank(user.id, currentRank);
    return currentRank;
  }

  return peakRank.peak;
}

async function generateUserPicture(safeUserID, ctx, backgroundColor) {
  const profileImg = await loadProfileImage();
  ctx.strokeStyle = "#424242";
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 5, 5, 90, 90, 5, true, true);
  ctx.drawImage(profileImg, 10, 10, 80, 80);
  return true;

  function loadProfileImage() {
    return loadImage(`http://s.ppy.sh/a/${safeUserID}`).catch(() =>
      loadImage("./media/avatar-guest.png")
    );
  }
}
