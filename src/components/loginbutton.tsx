// LoginButton: 
// Handles login modal and wallet authentication.

import { useWallet, useWalletModal } from "@vechain/dapp-kit-react";
import { FaWallet } from "react-icons/fa";
import { shortenAddress } from "../utils";

export function LoginButton() {
  const { open } = useWalletModal();
  const { account } = useWallet();

  return (
    <button
      id="veworld-button"
      type="button"
      className="inline-flex items-center px-4 py-2 bg-text-main text-white rounded-xl hover:bg-gray-800 transition cursor-pointer"
      onClick={open}
    >
      <FaWallet className="mr-2" />
      {account ? shortenAddress(account) : "Connect VeWorld"}
    </button>
  );
}
