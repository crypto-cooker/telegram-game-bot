import * as fs from "fs";
import { UserInfo } from "./utils";

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
  return bulletFired;
};

export const emptyCylinder = (chambers: boolean[]) => {
  for (let i = 0; i < 3; i++) {
    chambers[i] = false;
  }
};

export const passToNext = (turn: number, players: number) => {
  if (turn >= players) {
    turn = 1;
  } else if (turn < players) {
    turn++;
  }
  console.log("turn", turn);
  console.log("players", players);
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
  const prize = (cost * user * 0.9) / user;
  return prize;
};
