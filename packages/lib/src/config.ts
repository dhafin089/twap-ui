import { networks, zeroAddress } from "@defi.org/web3-candies";
import _ from "lodash";

const Config = {
  [networks.ftm.id]: {
    minimumTradeSizeUsd: 10,
    twapAddress: "0xBeDf3660c6524eFe533b4058E0c726535ac251a2",
    lensAddress: "0x715181517a576eA382E4351F10EAE693Cfe4471a",
    bidDelaySeconds: 60,
    minimumFillDelaySeconds: 60,
    wrappedTokenInfo: {
      symbol: "WFTM",
      address: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
      decimals: 18,
      logoUrl: "https://tokens.1inch.io/0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83.png",
    },

    spiritswap: {
      exchangeAddress: "0xAd19179201be5A51D1cBd3bB2fC651BB05822404",
    },
  },
};

export function getConfig(chainId: number, dapp: string) {
  const c = _.get(Config, [chainId]);
  return _.merge({}, c, _.get(c, [dapp]));
}

export enum IntegrationDapp {
  Spiritswap = "spiritswap",
  Quickswap = "quickswap",
}

export const nativeAddresses = [zeroAddress, "0x0000000000000000000000000000000000001010", "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"];

export const sendTxAndWait = async <T>(method: () => T) => {
  await method();
  return delay(10_000);
};

async function delay(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}