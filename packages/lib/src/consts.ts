import { erc20s, networks, zeroAddress } from "@defi.org/web3-candies";
export const twapConfig = {
  [networks.ftm.id]: {
    twapAddress: "0x25a0A78f5ad07b2474D3D42F1c1432178465936d",
    wrappedToken: erc20s.ftm.WFTM,
  },
};

export enum IntegrationDapp {
  Spiritswap = "spiritswap",
  Quickswap = "quickswap",
}
