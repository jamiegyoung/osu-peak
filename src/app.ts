import express from "express";
const app = express();
import osu from "node-osu";
import https from "https";
import { createCanvas, loadImage, registerFont, Image } from "canvas";
import { apiKey } from "./configs/osu.json";
import * as db from "./database-handler";
import { Mode } from "./types";
const osuApi = new osu.Api(apiKey);

// TODO: refactor

// Thanks https://stackoverflow.com/a/3368118 !

function roundRect(
  ctx: any,
  x: number,
  y: number,
  width: number,
  height: number,
  radius:
    | number
    | {
        [side: number]: number;
        tl: number;
        tr: number;
        br: number;
        bl: number;
      },
  fill: boolean,
  stroke: boolean
) {
  if (typeof stroke === "undefined") {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    const defaultRadius: {
      [side: number]: number;
      tl: number;
      tr: number;
      br: number;
      bl: number;
    } = { tl: 0, tr: 0, br: 0, bl: 0 };
    for (const side in defaultRadius) {
      if (defaultRadius.hasOwnProperty(side)) {
        radius[side] = radius[side] || 0;
      }
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

const generateImageFromDB = async (id: number, mode: number, theme: any) => {
  const backgroundColor = theme === "light" ? "#dedbdb" : "#2A2226";
  const textColor = theme === "light" ? "#000000" : "#ffffff";

  const gameDetails = await db.getUserDetails(id, mode);
  const userDetails = await db.getUserDetails(id);

  const peakAcc = gameDetails.peakAcc;
  const peakRank = gameDetails.peakRank;
  const userName = userDetails.username;

  const canvas = createCanvas(400, 100);
  const ctx = canvas.getContext("2d");
  registerFont("./fonts/Torus.otf", { family: "Torus" });

  // Generate background
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 10, true, false);

  // Clip everything into the roundrect
  ctx.clip();

  // Get background image
  const bg = await loadImage(
    theme === "light" ? "./images/bg-light.png" : "./images/bg.png"
  );
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  const getSrc = () => {
    if (userDetails.profileImage) return userDetails.profileImage;
    return "./images/avatar-guest.png";
  };

  const drawGameModeIcon = async (path: string) => {
    const getPath = () => {
      if (theme === "light") {
        return path + "-dark.png";
      }
      return path + ".png";
    };
    const icon = await loadImage(getPath());
    ctx.drawImage(icon, 300, 12, 75, 75);
  };

  switch (mode) {
    case 0:
      await drawGameModeIcon("./images/std");
      break;
    case 1:
      await drawGameModeIcon("./images/taiko");
      break;
    case 2:
      await drawGameModeIcon("./images/ctb");
      break;
    case 3:
      await drawGameModeIcon("./images/mania");
      break;
    default:
      await drawGameModeIcon("./images/std");
      break;
  }

  ctx.strokeStyle = "#424242";
  roundRect(ctx, 5, 5, 90, 90, 5, true, true);

  // Generate profile image
  const profileImage = new Image();
  profileImage.onload = () => {
    ctx.drawImage(profileImage, 10, 10, 80, 80);
  };
  profileImage.onerror = (err: Error) => {
    throw err;
  };
  profileImage.src = getSrc();

  // Generate Name
  ctx.fillStyle = textColor;

  // Draw name and make sure it fits
  const drawName = () => {
    ctx.font = '400 31px "Torus"';
    if (userName.length > 12) {
      ctx.font = '400 23px "Torus"';
    }
    ctx.fillText(userName, 110, 35);
  };

  drawName();

  ctx.fillStyle = textColor;
  ctx.font = '400 22px "Torus"';

  const formattedRank = `#${(peakRank ? peakRank : -1)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  ctx.fillText("Peak Rank: " + formattedRank, 110, 65);
  ctx.fillText(`Peak Acc: ${peakAcc === null ? "Bot" : peakAcc}`, 110, 90);

  const base64Data = canvas
    .toDataURL("image/png")
    .replace(/^data:image\/png;base64,/, "");

  return Buffer.from(base64Data, "base64");
};

const getUserInfo = (userId: number, mode: Mode) =>
  osuApi.getUser({ u: userId.toString(), m: mode });

app.get("/u/:userId", async (req, res) => {
  // Test if the user id is a user id

  const userId: number = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    res.status(400).send("Invalid user id");
    return;
  }

  const getMode = () => {
    const mode = req.query.mode;
    if (
      mode === "0" ||
      mode === "std" ||
      mode === "standard" ||
      mode === "osu"
    ) {
      return 0;
    }

    if (mode === "1" || mode === "taiko") {
      return 1;
    }

    if (mode === "2" || mode === "ctb" || mode === "catch") {
      return 2;
    }

    if (mode === "3" || mode === "mania") {
      return 3;
    }

    return 0;
  };

  const lastUpdated = await db.getLastUpdated(userId);
  const fiveMin = 5 * 60 * 1000;
  const dateNow: any = new Date();
  const dateThen: any = new Date(lastUpdated);

  if (dateNow - dateThen < fiveMin) {
    if (await db.getUserDetails(userId, getMode())) {
      sendImage(
        await generateImageFromDB(userId, getMode(), req.query.theme),
        res
      );
      return;
    }
  }

  const user = await getUserInfo(userId, getMode()).catch((err) => err);

  if (user instanceof Error) {
    if (user.message === "Not found") {
      res.status(404).send("User not found D:");
      return;
    }
    res.status(500).send("500 Internal Server Error D:");
    return;
  }

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
    const finalChanges: { rank?: number; acc?: string } = {};

    if (currentRank < prevDetails.peakRank) {
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

  sendImage(await generateImageFromDB(userId, getMode(), req.query.theme), res);
  return;
});

const sendImage = (img: Buffer, res: any) => {
  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });

  res.end(img);
};

app.listen(7527);

const loadProfileImageBuffer = (id: number): Promise<string> =>
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
        // console.log("Got error when getting image: " + e.message);
        reject(e.message);
      });
  });
