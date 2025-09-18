// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SocialPosts {
    struct Post {
        uint256 id;
        address author;
        string image;
        uint256 timestamp;
    }

    // postId => Post
    mapping(uint256 => Post) private posts;
    // author => list of their post IDs
    mapping(address => uint256[]) private userPosts;
    // all post IDs in order
    uint256[] private postIds;
    // auto-increment post counter
    uint256 private nextPostId;

    event PostCreated(uint256 indexed id, address indexed author, string image, uint256 timestamp);

    constructor() {
        nextPostId = 1; // start IDs from 1
    }

    // Create a new post
    function createPost(string calldata image) external {
        require(bytes(image).length > 0, "Image URL cannot be empty");

        uint256 postId = nextPostId++;
        Post memory newPost = Post({
            id: postId,
            author: msg.sender,
            image: image,
            timestamp: block.timestamp
        });

        posts[postId] = newPost;
        userPosts[msg.sender].push(postId);
        postIds.push(postId);

        emit PostCreated(postId, msg.sender, image, block.timestamp);
    }

    // Get a single post by ID
    function getPost(uint256 postId) external view returns (Post memory) {
        require(postId > 0 && postId < nextPostId, "Post does not exist");
        return posts[postId];
    }

    // Get all posts made by the caller
    function getMyPosts() external view returns (Post[] memory) {
        uint256[] memory ids = userPosts[msg.sender];
        Post[] memory myPosts = new Post[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            myPosts[i] = posts[ids[i]];
        }

        return myPosts;
    }

    // Get all posts ever made (⚠️ not gas efficient for huge feeds — better to use pagination)
    function getAllPosts() external view returns (Post[] memory) {
        uint256 n = postIds.length;
        Post[] memory all = new Post[](n);

        for (uint256 i = 0; i < n; i++) {
            all[i] = posts[postIds[i]];
        }

        return all;
    }

    // Get paginated feed (newest first)
    function getFeed(uint256 offset, uint256 count) external view returns (Post[] memory) {
        uint256 n = postIds.length;
        if (offset >= n) {
            return new Post[](0); // Correct way to return empty array
        }

        uint256 available = n - offset;
        if (count > available) {
            count = available;
        }

        Post[] memory feed = new Post[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 index = n - 1 - (offset + i);
            feed[i] = posts[postIds[index]];
        }

        return feed;
    }

    // Total number of posts (useful for frontend pagination)
    function totalPosts() external view returns (uint256) {
        return postIds.length;
    }
}