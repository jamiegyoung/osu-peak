import * as db from "../database-handler";
import osu from "node-osu";
import https from "https";
import OsuPeakCanvas from "../osu-peak-canvas";
import { apiKey } from "../configs/osu.json";
import { Mode, Theme, UserDetails, GameDetails } from "../osu.types";
import OsuTrack from "../interfaces/OsuTrack";

const osuApi = new osu.Api(apiKey);

const getUserInfo = (id: number, mode: Mode): Promise<osu.User> =>
  osuApi.getUser({ u: id.toString(), m: mode });

const loadProfileImageBuffer = (id: number): Promise<string> =>
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
  id: number,
  mode: Mode,
  imageTheme: Theme
): Promise<Buffer> => {
  const gameDetails: GameDetails = await db.getGameDetails(id, mode);
  const userDetails: UserDetails = await db.getUserDetails(id);

  const osuPeakCanvas = new OsuPeakCanvas(400, 100, {
    theme: imageTheme,
    mode,
    username: userDetails.username,
  });

  if (gameDetails) {
    osuPeakCanvas.peakRank = gameDetails.peakRank;
    osuPeakCanvas.peakAcc = gameDetails.peakAcc;
  }

  osuPeakCanvas.profilePicture = userDetails.profileImage;
  return osuPeakCanvas.generateImage();
};

const getMode = (mode: String): Mode => {
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

const checkRecentlyUpdated = async (userId: number): Promise<Boolean> => {
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
  mode: Mode
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
  prevDetails: GameDetails,
  user: any,
  formattedAccuracy: any,
  mode: Mode
) => {
  const finalChanges: { rank?: number; acc?: string } = {};

  if (currentRank < prevDetails.peakRank) {
    finalChanges.rank = currentRank;
  }

  if (prevDetails.peakAcc) {
    if (user.accuracy > parseFloat(prevDetails.peakAcc.slice(0, -1))) {
      finalChanges.acc = formattedAccuracy;
    }
  }
  await db.setPeaks(user.id, mode, finalChanges);
};

const updateUserDetails = async (
  userId: number,
  mode: Mode,
  res: any
): Promise<Boolean> => {
  const user = await getUserInfo(userId, mode).catch((err) => err);

  if (user instanceof Error) {
    if (user.message === "Not found") {
      res.status(404).send("User not found D:");
      return false;
    }
    res.status(500).send("500 Internal Server Error D:");
    return false;
  }

  const currentRank = user.pp.rank ? user.pp.rank : undefined;
  const prevDetails = await db.getGameDetails(user.id, mode);

  const formattedAccuracy =
    user.accuracy === null ? undefined : user.accuracyFormatted;

  if (!prevDetails) {
    await setPeaksFromOsuTrack(currentRank, formattedAccuracy, user, mode);
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
  const profileImage = await loadProfileImageBuffer(user.id).catch(
    () => undefined
  );

  await db.setUserDetails(user.id, user.name, profileImage);
  return true;
};

export const getById = async (req: any, res: any): Promise<void> => {
  const userId: number = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
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
