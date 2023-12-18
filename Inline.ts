const botLink = "https://t.me/yama_post_tech_bot";

export const BuyCard = (
  cupon_id: number,
  cupon_name: string,
  bonus: string,
  address: string,
  reward: string,
  vest: Date
) =>
  `Cupon ID: ID# ${cupon_id}\nCupon Name: ${cupon_name}\nBonus Percentage: ${bonus}%\nContract Address: ${address}\nReward: ${reward}\nVest Time: ${vest}\n\n\n[Buy](${botLink}?start=buy_${cupon_id})`;

export const AskEstablish = () => [
  [
    { text: "No", callback_data: "no_establish" },
    { text: "Yes", callback_data: "establish_fund" },
  ],
];

export const FundInfoSetting = () => [
  [
    { text: "Cupon Name", callback_data: "cupon_name" },
    { text: "Bonus Percentage", callback_data: "bonus_amount" },
  ],
  [
    { text: "Contract Address", callback_data: "contract_address" },
    { text: "Starting Reward", callback_data: "starting_reward" },
  ],
  [
    { text: "Vesting Time", callback_data: "vesting_time" },
    { text: "ETH reward", callback_data: "eth_reward" },
  ],
  [{ text: "Fund", callback_data: "fund" }],
];

export const MainCard = () => `What would you like to do today?\n\n`;

export const MainLineKey = () => [
  [
    {
      text: "⚜ ---Rufferal sniper bot--- ⚜",
      callback_data: " ",
    },
  ],
  [
    {
      text: `🌈 Make a coupon`,
      url: "https://t.me/yama_post_tech_bot?start=mint",
    },
  ],
  [
    {
      text: "🌞 Affiliate    ",
      url: "https://t.me/yama_post_tech_bot?start=establish",
    },
  ],
  [{ text: "⭐ Fund          ", url: "https://t.me/yama_post_tech_bot?start=fund" }],
  [{ text: "🛒 Buy a coupon  ", url: "https://t.me/buy_test_channel" }],
  [
    {
      text: "🌏 Website      ",
      url: "https://rufferal.com",
    },
  ],
];

export const UpdateWallet = () => [
  [
    { text: "No", callback_data: "no_update" },
    { text: "Yes", callback_data: "wallet_update" },
  ],
];

export const BuyInfo = (cupon_id: string, eth: string, slipge: string) =>
  `Buy Info\n\nCupon ID: #${cupon_id}\nETH: ${eth}\nSlipge: ${slipge}`;
