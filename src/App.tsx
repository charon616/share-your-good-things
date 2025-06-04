import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppHeader } from "./components/header";
import BottomNavigation from "./components/bottom-navigation";
import LandingPage from "./pages/landing";
import MainPage from "./pages/index";
import MemoriesPage from "./pages/memories";
import ProfilePage from "./pages/profile";
import { NicknameProvider } from "./lib/NicknameContext";
import { useWallet } from "@vechain/dapp-kit-react";
import { useState, useEffect } from "react";
import { LoginButton } from "./components/loginbutton";

function AppLayout() {
  const { account } = useWallet();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const location = useLocation();

  // if modal is open and account is set, close the modal
  useEffect(() => {
    if (loginModalOpen && account) {
      setLoginModalOpen(false);
    }
  }, [account, loginModalOpen]);

  // Modal to prompt user to log in with Vechain wallet
  const LoginRequiredModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm bg-opacity-40">
        <div className="bg-surface rounded-2xl shadow-lg p-8 max-w-xs w-full flex flex-col items-center">
          <div className="mb-2 text-lg font-bold text-center">Vechain login required</div>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="38" fill="#F4DD6A" />
            <path d="M26 35 Q30 41 34 35" stroke="#7C4A1E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M46 35 Q50 41 54 35" stroke="#7C4A1E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M32 50 Q40 58 48 50" stroke="#7C4A1E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
          <div className="mb-4 mt-2 text-text-variant text-center text-sm">To use this feature, please log in with your Vechain wallet.</div>
          <LoginButton />
          <button className="mt-4 text-sm text-text-variant hover:underline" onClick={onClose}>Close</button>
        </div>
      </div>
    ) : null
  );

  // Only show BottomNavigation on /app, /memories, /profile
  const showBottomNav = ["/app", "/memories", "/profile"].includes(location.pathname);

  return (
    <div className="bg-surface text-text-main flex flex-col items-center justify-center font-sans">
      <AppHeader />
      <main className="flex-1 flex flex-col w-full min-h-screen">
        <div className="flex-1 pb-16">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<MainPage onRequireLogin={() => setLoginModalOpen(true)} />} />
            <Route path="/memories" element={<MemoriesPage onRequireLogin={() => setLoginModalOpen(true)} />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* Redirect any unknown route to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        {showBottomNav && (
          <BottomNavigation onRequireLogin={() => setLoginModalOpen(true)} />
        )}
      </main>
      <LoginRequiredModal open={!account && loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <NicknameProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </NicknameProvider>
  );
}
