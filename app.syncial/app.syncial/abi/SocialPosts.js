[
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
        { "indexed": true, "internalType": "address", "name": "author", "type": "address" },
        { "indexed": false, "internalType": "string", "name": "image", "type": "string" },
        { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
      ],
      "name": "PostCreated",
      "type": "event"
    },
    {
      "inputs": [{ "internalType": "string", "name": "image", "type": "string" }],
      "name": "createPost",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "postId", "type": "uint256" }],
      "name": "getPost",
      "outputs": [
        {
          "components": [
            { "internalType": "uint256", "name": "id", "type": "uint256" },
            { "internalType": "address", "name": "author", "type": "address" },
            { "internalType": "string", "name": "image", "type": "string" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
          ],
          "internalType": "struct SocialPosts.Post",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getMyPosts",
      "outputs": [
        {
          "components": [
            { "internalType": "uint256", "name": "id", "type": "uint256" },
            { "internalType": "address", "name": "author", "type": "address" },
            { "internalType": "string", "name": "image", "type": "string" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
          ],
          "internalType": "struct SocialPosts.Post[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllPosts",
      "outputs": [
        {
          "components": [
            { "internalType": "uint256", "name": "id", "type": "uint256" },
            { "internalType": "address", "name": "author", "type": "address" },
            { "internalType": "string", "name": "image", "type": "string" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
          ],
          "internalType": "struct SocialPosts.Post[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint256", "name": "offset", "type": "uint256" },
        { "internalType": "uint256", "name": "count", "type": "uint256" }
      ],
      "name": "getFeed",
      "outputs": [
        {
          "components": [
            { "internalType": "uint256", "name": "id", "type": "uint256" },
            { "internalType": "address", "name": "author", "type": "address" },
            { "internalType": "string", "name": "image", "type": "string" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
          ],
          "internalType": "struct SocialPosts.Post[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalPosts",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    }
  ]
  