export type User = {
  id: string;
  username: string;
  profileImage?: string;
  lastUpdated: number;
};

export interface Mode {
  id: string;
  peakRank: number;
  peakAcc: number;
};

export type ModeNumber = 0 | 1 | 2 | 3;

export enum Theme {
  dark,
  light,
}
