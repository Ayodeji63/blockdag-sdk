import { defineChain } from "viem";

const awakening_ = defineChain({
  id: 1043,
  name: "Awakening Testnet",
  nativeCurrency: { decimals: 18, name: "Dag", symbol: "DAG" },
  rpcUrls: { default: { http: ["https://public-bdag.nownodes.io"] } },
  blockExplorers: {
    default: { name: "Explorer", url: "https://awakening.bdagscan.com/" },
  },
});

export const awakening = {
  bundler_rpc: "http://0.0.0.0:3000/",
  chain_config: awakening_,
};
