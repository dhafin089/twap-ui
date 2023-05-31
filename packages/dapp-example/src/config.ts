import { pangolin, pangolinDaas } from "./Pangolin";
import spiritswap from "./SpiritSwap";
import spookyswap from "./SpookySwap";
import quickswap from "./QuickSwap";
import chronos from "./Chronos";
import thena from "./Thena";
import sushiswap from "./SushiSwap";
import stellaswap from "./StellaSwap";

export const defaultDapp = spiritswap;
export const dapps = [sushiswap, quickswap, spookyswap, spiritswap, chronos, thena, stellaswap, pangolin, pangolinDaas];
