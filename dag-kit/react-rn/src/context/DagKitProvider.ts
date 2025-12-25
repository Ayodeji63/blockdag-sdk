import { createContext } from "react";
import { DagKitConfig } from "../types";

export interface DagKitContextValue {
  config: DagKitConfig;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}
export const DagKitContext = createContext<DagKitContextValue | null>(null);
