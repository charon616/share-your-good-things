// Header:
// Common header component for wallet login

import { LoginButton } from "./loginbutton";

export function AppHeader() {
  return (
    <header className="w-full p-4 text-right">
      <LoginButton />
    </header>
  );
}