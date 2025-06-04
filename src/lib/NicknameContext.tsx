// NicknameContext: Provides nickname state and update logic for the app.
// Fetches and saves nickname to Supabase, using wallet address (case-insensitive).
// Auto-generates a guest nickname if none exists for the user.
// Ensures nickname is always in sync with Supabase and wallet state.
// Used throughout the app for consistent user identification.
// Written for the "Three Good Things" DApp competition entry.
// Author: [Your Name] 2025

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useWallet } from "@vechain/dapp-kit-react";
import { NicknameContext } from "./NicknameContextDef";

export function NicknameProvider({ children }: { children: ReactNode }) {
  const { account } = useWallet();
  const [nickname, setNickname] = useState("");

  // nickname取得・自動生成
  const fetchNickname = async () => {
    if (!account) return;
    const user_id = account.toLowerCase();
    const { data } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("user_id", user_id)
      .single();
    if (data?.nickname) {
      setNickname(data.nickname);
    } else {
      const autoNick = `Guest_${user_id.slice(2, 8)}`;
      setNickname(autoNick);
      await supabase.from("profiles").upsert({ user_id, nickname: autoNick });
    }
  };

  // 新しいnicknameをSupabaseに保存
  const updateNickname = async (newNick: string) => {
    if (!account) return false;
    const user_id = account.toLowerCase();
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id, nickname: newNick });
    if (!error) {
      setNickname(newNick);
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchNickname();
    // eslint-disable-next-line
  }, [account]);

  return (
    <NicknameContext.Provider value={{ nickname, setNickname, refreshNickname: fetchNickname, updateNickname }}>
      {children}
    </NicknameContext.Provider>
  );
}

export { useNicknameContext } from "./useNicknameContext";
