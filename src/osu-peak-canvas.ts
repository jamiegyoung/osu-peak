import { createCanvas, loadImage, registerFont, Image } from "canvas";
import { Mode } from "./types";

export enum Theme {
  dark,
  light,
}

interface Options {
  [property: string]: any;
  mode: Mode;
  theme: Theme;
  peakRank?: string | number;
  peakAcc?: string;
  username?: string;
  profilePicture?: Buffer;
}

export default class OsuPeakCanvas {
  [property: string]: any;
  private canvas: any;
  private ctx: any;
  public theme: Theme;
  public mode: Mode;
  public peakRank?: string | number;
  public peakAcc?: string;
  public username?: string;
  public profilePicture?: Buffer;

  constructor(
    width: number,
    height: number,
    options: Options = { mode: 0, theme: Theme.dark }
  ) {
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext("2d");

    registerFont("./fonts/Torus.otf", { family: "Torus" });

    for (const option in Object.keys(options)) {
      if (this[option]) {
        this[option] = options[option];
      }
    }

    this.theme = options.theme;
    this.mode = options.mode;

    this.drawBackgroundImage();
  }

  private drawPeakRank() {
    this.ctx.fillStyle = this.textColor;
    this.ctx.font = '400 22px "Torus"';
    if (this.peakRank) {
      if (typeof this.peakRank === "number") {
        this.peakRank = this.peakRank
          ? `#${this.peakRank.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
          : "N/A";
      }

      this.ctx.fillText("Peak Rank: " + this.peakRank, 110, 65);
      return;
    }
    this.ctx.fillText("Peak Rank: N/A", 110, 65);
  }

  private drawPeakAcc() {
    this.ctx.fillStyle = this.textColor;
    this.ctx.font = '400 22px "Torus"';
    if (this.peakAcc) {
      this.ctx.fillText(`Peak Acc: ${this.peakAcc}`, 110, 90);
      return;
    }
    this.ctx.fillText(`Peak Acc: N/A`, 110, 90);
  }

  private drawName() {
    const drawName = () => {
      if (this.username) {
        this.ctx.fillStyle = this.textColor;
        this.ctx.font = '400 31px "Torus"';

        if (this.username.length > 12) {
          this.ctx.font = '400 23px "Torus"';
        }

        this.ctx.fillText(this.username, 110, 35);
      }
    };

    drawName();
  }

  private async drawProfilePicture() {
    // Draw border
    this.ctx.strokeStyle = "#424242";
    this.drawRoundRect(5, 5, 90, 90, 5, true, true);
    if (this.profilePicture) {
      const profileImage = new Image();
      profileImage.onload = () => {
        this.ctx.drawImage(profileImage, 10, 10, 80, 80);
      };
      profileImage.onerror = (err: Error) => {
        throw err;
      };
      profileImage.src = this.profilePicture;
    }
  }

  private async drawGameMode() {
    const drawGameModeIcon = async (path: string) => {
      const getPath = () => {
        if (this.theme === Theme.dark) {
          return path + ".png";
        }
        return path + "-dark.png";
      };
      const icon = await loadImage(getPath());
      this.ctx.drawImage(icon, 300, 12, 75, 75);
    };

    switch (this.mode) {
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
  }

  public get backgroundColor(): string {
    return this.theme === Theme.light ? "#dedbdb" : "#2A2226";
  }

  public get textColor(): string {
    return this.theme === Theme.light ? "#000000" : "#ffffff";
  }

  private async drawBackgroundImage() {
    this.ctx.fillStyle = this.backgroundColor;
    this.drawRoundRect(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      10,
      true,
      false
    );

    // Clip everything into the roundrect
    this.ctx.clip();

    // Get background image
    const bg = await loadImage(
      this.theme === Theme.light ? "./images/bg-light.png" : "./images/bg.png"
    );

    this.ctx.drawImage(bg, 0, 0, this.canvas.width, this.canvas.height);
  }

  // Thanks https://stackoverflow.com/a/3368118 !
  private drawRoundRect(
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
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius.tl, y);
    this.ctx.lineTo(x + width - radius.tr, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    this.ctx.lineTo(x + width, y + height - radius.br);
    this.ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius.br,
      y + height
    );
    this.ctx.lineTo(x + radius.bl, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    this.ctx.lineTo(x, y + radius.tl);
    this.ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    this.ctx.closePath();
    if (fill) {
      this.ctx.fill();
    }
    if (stroke) {
      this.ctx.stroke();
    }
  }

  public async generateImage() {
    await this.drawBackgroundImage();
    await this.drawGameMode();
    await this.drawProfilePicture();
    this.drawName();
    this.drawPeakRank();
    this.drawPeakAcc();

    const base64Data = this.canvas
      .toDataURL("image/png")
      .replace(/^data:image\/png;base64,/, "");

    return Buffer.from(base64Data, "base64");
  }
}
