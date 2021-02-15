import * as db from "../database-handler";
import osu from "node-osu";
import https from "https";
import OsuPeakCanvas from "../osu-peak-canvas";
import { apiKey } from "../configs/osu.json";
import { Mode, Theme, UserDetails, GameDetails } from "../osu.types";
import OsuTrack from "../interfaces/OsuTrack";

const osuApi = new osu.Api(apiKey);

export const getById = async (req: any, res: any): Promise<void> => {
  const userId: number = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    res.status(400).send("Invalid user id");
    return;
  }

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

  const lastUpdated: Date = await db.getLastUpdatedDate(userId);
  const fiveMin = 5 * 1000;
  const dateNow: Date = new Date();
  const theme = req.query.theme === "light" ? Theme.light : Theme.dark;

  if (dateNow.valueOf() - lastUpdated.valueOf() < fiveMin) {
    if (await db.getGameDetails(userId, getMode())) {
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
  const prevDetails = await db.getGameDetails(user.id, getMode());

  const formattedAccuracy =
    user.accuracy === null ? undefined : user.accuracyFormatted;

  if (!prevDetails) {
    const mode = getMode();

    const osuTrack = new OsuTrack();

    const peak = {
      rank: currentRank,
      acc: formattedAccuracy,
    };

    const osutrackRankAcc = await osuTrack.getPeakRankAcc(user.id, mode);
    console.log(osutrackRankAcc);

    if (osutrackRankAcc) {
      if (osutrackRankAcc.peakRank) {
        if (osutrackRankAcc.peakRank < currentRank) {
          peak.rank = osutrackRankAcc.peakRank;
        }
      }

      if (osutrackRankAcc.peakAcc) {
        if (osutrackRankAcc.peakAccValue > user.accuracyFormatted) {
          peak.acc = osutrackRankAcc.peakAcc;
        }
      }
    }

    await db.setPeaks(user.id, mode, peak);
  }

  if (prevDetails) {
    const finalChanges: { rank?: number; acc?: string } = {};

    if (currentRank < prevDetails.peakRank) {
      finalChanges.rank = currentRank;
    }

    if (prevDetails.peakAcc) {
      if (user.accuracy > parseFloat(prevDetails.peakAcc.slice(0, -1))) {
        finalChanges.acc = formattedAccuracy;
      }
    }

    const mode = getMode();
    await db.setPeaks(user.id, mode, finalChanges);
  }

  const profileImage = await loadProfileImageBuffer(user.id).catch(
    () => undefined
  );

  await db.setUserDetails(user.id, user.name, profileImage);

  await db.setLastUpdatedNow(userId);

  sendImage(await generateImageFromDB(userId, getMode(), theme), res);
  return;
};

const sendImage = (img: Buffer, res: any): void => {
  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });

  res.end(img);
};
