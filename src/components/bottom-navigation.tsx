// BottomNavigation: 
// Persistent bottom navigation bar for the DApp.
// Handles navigation between main, memories, and profile pages.
// Triggers login modal if user tries to access restricted pages while not logged in.

import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@vechain/dapp-kit-react";
import community from '../assets/profile.svg';
import add from '../assets/ic_baseline-plus.svg';
import profile from '../assets/user.svg';

export default function BottomNavigation({ onRequireLogin }: { onRequireLogin?: () => void }) {
  const location = useLocation();
  const { account } = useWallet();

  type NavItem = {
    name: string;
    href: string;
    icon: string;
    isCenter?: boolean;
    requireLogin?: boolean;
  };

  const navItems: NavItem[] = [
    {
      name: "Memories",
      href: "/memories",
      icon: community,
    },
    {
      name: "Today",
      href: "/app",
      icon: add,
      isCenter: true,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: profile,
      requireLogin: true,
    },
  ];

  // Handle navigation and login requirement
  const handleNav = (item: NavItem, e: React.MouseEvent) => {
    if (item.requireLogin && !account && onRequireLogin) {
      console.log("Login required for this action");
      e.preventDefault();
      onRequireLogin();
    }
  };

  return (
    <div className="bottom-nav bg-surface border-t border-text-main">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          // Decide if the item is active
          const isActive = item.href === "/app"
            ? location.pathname === "/app"
            : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={e => handleNav(item, e)}
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors cursor-pointer"
            >
              <div className={`flex items-center justify-center p-2 mb-1 rounded-full hover:bg-surface-dark transition ${isActive ? "bg-surface-variant" : ""}`}>
                <img src={item.icon} className="h-7 w-7" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
