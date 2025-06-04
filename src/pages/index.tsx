// MainPage: 
// The main entry for posting "Three Good Things" each day.
// Handles input state, emotion selection, and posting to the smart contract.
// Shows login modal if user is not authenticated.

import { useEffect, useState } from "react";

import { useWallet } from "@vechain/dapp-kit-react";
import { ABIContract, Address, Clause, VET } from "@vechain/sdk-core";
import { GRATITUDE_BOARD_ABI, config } from "../config/config";

import { useNicknameContext } from "../lib/NicknameContext";

import EmotionIcon from "../components/emotion-icon";
import { emotionData, type EmotionType } from "../components/emotion-data";

interface GoodThing {
  text: string;
  emotion: EmotionType | "";
}

enum TransactionStatus {
  NotSent = "NOT_SENT",
  Pending = "PENDING",
  Success = "SUCCESS",
  Reverted = "REVERTED",
}

function ThreeGoodThings({ onRequireLogin, account, goodThings, setGoodThings }: {
  onRequireLogin?: () => void,
  account?: string,
  goodThings: GoodThing[],
  setGoodThings: React.Dispatch<React.SetStateAction<GoodThing[]>>
}) {
  const { nickname } = useNicknameContext();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<TransactionStatus>(TransactionStatus.NotSent);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [numPosted, setNumPosted] = useState<number>(0); // NEW: track how many good things were posted
  const { signer } = useWallet();

  const updateGoodThing = (index: number, field: keyof GoodThing, value: string) => {
    const updated = [...goodThings];
    updated[index] = { ...updated[index], [field]: value };
    setGoodThings(updated);
  };

  const handleSubmit = async () => {
    const filled = goodThings.filter((thing) => thing.text.trim() && thing.emotion);
    if (filled.length === 0) {
      setToastMsg("Please add at least one good thing. Share something positive from your day!");
      return;
    }
    if (!account) {
      if (onRequireLogin) {
        // Save draft to localStorage before showing login modal
        const draftData = JSON.stringify(goodThings);
        console.log('Saving to localStorage:', draftData);
        localStorage.setItem("threeGoodThingsDraft", draftData);
        onRequireLogin();
      }
      return;
    }
    if (!nickname.trim()) {
      setToastMsg("Please enter your nickname (username)");
      return;
    }
    setStatus(TransactionStatus.Pending);
    setIsLoading(true);
    setToastMsg(null);
    try {
      // Batch post: postMultipleGoodThings(string[], string[], string[])
      const messages = filled.map((g) => g.text);
      const feelings = filled.map((g) => g.emotion as string);
      const nicknames = filled.map(() => nickname.trim());
      const contractClause = Clause.callFunction(
        Address.of(config.GRATITUDE_BOARD_ADDRESS),
        // Use ABIContract to get the function selector
        ABIContract.ofAbi(GRATITUDE_BOARD_ABI).getFunction("postMultipleGoodThings"),
        [messages, feelings, nicknames],
        VET.of(0) // Use VET.of(0) for zero value
      );
      const result = await signer.sendTransaction({
        clauses: [
          {
            to: contractClause.to,
            value: contractClause.value.toString(),
            data: contractClause.data.toString(),
          },
        ],
        comment: `${account} posted good things!`,
      });
      setTxHash(result);
      setStatus(TransactionStatus.Success);
      setNumPosted(filled.length); // Store how many were posted
      setToastMsg(`You've shared ${filled.length} good thing${filled.length > 1 ? "s" : ""} with the community.`);
      setGoodThings([
        { text: "", emotion: "" },
        { text: "", emotion: "" },
        { text: "", emotion: "" },
      ]);
    } catch (error) {
      setStatus(TransactionStatus.Reverted);
      setToastMsg("Failed to post. Please try again.");
      console.error("Transaction failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Count how many good things have text and emotion filled, up to 3
  const filledCount = goodThings.filter((thing) => thing.text.trim() && thing.emotion).length;

  return (
      <div className="flex-1 px-4 flex flex-col items-center">
        <h1 className="text-xl font-bold text-center mb-4 mt-2">What three good things<br />happened today?</h1>
        <div className="w-full max-w-md mb-8 mx-auto space-y-8">
          {goodThings.map((thing, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-5xl font-bold w-8 text-center select-none">{index + 1}</span>
                <input
                  type="text"
                  placeholder={
                    index === 0
                      ? "I found a perfectly round potato."
                      : index === 1
                      ? "My socks finally matched."
                      : "I saw a cloud shaped like a dinosaur."
                  }
                  className={`flex-1 rounded-lg px-3 py-2 text-base border-0 focus:ring-0 placeholder:text-[#E2C9B0] transition-colors ${thing.text ? 'bg-surface' : 'bg-surface-variant'}`}
                  value={thing.text}
                  onChange={(e) => updateGoodThing(index, "text", e.target.value)}
                  style={{ fontWeight: 500 }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(emotionData).map(([key, data], colIdx) => {
                  const emotionKey = key as EmotionType;
                  const bg = thing.emotion === emotionKey
                    ? data.bgClassName
                    : thing.emotion
                      ? "bg-surface"
                      : "bg-surface-variant";
                  const hover = thing.emotion === emotionKey ? "" : "hover:bg-surface-dark";
                  return (
                    <button
                      key={emotionKey}
                      type="button"
                      className={`rounded-lg flex flex-col items-center py-2 transition-all border-0 shadow-none ${bg} ${hover} cursor-pointer`}
                      onClick={() => updateGoodThing(index, "emotion", emotionKey)}
                    >
                      <EmotionIcon
                        emotion={emotionKey}
                        size={32}
                        fill={thing.emotion === emotionKey}
                      />
                      <span className="text-base font-bold mt-1">{data.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="w-full max-w-md mx-auto mb-8">
          <button
            className={`w-full font-bold py-4 text-xl rounded-2xl shadow-sm border-0 transition-colors ${
              filledCount === 0
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark"
            } cursor-pointer`}
            onClick={handleSubmit}
            disabled={filledCount === 0 || isLoading}
          >
            {isLoading ? "Sending..." : "Send a smile:)"}
          </button>
          {(toastMsg || status === TransactionStatus.Pending || status === TransactionStatus.Success || status === TransactionStatus.Reverted) && (
            <div className="w-full max-w-md mx-auto mt-3 mb-2">
              <div className="text-center text-base font-medium rounded-lg px-2 py-1"
                style={{
                  color:
                    status === TransactionStatus.Success
                      ? '#16a34a' // green-600
                      : status === TransactionStatus.Reverted
                      ? '#dc2626' // red-600
                      : status === TransactionStatus.Pending
                      ? '#007AFF' // blue-600
                      : '#ef4444', // red-500 for toastMsg
                }}
              >
                {toastMsg && status !== TransactionStatus.Pending && status !== TransactionStatus.Success && status !== TransactionStatus.Reverted && (
                  <>{toastMsg}</>
                )}
                {status === TransactionStatus.Pending && (
                  <>Sending your good things to the blockchain... Please confirm the transaction in your wallet.</>
                )}
                {status === TransactionStatus.Success && txHash && (
                  <>
                    <div>Thank you for sharing! 🎉<br />Your good things are now on-chain.<br />
                      <span className="block mt-2 text-lg font-bold text-primary">
                        You got {numPosted} GRT token{numPosted > 1 ? 's' : ''}!
                      </span>
                    </div>
                  </>
                )}
                {status === TransactionStatus.Reverted && (
                  <>Your good things were not posted.<br />Please check your wallet and try again.</>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

export default function MainPage({ onRequireLogin }: { onRequireLogin?: () => void }) {
  const { account } = useWallet();
  // Manage goodThings state in MainPage
  const [goodThings, setGoodThings] = useState<GoodThing[]>([
    { text: "", emotion: "" },
    { text: "", emotion: "" },
    { text: "", emotion: "" },
  ]);

  // Restore localStorage draft as initial value
  useEffect(() => {
    const draft = localStorage.getItem("threeGoodThingsDraft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (Array.isArray(parsed) && parsed.length === 3) {
          setGoodThings(parsed);
        }
      } catch {}
      localStorage.removeItem("threeGoodThingsDraft");
    }
  }, []);

  return (
    <div className="flex flex-col items-center w-full px-4 mx-auto">
      <div className="w-full">
        <ThreeGoodThings
          onRequireLogin={onRequireLogin}
          account={account || undefined}
          goodThings={goodThings}
          setGoodThings={setGoodThings}
        />
      </div>
    </div>
  );
}
