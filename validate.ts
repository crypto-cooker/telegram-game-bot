export const ValidateWalletPrivateKey = (address: string) => {
  return /^[a-fA-F0-9]{64}$/.test(address);
};

export const playerValidation = (userName: string, player: string[]) => {
  try {
    if (player.find((user) => user === userName)) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    // Handle file read or parse errors
    return undefined;
  }
};
