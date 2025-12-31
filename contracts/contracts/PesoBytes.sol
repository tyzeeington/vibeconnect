// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PesoBytes
 * @dev ERC20 token for VibeConnect platform
 * Users earn PesoBytes by making authentic connections
 * Tokens can be used for premium features, tipping, or traded
 */
contract PesoBytes is ERC20, Ownable {
    
    // Reward amounts (in tokens, with 18 decimals)
    uint256 public constant CONNECTION_REWARD = 10 * 10**18;  // 10 tokens per connection
    uint256 public constant HIGH_QUALITY_CONNECTION_BONUS = 5 * 10**18;  // +5 for 90+ compatibility
    
    // Track total connections per user (for analytics)
    mapping(address => uint256) public userConnectionCount;
    
    // Track total rewards earned per user
    mapping(address => uint256) public totalRewardsEarned;
    
    event ConnectionReward(address indexed user, uint256 amount, uint256 compatibilityScore);
    event RewardThresholdChanged(uint256 newThreshold);
    
    constructor(uint256 initialSupply) ERC20("PesoBytes", "PESO") Ownable(msg.sender) {
        // Mint initial supply to contract owner for distribution
        _mint(msg.sender, initialSupply * 10**18);
    }
    
    /**
     * @dev Award tokens to users for making a connection
     * Called by backend when two users successfully connect
     */
    function awardConnectionReward(
        address userA,
        address userB,
        uint256 compatibilityScore
    ) public onlyOwner {
        require(userA != userB, "Cannot reward self-connection");
        require(compatibilityScore <= 100, "Invalid compatibility score");
        
        // Base reward for both users
        uint256 rewardAmount = CONNECTION_REWARD;
        
        // Bonus for high compatibility (90+)
        if (compatibilityScore >= 90) {
            rewardAmount += HIGH_QUALITY_CONNECTION_BONUS;
        }
        
        // Award to both users
        _transfer(owner(), userA, rewardAmount);
        _transfer(owner(), userB, rewardAmount);
        
        // Update stats
        userConnectionCount[userA]++;
        userConnectionCount[userB]++;
        totalRewardsEarned[userA] += rewardAmount;
        totalRewardsEarned[userB] += rewardAmount;
        
        emit ConnectionReward(userA, rewardAmount, compatibilityScore);
        emit ConnectionReward(userB, rewardAmount, compatibilityScore);
    }
    
    /**
     * @dev Batch award for multiple connections (gas optimization)
     */
    function batchAwardRewards(
        address[] memory users,
        uint256[] memory amounts
    ) public onlyOwner {
        require(users.length == amounts.length, "Array length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            _transfer(owner(), users[i], amounts[i]);
            totalRewardsEarned[users[i]] += amounts[i];
        }
    }
    
    /**
     * @dev Get user stats
     */
    function getUserStats(address user) 
        public 
        view 
        returns (
            uint256 connectionCount,
            uint256 totalRewards,
            uint256 currentBalance
        ) 
    {
        return (
            userConnectionCount[user],
            totalRewardsEarned[user],
            balanceOf(user)
        );
    }
    
    /**
     * @dev Burn tokens (for future features like premium upgrades)
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Allow owner to mint more tokens if needed (with max supply protection)
     */
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;  // 1 billion tokens
    
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
}
