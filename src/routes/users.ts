import * as db from "../database-handler";
import osu from "node-osu";
import https from "https";
import { apiKey } from "../configs/osu.json";
import { Mode } from "../types";
import OsuPeakCanvas, { Theme } from "../osu-peak-canvas";
const osuApi = new osu.Api(apiKey);

export const getById = async (req: any, res: any) => {
  // Test if the user id is a user id

  const getUserInfo = (id: number, mode: Mode) =>
    osuApi.getUser({ u: id.toString(), m: mode });

  const loadProfileImageBuffer = (id: number): Promise<string> =>
    new Promise((resolve, reject) => {
      https
        .get(`https://a.ppy.sh/${id}`, (imgRes) => {
          imgRes.setEncoding("base64");
          let body = "data:" + imgRes.headers["content-type"] + ";base64,";
          imgRes.on("data", (data) => (body += data));
          imgRes.on("end", async () => {
            resolve(body);
          });
        })
        .on("error", (e) => {
          // console.log("Got error when getting image: " + e.message);
          reject(e.message);
        });
    });

  const generateImageFromDB = async (
    id: number,
    mode: Mode,
    imageTheme: Theme
  ) => {
    const gameDetails = await db.getUserDetails(id, mode);
    const userDetails = await db.getUserDetails(id);

    const osuPeakCanvas = new OsuPeakCanvas(400, 100);
    osuPeakCanvas.theme = imageTheme;
    osuPeakCanvas.mode = mode;
    osuPeakCanvas.profilePicture = userDetails.profileImage
      ? userDetails.profileImage
      : "./images/avatar-guest.png";

    osuPeakCanvas.peakRank = gameDetails.peakRank;
    osuPeakCanvas.peakAcc = gameDetails.peakAcc;
    osuPeakCanvas.username = userDetails.username;

    return await osuPeakCanvas.generateImage();
  };

  const userId: number = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    res.status(400).send("Invalid user id");
    return;
  }

  const getMode = (): Mode => {
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
  const theme = req.query.theme === "light" ? Theme.light : Theme.dark;

  if (dateNow - dateThen < fiveMin) {
    if (await db.getUserDetails(userId, getMode())) {
      sendImage(await generateImageFromDB(userId, getMode(), theme), res);
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

  const currentRank = user.pp.rank ? user.pp.rank : undefined;
  const prevDetails = await db.getUserDetails(user.id, getMode());

  const formattedAccuracy =
    user.accuracy === null ? undefined : user.accuracyFormatted;

  if (!prevDetails) {
    console.log("hi should appear");

    const mode = getMode();
    await db.setPeaks(user.id, mode, {
      rank: currentRank,
      acc: formattedAccuracy,
    });
  }

  if (prevDetails) {
    const finalChanges: { rank?: number; acc?: string } = {};

    if (currentRank < prevDetails.peakRank) {
      finalChanges.rank = currentRank;
    }

    if (user.accuracy > parseFloat(prevDetails.peakAcc.slice(0, -1))) {
      finalChanges.acc = formattedAccuracy;
    }
    const mode = getMode();
    await db.setPeaks(user.id, mode, finalChanges);
  }

  await db.setUserDetails(
    user.id,
    user.name,
    await loadProfileImageBuffer(user.id)
  );

  await db.setLastUpdatedNow(userId);

  sendImage(await generateImageFromDB(userId, getMode(), theme), res);
  return;
};

const sendImage = (img: Buffer, res: any) => {
  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });

  res.end(img);
};
