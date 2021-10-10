import axios from "axios";
import Web3 from "web3";
import { loadNft } from "../redux/actions/nftActions";
import { store } from "../redux/store";

const key = process.env.REACT_APP_NFT_PORT_KEY;

const texts = [
  "pokemon",
  "rick and morty",
  "transformer",
  "marvel",
  "dc",
  "punk",
  "zombie",
  "elephant",
  "socks",
  "space",
  "lion",
  "eminem",
  "car",
  "flash",
  "cap",
];

const contractAddress = "0xD2ea3Bf2257DdEeF744C3e8F99DeDA8C7F478DB1";
const ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "getRandomNumber",
    outputs: [
      {
        internalType: "bytes32",
        name: "requestId",
        type: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "randomResult",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "requestId",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "randomness",
        type: "uint256",
      },
    ],
    name: "rawFulfillRandomness",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
const NODE_URL =
  "https://speedy-nodes-nyc.moralis.io/6e6071704e846c2cca62ed36/polygon/mumbai";
const provider = new Web3.providers.HttpProvider(NODE_URL);
const web3 = new Web3(provider);
const PUBLIC_KEY = "0x8860f775285Ab95cCE8dec10AaEe9DeDEF4aA756";
const PRIVATE_KEY =
  "0xbe85e29627141273f6e7ef70979d983a1fed8d8cf1feb7c9dc1013ea340a800d";
const randomContract = new web3.eth.Contract(ABI, contractAddress);
async function getnum() {
  //const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest"); // get latest nonce
  const gasEstimate = await randomContract.methods
    .getRandomNumber()
    .estimateGas(); // estimate gas
  // Create the transaction
  const tx = {
    from: PUBLIC_KEY,
    to: contractAddress,
    //nonce: nonce,
    gas: gasEstimate,
    data: randomContract.methods.getRandomNumber().encodeABI(),
  };
  const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
  signPromise
    .then((signedTx) => {
      web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
        function (err, hash) {
          if (!err) {
            console.log("The hash of your transaction is: ", hash);
          } else {
            console.log(
              "Something went wrong when submitting your transaction:",
              err
            );
          }
        }
      );
    })
    .catch((err) => {
      console.log("Promise failed:", err);
    });
}

function shuffle(array, randomIndex) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export const getNfts = async () => {
  try {
    await getnum();
    const num = await randomContract.methods.randomResult().call();
    console.log({ num });
    const nfts = await Promise.all(
      shuffle(texts, num)
        .filter((_, i) => i % num !== 0)
        .map(async (t) => {
          const params = new URLSearchParams({
            chain: "polygon",
            text: t,
            page_size: 1,
          }).toString();

          try {
            const { data } = await axios.get(
              "https://api.nftport.xyz/text_search?" + params,
              {
                headers: { Authorization: key },
              }
            );

            return data.search_results[0];
          } catch (e) {
            console.log(e.response);
          }
        })
    );

    // console.log({ d: data.search_results });
    console.log({ nfts });

    const n = nfts
      .filter(({ image_url }) => image_url)
      .filter((_, i) => i < 8)
      .map((nft) => ({
        image: nft.image_url,
        external_url: nft.contract_address,
        contract_address: nft.contract_address,
      }));

    store.dispatch(loadNft(n));
  } catch (err) {
    console.log(err.response);
  }
};
