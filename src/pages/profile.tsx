// ProfilePage: 
// Displays the user's profile, nickname, stats, and GRT token balance.
// Allows editing nickname (saved to Supabase, case-insensitive by wallet address).
// Shows impact cards: total posts, streak, days active, likes received.
// GRT token balance is fetched from the smart contract and displayed as an integer.

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useWallet } from "@vechain/dapp-kit-react";
import { ThorClient } from "@vechain/sdk-network";
import { config, GRATITUDE_BOARD_ABI, GRATITUDE_TOKEN_ABI } from "@repo/config-contract";

import { useNicknameContext } from "../lib/useNicknameContext";

// Define the GoodThing type based on ABI
interface GoodThing {
  user: string;
  timestamp: bigint;
  message: string;
  feeling: string;
  likes: bigint;
  nickname: string;
}

export default function ProfilePage() {
  const { account } = useWallet();
  const { nickname, setNickname, updateNickname } = useNicknameContext();
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    streakDays: 0,
    joinedDays: 0,
    totalLikes: 0,
  });
  const [editValue, setEditValue] = useState(nickname);
  const [saving, setSaving] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<string>("-");
  const [errorMsg, setErrorMsg] = useState("");
  // Listen to likeSuccess in memories page via location state
  const location = useLocation();
  const likeSuccess = location.state?.likeSuccess;

  // Sync editValue with nickname when not editing
  useEffect(() => {
    if (!isEditing) setEditValue(nickname);
  }, [nickname, isEditing]);

  useEffect(() => {
    if (!account) return;
    const fetchStats = async () => {
      try {
        const thorClient = ThorClient.at(import.meta.env.VITE_THOR_URL || "https://testnet.vechain.org");
        const contract = thorClient.contracts.load(
          config.GRATITUDE_BOARD_ADDRESS,
          GRATITUDE_BOARD_ABI
        );
        const entriesResp = await contract.read.getAllEntries();
        // entriesResp[0] is the array of GoodThing
        const entries = Array.isArray(entriesResp[0]) ? (entriesResp[0] as GoodThing[]) : [];
        // Filter for this user's posts
        const myPosts = entries.filter((e) => e.user.toLowerCase() === account.toLowerCase());
        // Calculate streak and days active
        const timestamps: number[] = myPosts.map((e) => Number(e.timestamp) * 1000).sort((a: number, b: number) => a - b);
        let streak = 0;
        let maxStreak = 0;
        let prevDay: number | null = null;
        const daysActiveSet = new Set<string>();
        timestamps.forEach((ts: number) => {
          const day = new Date(ts).toISOString().slice(0, 10);
          daysActiveSet.add(day);
          if (prevDay !== null) {
            const diff = (ts - prevDay) / (1000 * 60 * 60 * 24);
            if (diff <= 1.5) {
              streak += 1;
            } else {
              streak = 1;
            }
            maxStreak = Math.max(maxStreak, streak);
          } else {
            streak = 1;
          }
          prevDay = ts;
        });
        // Sum up total likes received
        const totalLikes = myPosts.reduce((sum, post) => sum + Number(post.likes), 0);
        setStats({
          totalPosts: myPosts.length,
          streakDays: maxStreak,
          joinedDays: daysActiveSet.size,
          totalLikes,
        });
      } catch {
        // fallback to default
      }
    };
    fetchStats();
  }, [account, setNickname]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account) {
        setTokenBalance("-");
        return;
      }
      try {
        const thorClient = ThorClient.at(import.meta.env.VITE_THOR_URL || "https://testnet.vechain.org");
        const tokenContract = thorClient.contracts.load(
          config.GRATITUDE_TOKEN_ADDRESS,
          GRATITUDE_TOKEN_ABI
        );
        const balance = await tokenContract.read.balanceOf(account);
        let value = balance;
        if (Array.isArray(balance)) value = balance[0];
        // GRT has 18 decimals, so show only the integer part
        const intValue = (typeof value === "bigint" ? value : BigInt(value)) / 10n ** 18n;
        setTokenBalance(intValue.toLocaleString());
      } catch {
        setTokenBalance("-");
      }
    };
    fetchBalance();
  }, [account, likeSuccess]);

  return (
    <div className="min-h-screen flex flex-col mb-4 bg-surface">
      <div className="flex-1 px-6 flex flex-col items-center">
        <h1 className="text-xl font-bold text-center mb-4 mt-2">Profile</h1>
        {/* Profile Icon + Name */}
        <div className="relative flex flex-col items-center mb-6">
          <div className="h-32 w-32 rounded-full bg-accent-yellow flex items-center justify-center mb-4">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="38" fill="None" />
              <line x1="28" y1="35" x2="32" y2="35" stroke="#7C4A1E" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="48" y1="35" x2="52" y2="35" stroke="#7C4A1E" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M32 50 Q40 58 48 50" stroke="#7C4A1E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          {/* User name and edit button */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold text-center">{nickname}</span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-full bg-surface-variant hover:bg-surface-dark cursor-pointer"
              aria-label="Edit nickname"
            >
              <img src={'./pen-01.svg'} alt="pencil" className="h-4 w-4 text-[#7C4A1E]" />
            </button>
          </div>
        </div>
        {/* Editing mode */}
        {isEditing && (
          <div className="w-full max-w-xs space-y-4 mb-6">
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full text-center bg-surface-variant rounded-lg px-3 py-2 placeholder:text-[#E2C9B0]"
              disabled={saving}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  setSaving(true);
                  setErrorMsg("");
                  const ok = await updateNickname(editValue.trim());
                  setSaving(false);
                  if (ok) {
                    setIsEditing(false);
                  } else {
                    setErrorMsg("Failed to update nickname. Please try again.");
                  }
                }}
                className="flex-1 bg-primary hover:bg-primary-dark rounded-lg px-4 py-2 font-medium cursor-pointer"
                disabled={saving || !editValue.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 border border-text-main rounded-lg px-4 py-2 font-medium hover:bg-surface-dark cursor-pointer"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {/* Error Message */}
        {errorMsg && (
          <div className="text-center text-red-500 text-xs mt-2">{errorMsg}</div>
        )}
        {/* Impact Cards */}
        <div className="w-full max-w-md mx-auto grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl bg-accent-purple flex flex-col items-center py-4">
            <div className="flex items-center justify-center mb-2 p-4 bg-surface rounded-full">
              <img src={'./healtcare.svg'} alt="good things" className="h-10 w-10" />
            </div>
            <span className="text-4xl font-bold mb-1">{stats.totalPosts}</span>
            <span className="text-lg text-center font-extrabold leading-6">Good Things</span>
          </div>
          <div className="rounded-xl bg-accent-green flex flex-col items-center py-4">
            <div className="flex items-center justify-center mb-2 p-4 bg-surface rounded-full">
              <img src={'./fire-03.svg'} alt="streak" className="h-10 w-10" />
            </div>
            <span className="text-4xl font-bold mb-1">{stats.streakDays}</span>
            <span className="text-lg text-center font-extrabold leading-6">Day Streak</span>
          </div>
          <div className="rounded-xl bg-accent-green flex flex-col items-center py-4">
            <div className="flex items-center justify-center mb-2 p-4 bg-surface rounded-full">
              <img src={'./calendar-love-02.svg'} alt="days active" className="h-10 w-10" />
            </div>
            <span className="text-4xl font-bold mb-1">{stats.joinedDays}</span>
            <span className="text-lg text-center font-extrabold leading-6">Days Active</span>
          </div>
          <div className="rounded-xl bg-accent-purple flex flex-col items-center py-4">
            <div className="flex items-center justify-center mb-2 p-4 bg-surface rounded-full">
              <img src={'./mail-love-02.svg'} alt="likes received" className="h-10 w-10" />
            </div>
            <span className="text-4xl font-bold mb-1">{stats.totalLikes}</span>
            <span className="text-lg text-center font-extrabold leading-6">Likes Received</span>
          </div>
        </div>
        {/* GRT Token Balance */}
        <div className="text-center mt-2 mb-4 flex flex-col items-center">
          <div className="flex gap-2 place-items-center">
            <img src={'./coins-02.svg'} alt="calendar" className="h-6 w-6" />
            <span className="text-4xl font-bold text-text-main">{tokenBalance}</span>
          </div>
          <span className="text-xl font-bold ml-2">Gratitude Token</span>
        </div>
      </div>
    </div>
  );
}
