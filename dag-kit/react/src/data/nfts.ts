export interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  creator: string;
  collection: string;
  owned?: boolean;
}

import nft1 from "@/assets/nft-1.jpg";
import nft2 from "@/assets/nft-2.jpg";
import nft3 from "@/assets/nft-3.jpg";
import nft4 from "@/assets/nft-4.jpg";
import nft5 from "@/assets/nft-5.jpg";
import nft6 from "@/assets/nft-6.jpg";

export const nfts: NFT[] = [
  {
    id: "1",
    name: "Cosmic Nebula #001",
    description: "A mesmerizing cosmic nebula with ethereal glowing orbs",
    image:
      "https://i.pinimg.com/736x/38/ab/19/38ab19afd3da7dfeeb57563ce6922546.jpg",
    price: "0.05",
    creator: "CosmicArtist",
    collection: "Nebula Series",
    owned: false,
  },
  {
    id: "2",
    name: "CyberMech Alpha",
    description: "Cyberpunk robot head with neon circuits and glowing eyes",
    image:
      "https://i.pinimg.com/736x/29/e4/b2/29e4b2df61349db208f7e6c19f615e86.jpg",
    price: "0.1",
    creator: "NeonForge",
    collection: "CyberMech",
    owned: false,
  },
  {
    id: "3",
    name: "Crystal Genesis",
    description: "Iridescent crystal formation floating in the void",
    image:
      "https://i.pinimg.com/736x/f1/c8/6d/f1c86daacd7b1d15a936c2de67a21a81.jpg",
    price: "0.05",
    creator: "CrystalMind",
    collection: "Genesis",
    owned: false,
  },
  {
    id: "4",
    name: "Floating Eden",
    description: "Surreal floating island with bioluminescent trees",
    image:
      "https://i.pinimg.com/1200x/e3/75/b5/e375b5bc3d3e2df39d59b7fcad7793bd.jpg",
    price: "0.01",
    creator: "DreamWeaver",
    collection: "Eden",
    owned: false,
  },
  {
    id: "5",
    name: "Liquid Chrome",
    description: "Abstract liquid metal sculpture with chrome reflections",
    image:
      "https://i.pinimg.com/736x/29/e4/b2/29e4b2df61349db208f7e6c19f615e86.jpg",
    price: "1.45",
    creator: "MetalMorph",
    collection: "Chrome",
    owned: false,
  },
  {
    id: "6",
    name: "Star Dragon",
    description: "Mystical dragon made of starlight and constellations",
    image:
      "https://i.pinimg.com/736x/38/ab/19/38ab19afd3da7dfeeb57563ce6922546.jpg",
    price: "1.0",
    creator: "StarForge",
    collection: "Celestial",
    owned: false,
  },
];
