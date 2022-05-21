import { ModeNumber } from "../types";
import { link } from "../configs/osutrack.json";
import fetch from "node-fetch";

export default class OsuTrack {
  /**
   * Get the peak rank and acc of the user
   * @param id the user id
   * @param mode the mode to get the details for
   */
  public async getPeakRankAcc(
    id: string,
    mode: ModeNumber
  ): Promise<
    { peakRank: number; peakAcc: string; peakAccValue: number } | undefined
  > {
    const res = await this.makeRequest("/peak", { user: id, mode });
    if (!res || res.length !== 1) return undefined;

    return {
      peakRank: res[0].best_global_rank,
      peakAcc:
        (
          Math.round((res[0].best_accuracy + Number.EPSILON) * 100) / 100
        ).toString() + "%",
      peakAccValue: res[0].best_accuracy,
    };
  }

  /**
   * makes a request to the osutrack api
   * @param url the url to use e.g "/track"
   * @param params the params to pass to the link
   */
  private async makeRequest(
    url: string,
    params: { [key: string]: any }
  ): Promise<any> {
    const paramString = Object.keys(params)
      .reduce((prev, curVal) => {
        return `${prev}${curVal}=${params[curVal]}&`;
      }, "?")
      .slice(0, -1);

    return await fetch(`${link}/${url}${paramString}`).then((res) => {
      if (res.status !== 200) {
        return;
      }
      return res.json();
    });
  }
}
