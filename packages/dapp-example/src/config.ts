import { pangolin, pangolinDaas } from "./Pangolin";
import spiritswap from "./SpiritSwap";
import spookyswap from "./SpookySwap";
import quickswap from "./QuickSwap";

export const defaultDapp = spiritswap;
export const dapps = [spiritswap, spookyswap, pangolin, pangolinDaas, quickswap];