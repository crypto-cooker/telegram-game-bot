import { Wallet } from "ethers";

export interface CuponControlInfo {
  type: string;
  cupon_id?: string;
  eth?: string;
  slipge?: string;
}

export interface WalletInfo {
  wallet_address?: string;
  wallet_public?: string;
  wallet?: Wallet;
}

export interface StateInfo {
  state?: string;
  deleteMessageNumber: number | undefined;
}

export interface EstablishInfo {
  id: number;
  address?: string;
}

export interface FundInfo {
  id: number;
  cupon_name?: string;
  bonus?: string;
  address?: string;
  reward?: string;
  vest?: Date;
  token_type?: boolean;
}

export interface CuponIds {
  ids: Array<string>;
}

export interface UserInfo {
  userId: number;
  userName: string;
  privateKey: string;
  wallet: Wallet;
}

export interface PlayerInfo {
  userId: number;
  userName: string;
}
