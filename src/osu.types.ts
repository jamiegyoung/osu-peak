export type Mode = 0 | 1 | 2 | 3;

export enum Theme {
  dark,
  light,
}

export interface GameDetails {
  peakRank: number;
  peakAcc: string;
}

export interface UserDetails {
  id: number;
  username: string;
  profileImage?: Buffer;
  lastUpdated: number;
}
