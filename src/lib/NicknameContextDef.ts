import { createContext } from "react";

export interface NicknameContextType {
  nickname: string;
  setNickname: (n: string) => void;
  refreshNickname: () => Promise<void>;
  updateNickname: (newNick: string) => Promise<boolean>;
}

export const NicknameContext = createContext<NicknameContextType>({
  nickname: "",
  setNickname: () => {},
  refreshNickname: async () => {},
  updateNickname: async () => false,
});
