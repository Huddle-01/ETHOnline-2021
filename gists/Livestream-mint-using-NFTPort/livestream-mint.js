const uplodmetadata = async () => {
    fetch("https://api.nftport.xyz/v0/metadata", {
      // Adding method type
      method: "POST",

      // Adding body or contents to send
      body: JSON.stringify({
        name: name,
        description: desc,
        file_uri: data,
      }),

      // Adding headers to the request
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: "82d8af12-45c8-40d0-aced-2eac36fe0a3c",
      },
    })
      .then((response) => response.json())

      // Displaying results to console
      .then((response) => {
        setmetaipfs(response.metadata_ipfs_uri);
        console.log(response);
      })

      .catch((err) => console.error(err));
  };

  const mintnft = async () => {
    fetch("https://api.nftport.xyz/v0/mints/customizable", {
      // Adding method type
      method: "POST",
      // Adding body or contents to send
      body: JSON.stringify({
        chain: "polygon",
        contract_address: "0xd1c3ae3aed7786394bdb5a42a81f0b0fb28f7983",
        metadata_uri: metaipfs,
        mint_to_address: address,
      }),

      // Adding headers to the request
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: "82d8af12-45c8-40d0-aced-2eac36fe0a3c",
      },
    })
      .then((response) => response.json())

      // Displaying results to console
      .then((response) => {
        console.log(response);
      })

      .catch((err) => console.error(err));
  };
