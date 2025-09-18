// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UsernameMinting {
    mapping(string => address) public usernames;
    mapping(address => string) public walletToUsername;

    // Event to notify username minting
    event UsernameMinted(string indexed username, address indexed user);

    // Check if a username is available
    function isUsernameAvailable(string memory _username) public view returns (bool) {
        return usernames[_username] == address(0);
    }

    // Mint username if it's available
    function mintUsername(string memory _username) public {
        require(isUsernameAvailable(_username), "Username is already taken");
        require(bytes(walletToUsername[msg.sender]).length == 0, "Address already has a username");

        usernames[_username] = msg.sender;
        walletToUsername[msg.sender] = _username;

        emit UsernameMinted(_username, msg.sender);
    }

    // Fetch the username for a given wallet address
    function getUsernameFromWallet(address _wallet) public view returns (string memory) {
        return walletToUsername[_wallet];
    }

    // Fetch wallet address using Rainbow Resolver
    function checkUsernameFromRainbow(address _wallet) public view returns (string memory) {
        require(_wallet != address(0), "Invalid wallet address");
        string memory username = getUsernameFromWallet(_wallet);
        require(bytes(username).length > 0, "No username associated with this wallet");
        return username;
    }
}