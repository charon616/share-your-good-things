import { useContext } from "react";
import { NicknameContext } from "./NicknameContextDef";
import type { NicknameContextType } from "./NicknameContextDef";

export function useNicknameContext(): NicknameContextType {
  return useContext(NicknameContext);
}
