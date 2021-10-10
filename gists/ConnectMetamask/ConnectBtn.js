import React from "react";

//styles
import "./ConnectWalletBtn.css";

//web3
import { useMoralis } from "react-moralis";

const ConnectWalletBtn = () => {
  const { Moralis, authenticate, isAuthenticated, user } = useMoralis();

  return (
    <div className="connectWalletBtn">
      <div className="connectWalletBtn__title">
        {isAuthenticated
          ? "Wallet Connected"
          : "Connect wallet to sync your NFTs"}
      </div>

      <div className="connectWalletBtn__btn" onClick={authenticate}>
        Connect Wallet
      </div>
    </div>
  );
};

export default ConnectWalletBtn;
