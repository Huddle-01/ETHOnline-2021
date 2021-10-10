//code snippet to fetch a particular user's NFTs
const getNFTs = async () => {
  try {
    const { result: nfts } = await Moralis.Web3API.account.getNFTs();

    const nftsData = await Promise.all(
      nfts.map((nft) => axios.get(nft.token_uri))
    );

    setNftAvatars(
      nftsData.map((nft) => {
        const test = nft.data.image.match(/Qm[1-9A-Za-z]{44}/);

        console.log({
          cid: test[0],
        });

        return `https://ipfs.io/ipfs/${test[0]}`;
      })
    );

    setIsLoading(false);
  } catch (error) {
    console.log({ error });
    setIsLoading(false);
  }
};
