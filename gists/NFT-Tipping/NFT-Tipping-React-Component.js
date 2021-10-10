import React, { useEffect, useState } from "react";
import TipMenuIcons from "../../TipMenuIcons";

// styles
import "./SelectNFTScreen.css";

//web3
import { useMoralis, useWeb3Transfer } from "react-moralis";

//utils
import axios from "axios";

const SelectNFTScreen = ({ setActiveScreen, setResultData }) => {
  //state
  const [selectedNft, setSelectedNft] = useState(null);
  const [nftUrls, setNftUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nfts, setNfts] = useState([]);

  //web3
  const { Moralis, authenticate, isAuthenticated, user } = useMoralis();

  const options = {
    type: selectedNft?.contract_type.toLowerCase(),
    receiver: "0x905040585A59C5B0E83Be2b247fC15a81FF4E533",
    contract_address: selectedNft?.token_address,
    token_id: selectedNft?.token_id,
    amount: 1,
  };
  const {
    fetch: sendNft,
    error: sendNftError,
    isFetching,
  } = useWeb3Transfer(options);

  useEffect(() => {
    const getNFTs = async () => {
      try {
        setIsLoading(true);
        const { result: nfts } = await Moralis.Web3API.account.getNFTs({
          chain: "matic",
        });

        const nftsData = await Promise.all(
          nfts.map((nft) => axios.get(nft.token_uri))
        );

        const finalNfts = nftsData.map(
          ({ config: { url: _token_uri }, data: { image: nftImage } }) => {
            const currentNft = nfts.find(
              ({ token_uri }) => token_uri === _token_uri
            );

            const { token_address, token_id, contract_type } = currentNft;

            const test = nftImage.split("ipfs://");

            return {
              token_address,
              token_id,
              contract_type,
              image: test[1] ? `https://ipfs.io/ipfs/${test[1]}` : nftImage,
            };
          }
        );

        setNfts(finalNfts);

        console.log({ nfts, nftsData, finalNfts });

        setNftUrls(
          nftsData.map((nft) => {
            const test = nft.data.image.split("ipfs://");

            console.log({
              test,
            });

            return test[1] ? `https://ipfs.io/ipfs/${test[1]}` : nft.data.image;
          })
        );

        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };
    if (isAuthenticated) {
      getNFTs();
    }
  }, [Moralis.Web3API.account, isAuthenticated]);

  useEffect(() => {
    console.log({ selectedNft });
  }, [selectedNft]);

  useEffect(() => {
    console.log({ sendNftError });

    if (sendNftError) {
      const { message } = sendNftError;
      setResultData((prev) => ({
        ...prev,
        Status: "Error",
        msg: message,
        type: "NFT",
      }));
      setActiveScreen("result");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendNftError]);

  return (
    <div className="selectNFTScreen">
      {nftUrls[0] ? (
        <div className="selectNFTScreen__grid">
          {nfts.map((nft) => (
            <div
              key={nft.image}
              className={`selectNFTScreen__nft ${
                selectedNft === nft ? "selectNFTScreen__nft__active" : ""
              }`}
              onClick={() =>
                setSelectedNft((prev) => (prev === nft ? null : nft))
              }
            >
              <img src={nft.image} alt="" />
              <video src={nft.image} alt="" autoPlay loop />

              {selectedNft === nft && (
                <div className="selectNFTScreen__nft__tick">
                  {TipMenuIcons.tick}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="selectNFTScreen__notFound text-danger">
          No NFTs found
        </div>
      )}
      <div
        className={`tipMenu__btn tipMenu__connectBtn tipMenu__supportBtn ${
          !selectedNft ? "selectAmountScreen__btn__disabled" : ""
        }`}
        onClick={async () => {
          if (selectedNft) {
            console.log({ options });
            await sendNft();
            !sendNftError && !isFetching && setActiveScreen("result");
          }
        }}
      >
        {isFetching ? <>Loading...</> : "Send"}
      </div>
    </div>
  );
};

export default SelectNFTScreen;
