// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";

contract HBARPredictionMarketplace is ReentrancyGuard {

    struct Poll {
        string question;
        uint256 startTime;
        uint256 endTime;
        bytes32 assetPriceId;
        bytes32 hbarPriceId;
        int256 targetPrice;
        uint256 maxPriceDuringPoll;
        uint256 totalYes;
        uint256 totalNo;
        mapping(address => uint256) yesBets;
        mapping(address => uint256) noBets;
        address[] yesBettors;
        address[] noBettors;
        bool isResolved;
        address host;
    }

    IPyth public pyth;
    address public platform;
    uint256 public pollCount;

    uint256 constant HOST_FEE_BPS = 200;     // 2%
    uint256 constant PLATFORM_FEE_BPS = 100; // 1%
    uint256 constant MIN_VOLUME_BPS = 400;   // 4%
    uint256 constant MIN_BET_HBAR = 1e8;     // 1 HBAR in tinybars

    mapping(uint256 => Poll) public polls;

    // Events
    event PollCreated(uint256 pollId, string question, uint256 startTime, uint256 endTime);
    event BetPlaced(uint256 pollId, address bettor, bool option, uint256 amount);
    event MaxPriceUpdated(uint256 pollId, uint256 maxPrice);
    event PollResolved(uint256 pollId, bool outcome);

    constructor(address _pyth, address _platform) {
        pyth = IPyth(_pyth);
        platform = _platform;
    }

    modifier validPoll(uint256 _pollId) {
        require(_pollId < pollCount, "Invalid poll ID");
        _;
    }

    /// @notice Create a new prediction poll
    function createPoll(
        string memory _question,
        uint256 _duration,
        bytes32 _assetPriceId,
        bytes32 _hbarPriceId,
        int256 _targetPrice
    ) external {
        require(_duration > 0, "Duration too short");

        Poll storage p = polls[pollCount];
        p.question = _question;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + _duration;
        p.assetPriceId = _assetPriceId;
        p.hbarPriceId = _hbarPriceId;
        p.targetPrice = _targetPrice;
        p.maxPriceDuringPoll = 0;
        p.totalYes = 0;
        p.totalNo = 0;
        p.isResolved = false;
        p.host = msg.sender;

        emit PollCreated(pollCount, _question, p.startTime, p.endTime);
        pollCount++;
    }

    /// @notice Place a bet in HBAR on Yes/No
    function placeBet(uint256 _pollId, bool _option) external payable nonReentrant validPoll(_pollId) {
        Poll storage p = polls[_pollId];
        require(block.timestamp < p.endTime, "Poll ended");
        require(msg.value >= MIN_BET_HBAR, "Bet must be at least 1 HBAR");

        if (_option) {
            if (p.yesBets[msg.sender] == 0) p.yesBettors.push(msg.sender);
            p.yesBets[msg.sender] += msg.value;
            p.totalYes += msg.value;
        } else {
            if (p.noBets[msg.sender] == 0) p.noBettors.push(msg.sender);
            p.noBets[msg.sender] += msg.value;
            p.totalNo += msg.value;
        }

        emit BetPlaced(_pollId, msg.sender, _option, msg.value);
    }

    /// @notice Update the max price during poll
    function updateMaxPrice(uint256 _pollId) external validPoll(_pollId) {
        Poll storage p = polls[_pollId];
        require(block.timestamp >= p.startTime && block.timestamp < p.endTime, "Poll inactive");

        PythStructs.Price memory assetPriceStruct = pyth.getPriceUnsafe(p.assetPriceId);
        int256 price = assetPriceStruct.price;
        require(price > 0, "Invalid asset price");

        uint256 currentPrice = uint256(price);
        if (currentPrice > p.maxPriceDuringPoll) {
            p.maxPriceDuringPoll = currentPrice;
            emit MaxPriceUpdated(_pollId, currentPrice);
        }
    }

    /// @notice Resolve the poll
    function resolvePoll(uint256 _pollId) external nonReentrant validPoll(_pollId) {
        Poll storage p = polls[_pollId];
        require(block.timestamp >= p.endTime, "Poll not ended");
        require(!p.isResolved, "Already resolved");

        p.isResolved = true;

        uint256 totalPot = p.totalYes + p.totalNo;
        require(totalPot > 0, "No bets");

        bool outcome = p.maxPriceDuringPoll >= uint256(p.targetPrice);

        uint256 hostFee = (totalPot * HOST_FEE_BPS) / 10000;
        uint256 platformFee = (totalPot * PLATFORM_FEE_BPS) / 10000;
        uint256 remaining = totalPot - hostFee - platformFee;

        uint256 minVolume = (totalPot * MIN_VOLUME_BPS) / 10000;
        if (p.totalYes < minVolume || p.totalNo < minVolume) {
            remaining = 0;
        }

        address[] storage winners = outcome ? p.yesBettors : p.noBettors;
        uint256 totalWinningBets = outcome ? p.totalYes : p.totalNo;
        if (remaining > 0 && totalWinningBets > 0) {
            for (uint256 i = 0; i < winners.length; i++) {
                address winner = winners[i];
                uint256 betAmount = outcome ? p.yesBets[winner] : p.noBets[winner];
                uint256 share = (betAmount * remaining) / totalWinningBets;
                (bool sent, ) = winner.call{value: share}("");
                require(sent, "Failed payout");
            }
        }

        (bool sentPlatform, ) = platform.call{value: platformFee}("");
        require(sentPlatform, "Platform fee failed");

        (bool sentHost, ) = p.host.call{value: hostFee}("");
        require(sentHost, "Host fee failed");

        emit PollResolved(_pollId, outcome);
    }

    /// @notice Helper to get user bets
    function getUserBets(uint256 _pollId, address _user) external view returns (uint256 yes, uint256 no) {
        Poll storage p = polls[_pollId];
        yes = p.yesBets[_user];
        no = p.noBets[_user];
    }
}
