import { Biconomy } from "@biconomy/mexa";
import BigNumber from "bignumber.js";
import React, { useEffect, useState } from "react";
import { useMoralis } from "react-moralis";
import Web3 from "web3";
import {
  HuddleManagerABI,
  HuddleManagerAddress,
  LinkAddress,
  linkTokenABI,
} from "../../../data/constants";
import { BCNMY_API_KEY } from "../config";
// styles
import "./TipMenu.css";
import TipMenuIcons from "./TipMenuIcons";
import ConnectWalletScreen from "./TipScreens/ConnectWalletScreen";
import ResultScreen from "./TipScreens/ResultScreen/ResultScreen";
import SelectAmountScreen from "./TipScreens/SelectAmountScreen/SelectAmountScreen";
import SelectNFTScreen from "./TipScreens/SelectNFTScreen/SelectNFTScreen";

const TipMenu = ({ onClose }) => {
  const {
    web3,
    enableWeb3,
    isWeb3Enabled,
    // isWeb3EnableLoading,
    // web3EnableError,
    // Moralis,
  } = useMoralis();
  const oneEth = new BigNumber(1).shiftedBy(18);

  //TODO: fetch addresses from moralis
  const sendersAddress = "0xdCdc8565daf3c792789D756B903B7F26Ff3C99f7";
  const receiversAddress = "0x905040585A59C5B0E83Be2b247fC15a81FF4E533";

  //contracts
  const [linkContract, setLinkContract] = useState(null);
  const [managerContract, setManagerContract] = useState(null);

  //state
  const [isCoinDropOpen, setIsCoinDropOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState("connect-wallet");
  const [bcnmy, setBcnmy] = useState(null);
  const [isTxnApproved, setIsTxnApproved] = useState(null);
  const [isTxnSent, setIsTxnSent] = useState(null);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const [resultData, setResultData] = useState({
    Status: undefined,
    "Transaction ID": undefined,
    Address: undefined,
    type: undefined, //tokens | NFT | undefined
  });
  //possible values: connect-wallet | support-crypto | support-nft | result

  const TipMenuScreens = {
    "connect-wallet": <ConnectWalletScreen setActiveScreen={setActiveScreen} />,
    "support-crypto": (
      <SelectAmountScreen
        setActiveScreen={setActiveScreen}
        approveTransaction={approveTransaction}
        sendTransaction={sendTransaction}
        isButtonLoading={isButtonLoading}
        isTxnSent={isTxnSent}
      />
    ),
    "support-nft": <SelectNFTScreen setActiveScreen={setActiveScreen} />,
    result: (
      <ResultScreen
        setActiveScreen={setActiveScreen}
        resultData={resultData}
        onClose={onClose}
      />
    ),
  };

  useEffect(() => {
    enableWeb3();
  }, []);

  useEffect(() => {
    if (isWeb3Enabled) {
      console.log("web3 enabled");

      const biconomy = new Biconomy(web3.currentProvider, {
        apiKey: BCNMY_API_KEY,
        debug: false,
      });

      //line added , need to instantiate a Web3 object with biconomy properties
      const bweb3 = new Web3(biconomy);

      biconomy
        .onEvent(biconomy.READY, () => {
          setManagerContract(
            new bweb3.eth.Contract(HuddleManagerABI, HuddleManagerAddress)
          );

          setLinkContract(new bweb3.eth.Contract(linkTokenABI, LinkAddress));
        })
        .onEvent(biconomy.ERROR, (error, message) => {
          // Handle error while initializing mexa
          console.error(error, message);
          alert(error);
        });
      setBcnmy(biconomy);
    }
  }, [isWeb3Enabled, web3.currentProvider]);

  async function approveTransaction() {
    const txn = linkContract.methods
      .approve(HuddleManagerAddress, oneEth)
      .send({
        from: sendersAddress,
        signatureType: bcnmy.EIP712_SIGN,
        //optionally you can add other options like gasLimit
      });

    txn
      .on("transactionHash", function (hash) {
        console.log(`Transaction hash is ${hash}`);
        //showInfoMessage(`Transaction sent. Waiting for confirmation ..`);
      })
      .once("confirmation", function (confirmationNumber, receipt) {
        console.log(receipt);
        console.log(receipt.transactionHash);
        //do something with transaction hash
        setIsTxnApproved(true);
        setIsButtonLoading(false);
      })
      .on("error", (error) => {
        setIsTxnApproved(false);

        alert(error);
      });
  }

  async function sendTransaction() {
    console.log("sending txn");

    setIsButtonLoading(true);

    const tx = managerContract.methods
      .transfertip(receiversAddress, oneEth)
      .send({
        from: sendersAddress,
        signatureType: bcnmy.EIP712_SIGN,
        //optionally you can add other options like gasLimit
      });

    tx.on("transactionHash", function (hash) {
      console.log(`Transaction hash is ${hash}`);
      //showInfoMessage(`Transaction sent. Waiting for confirmation ..`);
    })
      .once("confirmation", function (confirmationNumber, receipt) {
        console.log({ receipt });
        setResultData({
          Status: receipt.status ? "Completed" : "Failed",
          "Transaction ID": receipt.transactionHash,
          Address: receipt.from,
          type: "tokens", //tokens | NFT | undefined
        });
        setIsTxnSent(true);
        setIsButtonLoading(false);
      })
      .on("error", (error) => {
        setIsTxnSent(false);
        alert(error);
      });
  }

  return (
    <div className="tipMenu" onClick={(e) => e.stopPropagation()}>
      <div className="tipMenu__header">
        <div className="tipMenu__title">
          {activeScreen !== "connect-wallet" && (
            <span
              className="tipMenu__back"
              onClick={() => setActiveScreen("connect-wallet")}
            >
              {TipMenuIcons.leftCaret}
            </span>
          )}
          Support John doe
        </div>
        <div className="tipMenu__amount">
          {TipMenuIcons.coins.hudl}

          <span className="tipMenu__coins">0</span>

          {activeScreen !== "connect-wallet" && (
            <div
              className={`tipMenu__coin__dropdown  ${
                isCoinDropOpen ? "tipMenu__coin__dropdown__active" : ""
              }`}
            >
              <div
                className="tipMenu__coin__dropdown__btn"
                onClick={() => setIsCoinDropOpen((prev) => !prev)}
              >
                {TipMenuIcons.downCaret}
              </div>

              {isCoinDropOpen && (
                <div className="tipMenu__coin__dropdown__menu">
                  {["bnb", "dai", "eth"].map((coin) => (
                    <div className="tipMenu__coin__dropdown__row">
                      {TipMenuIcons.coins[coin]}
                      {coin.toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {TipMenuScreens[activeScreen]}
    </div>
  );
};

export default TipMenu;
