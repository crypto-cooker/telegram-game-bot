import * as fs from "fs";
import { UserInfo } from "./utils";
import { ethers } from "ethers";
import axios from "axios";

// const provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_goerli/");
const provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth");

const ETH_TO_WEI = 10 ** 18;
const botWallet = process.env.PRIVATE_KEY;

export const fetchAddress = (address: string) => {};

export function storeDataInJSONFile(person: UserInfo) {
  let rawData: string;
  let data: UserInfo[] = [];

  try {
    rawData = fs.readFileSync("data.json", "utf-8");
    data = JSON.parse(rawData);
  } catch (error) {
    // Handle the case where the file is empty or invalid
  }

  // Add the new person to the data
  data.push(person);

  // Write the updated data back to the file
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

// Function to fetch data from JSON file
export function fetchDataFromJSONFile(userId: number): UserInfo | undefined {
  try {
    const rawData = fs.readFileSync("data.json", "utf-8");
    const data: UserInfo[] = JSON.parse(rawData);
    return data.find((user) => user.userId === userId);
  } catch (error) {
    // Handle file read or parse errors
    return undefined;
  }
}

export function getUserDataFromId(userName: string): UserInfo | undefined {
  try {
    const rawData = fs.readFileSync("data.json", "utf-8");
    const data: UserInfo[] = JSON.parse(rawData);
    return data.find((user) => user.userName === userName);
  } catch (error) {
    // Handle file read or parse errors
    return undefined;
  }
}

export function getFirstPlayer(players: number) {
  return Math.floor(Math.random() * players) + 1;
}

// function getRandomValue(min: number, max: number): number {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

export const initialChamber = (chambers: boolean[]) => {
  const openPositions = chambers.flatMap((c, i) => (!c ? i : []));
  if (openPositions.length > 0) {
    const randomChamberIndex =
      openPositions[Math.floor(Math.random() * openPositions.length)];
    chambers[randomChamberIndex] = true;
    return true;
  }
  return false;
};

export const pullTrigger = (
  chambers: boolean[],
  currentChamberIndex: number
) => {
  const bulletFired = chambers[currentChamberIndex];
  chambers[currentChamberIndex] = false;

  if (currentChamberIndex === chambers.length - 1) {
    currentChamberIndex = 0;
  } else {
    currentChamberIndex++;
  }
  return { bulletFired, currentChamberIndex };
};

export const emptyCylinder = (chambers: boolean[]) => {
  for (let i = 0; i < 10; i++) {
    chambers[i] = false;
  }
};

export const passToNext = (turn: number, players: number) => {
  if (turn >= players) {
    turn = 1;
  } else if (turn < players) {
    turn++;
  }
  return turn;
};

export const spinCylinder = (chambers: boolean[]) => {
  const currentPoint = Math.floor(Math.random() * chambers.length);
  return currentPoint;
};

export const removeLoser = (userName: string, player: string[]) => {
  const index = player.indexOf(userName);
  if (index !== -1) {
    player.splice(index, 1);
  }
  return player;
};

export const getPrize = (cost: number, user: number) => {
  const prize = (cost * user * 0.85) / user;
  const toVault = cost * 0.07;
  const mine = cost * 0.01;
  return { prize, toVault, mine };
};

export const payForJoin = async (
  privateKey: string,
  address: string | undefined,
  amount: number
) => {
  try {
    const ethValue: number | null = await usdToEthereum(amount);
    if (ethValue !== null) {
      const value = numToWei(ethValue);
      const wallet = new ethers.Wallet(privateKey, provider);
      const transaction = await wallet.sendTransaction({
        to: address,
        value: value,
      });
      console.log("transaction", transaction);
      if (transaction.hash) {
        return true;
      } else {
        return false;
      }
    }
  } catch (error) {
    return false;
  }

};

export const payForWinner = async (winners: string[], prize: number) => {
  try {
    const ethValue: number | null = await usdToEthereum(prize);
    for (let i = 0; i < winners.length; i++) {
      const getWinner = getUserDataFromId(winners[i]);
      if (botWallet && ethValue !== null) {
        const wallet = new ethers.Wallet(botWallet, provider);
        const value = numToWei(ethValue);
        const transaction = await wallet.sendTransaction({
          to: getWinner?.wallet.address,
          value: value,
        });
      }
    }
  } catch (error) {
    console.log("error", error);
  }
};

export const payForMe = async (prize: number) => {
  try {
    const ethValue: number | null = await usdToEthereum(prize);
    if (botWallet && ethValue !== null) {
      const wallet = new ethers.Wallet(botWallet, provider);
      const value = numToWei(ethValue);
      const transaction = await wallet.sendTransaction({
        to: "0x140d27d37C0C682bA3A4b5dDf8C3d57988AE0B73",
        value: value,
      });
    }
  } catch (error) {
    console.log("error", error);
  }
};

export const payForD2R = async (prize: number) => {
  try {
    const ethValue: number | null = await usdToEthereum(prize);
    if (botWallet && ethValue !== null) {
      const wallet = new ethers.Wallet(botWallet, provider);
      const value = numToWei(ethValue);
      const transaction = await wallet.sendTransaction({
        to: "0x4AccDed53EE120CaA75ced42213C28e59F9DD536 ",
        value: value,
      });
    }
  } catch (error) {
    console.log("error", error);
  }
};

export const numToWei = (value: string | number): string => {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  const result = Math.floor(amount * ETH_TO_WEI);
  return result.toString();
};

export async function usdToEthereum(
  amountInUsd: number
): Promise<number | null> {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );

    // console.log("response", response);
    const ethereumPriceInUsd: number = response.data.ethereum.usd;
    const amountInEthereum: number = amountInUsd / ethereumPriceInUsd;
    return amountInEthereum;
  } catch (error) {
    // console.error("Error:", error);
    return null;
  }
}

export async function ethereumToUsd(
  amountInEthereum: number
): Promise<number | null> {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    const ethereumPriceInUsd: number = response.data.ethereum.usd;
    const amountInUsd: number = amountInEthereum * ethereumPriceInUsd;
    return amountInUsd;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}