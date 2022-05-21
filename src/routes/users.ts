import * as db from "../database";
import osu from "node-osu";
import https from "https";
import OsuPeakCanvas from "../osu-peak-canvas";
import { apiKey } from "../configs/osu.json";
import { ModeNumber, Theme } from "../types";
import OsuTrack from "../interfaces/OsuTrack";
import { Mode, User } from "../types";

const osuApi = new osu.Api(apiKey);

const getUserInfo = (id: string, mode: ModeNumber): Promise<osu.User> =>
  osuApi.getUser({ u: id, m: mode });

const loadProfileImageBuffer = (id: string): Promise<string> =>
  new Promise((resolve, reject) => {
    https
      .get(`https://a.ppy.sh/${id}`, (imgRes) => {
        imgRes.setEncoding("base64");
        if (imgRes.headers["content-type"]) {
          let body = "data:" + imgRes.headers["content-type"] + ";base64,";
          imgRes.on("data", (data) => (body += data));
          imgRes.on("end", async () => {
            resolve(body);
          });
          return;
        }
        reject("Picture not found");
      })
      .on("error", (e) => reject(e.message));
  });

const generateImageFromDB = async (
  id: string,
  mode: ModeNumber,
  imageTheme: Theme
): Promise<Buffer> => {
  const gameDetails: Mode = await db.getGameDetails(id, mode);
  const userDetails: User = await db.getUserDetails(id);

  const osuPeakCanvas = new OsuPeakCanvas(400, 100, {
    theme: imageTheme,
    mode,
    username: userDetails.username,
  });

  if (gameDetails) {
    osuPeakCanvas.peakRank = gameDetails.peakRank;
    osuPeakCanvas.peakAcc = gameDetails.peakAcc.toString();
  }
  if (userDetails.profileImage) {
    osuPeakCanvas.profilePicture = userDetails.profileImage;
  }
  return osuPeakCanvas.generateImage();
};

const getMode = (mode: String): ModeNumber => {
  if (mode === "1" || mode === "taiko") {
    return 1;
  }

  if (mode === "2" || mode === "ctb" || mode === "catch" || mode === "fruits") {
    return 2;
  }

  if (mode === "3" || mode === "mania") {
    return 3;
  }

  return 0;
};

const checkRecentlyUpdated = async (userId: string): Promise<Boolean> => {
  const dateNow: Date = new Date();
  const lastUpdated: Date = await db.getLastUpdatedDate(userId);
  const fiveMin = 5 * 1000;
  if (dateNow.valueOf() - lastUpdated.valueOf() < fiveMin) {
    return true;
  }
  return false;
};

const setPeaksFromOsuTrack = async (
  currentRank: any,
  formattedAccuracy: any,
  user: any,
  mode: ModeNumber
) => {
  const osuTrack = new OsuTrack();

  const peak = {
    rank: currentRank,
    acc: formattedAccuracy,
  };

  const osutrackRankAcc = await osuTrack.getPeakRankAcc(user.id, mode);

  if (osutrackRankAcc) {
    if (osutrackRankAcc.peakRank < currentRank) {
      peak.rank = osutrackRankAcc.peakRank;
    }

    if (osutrackRankAcc.peakAccValue > user.accuracy) {
      peak.acc = osutrackRankAcc.peakAcc;
    }
  }
  await db.setPeaks(user.id, mode, peak);
};

const setPeaksFromPreviousDetails = async (
  currentRank: any,
  prevDetails: Mode,
  user: any,
  formattedAccuracy: any,
  mode: ModeNumber
) => {
  const finalChanges: { rank?: number; acc?: string } = {};

  if (currentRank < prevDetails.peakRank) {
    finalChanges.rank = currentRank;
  }

  if (prevDetails.peakAcc) {
    if (
      user.accuracy > parseFloat(prevDetails.peakAcc.toString().slice(0, -1))
    ) {
      finalChanges.acc = formattedAccuracy;
    }
  }
  await db.setPeaks(user.id, mode, finalChanges);
};

const updateUserDetails = async (
  userId: string,
  mode: ModeNumber,
  res: any
): Promise<Boolean> => {
  const user: osu.User | Error = await getUserInfo(userId, mode).catch(
    (err) => err
  );

  if (user instanceof Error) {
    res.status(404).send("User not found");
    return false;
  }

  const currentRank = user.pp.rank ? user.pp.rank : undefined;
  let prevDetails = await db.getGameDetails(user.id.toString(), mode);

  const formattedAccuracy =
    user.accuracy === null ? undefined : user.accuracyFormatted;

  if (!prevDetails) {
    await setPeaksFromOsuTrack(currentRank, formattedAccuracy, user, mode);
    prevDetails = await db.getGameDetails(user.id.toString(), mode);
  }

  if (prevDetails) {
    await setPeaksFromPreviousDetails(
      currentRank,
      prevDetails,
      user,
      formattedAccuracy,
      mode
    );
  }

  // If no profile image is found, just set it as undefined so it defaults to the guest image
  const profileImage = await loadProfileImageBuffer(user.id.toString()).catch(
    () => undefined
  );

  await db.setUserDetails(user.id.toString(), user.name, profileImage);
  return true;
};

export const getById = async (req: any, res: any): Promise<void> => {
  const userId: string = req.params.userId;

  if (userId.match(/^\d+$/) === null) {
    res.status(400).send("Invalid user id");
    return;
  }

  const theme = req.query.theme === "light" ? Theme.light : Theme.dark;
  const mode = getMode(req.query.mode);

  // if the user quickly refreshes, just send it data using the database rather than constantly pinging the api
  if (await checkRecentlyUpdated(userId)) {
    if (await db.getGameDetails(userId, mode)) {
      sendImage(await generateImageFromDB(userId, mode, theme), res);
      return;
    }
  }

  if (!(await updateUserDetails(userId, mode, res))) return;

  await db.setLastUpdatedNow(userId);

  sendImage(await generateImageFromDB(userId, mode, theme), res);
  return;
};

const sendImage = (img: Buffer, res: any): void => {
  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });

  res.end(img);
};
