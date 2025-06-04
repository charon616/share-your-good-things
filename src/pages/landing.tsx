// LandingPage: 

import { useEffect } from "react";
import { useWallet } from "@vechain/dapp-kit-react";
import { useNavigate } from "react-router-dom";
import "../index.css";

export default function LandingPage() {
  const { account } = useWallet();
  const navigate = useNavigate();

  // If already connected, auto-redirect to /app
  useEffect(() => {
    if (account) {
      navigate("/app", { replace: true });
    }
  }, [account, navigate]);

  // Add a class to the body when on the landing page
  useEffect(() => {
    document.body.classList.add("landing-gradient-bg");
    const root = document.getElementById("root");
    if (root) root.classList.add("landing-root-fullwidth");
    return () => {
      document.body.classList.remove("landing-gradient-bg");
      if (root) root.classList.remove("landing-root-fullwidth");
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center w-full px-4 mb-8">
        <div className="w-full flex items-center justify-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-[32rem] min-w-96 max-w-full" />
        </div>
        <h2 className="text-4xl font-bold text-center mb-2 mt-4 bg-primary">A Simple Way to Feel Better, Every Day</h2>
        <p className="text-base text-center mb-4">
          <span className="font-semibold text-xl">A positive mental health DApp for everyone</span>
        </p>
        <div className="text-base mt-12 mb-6 w-full max-w-3xl">
          <h3 className="text-2xl font-semibold mb-3 mt-6 text-left bg-accent-yellow">Why?</h3>
          <p className="mb-4 text-lg text-left">
            Reflecting on <strong>three good things</strong> each day has been shown to help improve mental well-being – increasing happiness and reducing depressive symptoms. This app is based on the Three Good Things method, a positive psychology exercise introduced by researchers at the University of Pennsylvania (Seligman et al., 2005) and now trusted by psychologists worldwide.
          </p>
          <h3 className="text-2xl font-semibold mb-3 mt-6 text-left bg-accent-purple">What can you do?</h3>
          <ul className="mb-4 text-lg flex flex-col gap-2 list-none p-0 text-left">
            <li className="flex items-center gap-2">
              <img src="/pen-01.svg" alt="Smile icon" className="w-6 h-6 inline-block mr-1" />
              <span><strong>Record</strong> your daily positive moments in a personal journal.</span>
            </li>
            <li className="flex items-center gap-2">
              <img src="/calendar-love-02.svg" alt="Heart icon" className="w-6 h-6 inline-block mr-1" />
              <span><strong>Discover</strong> uplifting stories shared by others.</span>
            </li>
            <li className="flex items-center gap-2">
              <img src="/plant-04.svg" alt="Community icon" className="w-6 h-6 inline-block mr-1" />
              <span><strong>Connect</strong> with a supportive community to celebrate good things together.</span>
            </li>
          </ul>
          <h3 className="text-2xl font-semibold mb-3 mt-6 text-left bg-accent-green">How does it work?</h3>
          <div className="mb-2 text-sm text-left text-gray-500">
            <strong>Note:</strong> This DApp runs on the VeChain testnet. All blockchain features use testnet smart contracts and tokens.
          </div>
          <div className="flex flex-col gap-8 w-full max-w-3xl">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex-1 flex justify-center md:justify-end">
                <img src="/figure-1.png" alt="VeChain login" className="max-w-1/2 object-contain" />
              </div>
              <div className="flex-1 min-w-0 text-lg text-left flex items-center">
                <span><strong>Sign in with your VeChain wallet</strong> to get started. Your account is secure and private.</span>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-4 md:gap-8">
              <div className="flex-1 flex justify-center md:justify-end">
                <img src="/figure-2.png" alt="Record good things" className="max-w-1/2 object-contain" />
              </div>
              <div className="flex-1 min-w-0 text-lg text-left flex items-center">
                <span><strong>Record your "Three Good Things" each day.</strong> Earn <span className="font-bold">GRT</span> (Gratitude Token) for every post!</span>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex-1 flex justify-center md:justify-end">
                <img src="/figure-3.png" alt="Like with tokens" className="max-w-1/2 object-contain" />
              </div>
              <div className="flex-1 min-w-0 text-lg text-left flex items-center">
                <span><strong>Explore the community’s good things</strong> and use your tokens to send likes and encouragement.</span>
              </div>
            </div>
            {/* Step 4 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-4 md:gap-8">
              <div className="flex-1 flex justify-center md:justify-end">
                <img src="/figure-4.png" alt="Profile page" className="max-w-1/2 object-contain" />
              </div>
              <div className="flex-1 min-w-0 text-lg text-left flex items-center">
                <span><strong>View your personal record</strong> of good things on your profile page and celebrate your progress!</span>
              </div>
            </div>
          </div>
        </div>
        {/* Button for move to the App */}
        <button
          className="button-gradient fixed left-1/2 bottom-8 -translate-x-1/2 w-[90vw] max-w-md py-4 text-2xl font-bold rounded-2xl shadow-md border border-text-main hover:border-2 hover:shadow-2xl transition-all z-50 cursor-pointer"
          onClick={() => window.location.href = '/app'}
          style={{position: 'fixed'}}
        >
          Go to App
        </button>
      </div>
    </div>
  );
}
