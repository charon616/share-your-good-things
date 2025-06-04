// Memories page: 
// Shows user's and community gratitude posts, grouped by user and date. Like, tab, and refresh supported.
// All on-chain data is fetched from the GratitudeBoard smart contract.
// Grouping is by wallet address (user) and date (YYYY-MM-DD).
// Each group shows the nickname at the time of posting (immutable per post).
// Like button sends 1 GRT token and updates the like count on-chain.

import { useState, useEffect, useMemo, useCallback } from "react";
import { EmotionIconWithBackground } from "../components/emotion-icon";
import type { EmotionType } from "../components/emotion-data";

import { useWallet } from "@vechain/dapp-kit-react";
import { ThorClient } from "@vechain/sdk-network";
import { THOR_URL } from "../config/constants";
import { config, GRATITUDE_TOKEN_ABI, GRATITUDE_BOARD_ABI } from "../config/config";
import { ABIContract, Address, Clause } from "@vechain/sdk-core";

// Tabs component: Renders tab navigation for "Community" and "My Memories" sections.
function Tabs({ tabs, value, onChange, children }: { tabs: { value: string; label: string }[]; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="flex gap-1 w-full h-14 mb-3 border border-text-main rounded-2xl p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`flex-1 h-full flex items-center justify-center rounded-xl font-semibold text-base px-0 transition-colors ${
              value === tab.value
                ? "bg-primary"
                : "hover:bg-surface-dark"
            } cursor-pointer`}
            onClick={() => onChange(tab.value)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}

// On-chain GoodThing type (from contract ABI)
export type GoodThing = {
  user: string;
  timestamp: bigint;
  message: string;
  feeling: string;
  likes: bigint;
  nickname: string;
};

// MemoriesPage: Main component for displaying memories and community posts.
export default function MemoriesPage({ onRequireLogin }: { onRequireLogin?: () => void }) {
  const [tab, setTab] = useState("community");
  const [history, setHistory] = useState<GoodThing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { account, signer } = useWallet();
  const [likeLoading, setLikeLoading] = useState<number | null>(null);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [likeSuccess, setLikeSuccess] = useState<number | null>(null);
  const [grtBalance, setGrtBalance] = useState<string>("-");

  // GRT balance fetch function
  const fetchGrtBalance = useCallback(async () => {
    if (!account) {
      setGrtBalance("-");
      return;
    }
    try {
      const thorClient = ThorClient.at(THOR_URL);
      const tokenContract = thorClient.contracts.load(
        config.GRATITUDE_TOKEN_ADDRESS,
        GRATITUDE_TOKEN_ABI
      );
      const balance = await tokenContract.read.balanceOf(account);
      // Always extract the primitive value if balance is array-like (including readonly arrays)
      function isArrayLike(val: unknown): val is { 0: string | number | bigint } {
        return (
          typeof val === 'object' &&
          val !== null &&
          'length' in val &&
          typeof (val as { length: number }).length === 'number' &&
          (val as { length: number }).length > 0
        );
      }
      const value: string | number | bigint = isArrayLike(balance) ? balance[0] : balance as string | number | bigint;
      // GRT has 18 decimals, so show only the integer part
      const intValue = (typeof value === "bigint" ? value : BigInt(value)) / 10n ** 18n;
      setGrtBalance(intValue.toLocaleString());
    } catch {
      setGrtBalance("-");
    }
  }, [account]);

  // Fetch all on-chain posts from the GratitudeBoard contract
  const getHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const thorClient = ThorClient.at(THOR_URL);
      const contract = thorClient.contracts.load(
        config.GRATITUDE_BOARD_ADDRESS,
        GRATITUDE_BOARD_ABI
      );
      const entriesResponse = await contract.read.getAllEntries();
      let result: GoodThing[] = [];
      if (Array.isArray(entriesResponse) && Array.isArray(entriesResponse[0])) {
        result = Array.from(entriesResponse[0]) as GoodThing[];
      } else if (Array.isArray(entriesResponse)) {
        result = Array.from(entriesResponse) as GoodThing[];
      }
      setHistory(result);
    } catch (e: unknown) {
      if (typeof e === "object" && e && "message" in e) {
        setError((e as { message: string }).message);
      } else {
        setError("Failed to fetch on-chain data");
      }
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchGrtBalance();
  }, [fetchGrtBalance]);
  useEffect(() => {
    getHistory();
  }, []);

  useEffect(() => {
    fetchGrtBalance();
  }, [account, fetchGrtBalance]);

  // Memoized filtered data for user's own posts
  const myMemories = useMemo(() => {
    if (!account) return [];
    return history.filter((item: GoodThing) => item.user.toLowerCase() === account.toLowerCase());
  }, [history, account]);

  const communityPosts = useMemo(() => history, [history]);

  // Helper: convert timestamp to 'time ago' string
  function timeAgo(ts: bigint) {
    const now = Date.now();
    const date = Number(ts) * 1000;
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  }

  // Like button: anyone can like any post (sends 1 GRT)
  const handleLike = async (postIdx: number) => {
    if (!account || !signer) {
      setLikeError("Please connect your wallet.");
      return;
    }
    // GRT balance check: warn if less than 1 GRT
    const numericBalance = Number(grtBalance.replace(/,/g, ''));
    if (isNaN(numericBalance) || numericBalance < 1) {
      setLikeError("You need at least 1 GRT to like. Please get more tokens.");
      return;
    }
    setLikeLoading(postIdx);
    setLikeError(null);
    setLikeSuccess(null);
    try {
      // 1. Approve (GRT)
      const approveClause = Clause.callFunction(
        Address.of(config.GRATITUDE_TOKEN_ADDRESS),
        ABIContract.ofAbi(GRATITUDE_TOKEN_ABI).getFunction("approve"),
        [config.GRATITUDE_BOARD_ADDRESS, "1000000000000000000"]
      );
      // 2. likeGoodThing
      const likeClause = Clause.callFunction(
        Address.of(config.GRATITUDE_BOARD_ADDRESS),
        ABIContract.ofAbi(GRATITUDE_BOARD_ABI).getFunction("likeGoodThing"),
        [postIdx]
      );
      // 3. Send both clauses in one transaction
      const tx = () =>
        signer?.sendTransaction({
          clauses: [approveClause, likeClause],
          comment: "Like GoodThing and send 1 GRT",
        });
      await tx();
      setLikeSuccess(postIdx);
      await getHistory();
      await fetchGrtBalance(); // Update GRT balance after like
    } catch (e: unknown) {
      setLikeError((e as { message?: string })?.message || "Failed to like post");
    } finally {
      setLikeLoading(null);
    }
  };

  // Group posts by user and date (YYYY-MM-DD)
  function groupByUserAndDate(posts: GoodThing[]) {
    const groups: { [key: string]: GoodThing[] } = {};
    posts.forEach((post) => {
      const date = new Date(Number(post.timestamp) * 1000);
      const ymd = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
      const key = `${post.user.toLowerCase()}__${ymd}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(post);
    });
    // Sort groups so newest are first
    return Object.entries(groups)
      .map(([, posts]) => ({
        user: posts[0].user,
        nickname: posts[0].nickname,
        date: posts[0].timestamp,
        posts: posts.sort((a, b) => Number(b.timestamp) - Number(a.timestamp)), // Newest first in group
      }))
      .sort((a, b) => Number(b.date) - Number(a.date)); // Newest group first
  }

  // When switching tab, show login modal if not logged in
  const handleTabChange = (v: string) => {
    if ((v === "my-memories") && !account && onRequireLogin) {
      onRequireLogin();
      return;
    }
    setTab(v);
  };

  return (
      <div className="px-6">
        <div className="flex justify-between items-center mt-2 mb-2 gap-2">
          <span className="text-sm text-text-variant font-medium">Your GRT balance: <span className="font-bold text-text-main">{grtBalance}</span></span>
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-variant border hover:bg-surface-dark transition disabled:opacity-60 cursor-pointer border-none"
            disabled={isLoading}
            onClick={getHistory}
            aria-label="Update"
          >
            <img src="./repeat.svg" alt="Update Icon" className="h-6 w-6" />
          </button>
        </div>
        <Tabs
          tabs={[
            { value: "community", label: "Community" },
            { value: "my-memories", label: "My Memories" },
          ]}
          value={tab}
          onChange={handleTabChange}
        >
          {/* Error message for like action */}
          {likeError && (
            <div className="text-center text-red-600 font-semibold mb-2 text-sm">{likeError}</div>
          )}
          {/* List for My Memories */}
          {tab === "my-memories" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-text-variant font-medium">{account ? myMemories.length : 0} good things recorded</p>
              </div>
              {isLoading ? (
                <div className="text-center text-variant">Loading...</div>
              ) : error ? (
                <div className="text-center text-red-500">{error}</div>
              ) : myMemories.length === 0 ? (
                <div className="text-center text-variant">No memories yet.</div>
              ) : (
                <div className="space-y-2 mb-12">
                  {groupByUserAndDate(myMemories).map((group, groupIdx) => (
                    <div key={groupIdx} className="bg-surface-variant rounded-2xl p-3">
                      <div className="flex items-center justify-end mb-2">
                        <span className="flex items-center gap-1 text-xs text-text-variant font-medium">
                          <img src="./clock-01.svg" alt="clock" className="h-4 w-4" />
                          {timeAgo(group.posts[0].timestamp)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {group.posts.map((memory, idx) => (
                          <div key={idx} className="bg-white rounded-xl shadow-sm p-2 flex items-center gap-2">
                            <EmotionIconWithBackground
                              emotion={memory.feeling as EmotionType}
                              showLabel={false}
                              size={32}
                            />
                            <span className="flex-1 text-base leading-relaxed font-normal">{memory.message}</span>
                            <div className="flex items-center gap-1 font-medium text-text-variant">
                              <img src="./favourite.svg" alt="heart" className="h-4 w-4" />
                              <span className="text-sm">{Number(memory.likes)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* List for Community Posts */}
          {tab === "community" && (
            <div className="space-y-2 mb-12">
              {isLoading ? (
                <div className="text-center text-variant">Loading...</div>
              ) : error ? (
                <div className="text-center text-red-500">{error}</div>
              ) : communityPosts.length === 0 ? (
                <div className="text-center text-variant">No community posts yet.</div>
              ) : (
                <div className="space-y-4">
                  {groupByUserAndDate(communityPosts).map((group, groupIdx) => (
                    <div key={groupIdx} className="bg-surface-variant rounded-2xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-base">{group.nickname || group.user.slice(0,8) + "..."}</span>
                        <span className="flex items-center gap-1 text-xs text-text-variant font-medium">
                          <img src="./clock-01.svg" alt="clock" className="h-4 w-4" />
                          {timeAgo(group.posts[0].timestamp)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {group.posts.map((post, idx) => {
                          const globalIdx = history.findIndex(p =>
                            p.timestamp === post.timestamp &&
                            p.user === post.user &&
                            p.message === post.message
                          );
                          return (
                            <div key={idx} className="bg-white rounded-xl p-2 shadow-sm flex items-center gap-2">
                              <EmotionIconWithBackground emotion={post.feeling as EmotionType} showLabel={false} />
                              <span className="flex-1 text-base leading-relaxed">{post.message}</span>
                              <div className="flex items-center gap-1 text-text-variant font-medium">
                                <img src="./favourite.svg" alt="heart" className="h-4 w-4" />
                                <span className="text-sm">{Number(post.likes)}</span>
                                {account && post.user.toLowerCase() !== account.toLowerCase() && (
                                  <button
                                    className={`ml-2 px-2 py-1 rounded-lg bg-primary text-text-main text-xs font-bold hover:bg-primary-dark transition disabled:opacity-60 cursor-pointer`}
                                    disabled={likeLoading === globalIdx}
                                    onClick={() => handleLike(globalIdx)}
                                  >
                                    {likeLoading === globalIdx ? "Sending..." : likeSuccess === globalIdx ? "Liked!" : "Like & Send 1GRT"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Tabs>
      </div>
  );
}