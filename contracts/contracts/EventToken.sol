// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EventToken
 * @author VibeConnect Team
 * @notice Auto-Meme Coin: One token per event, supply = exact crowd size
 * @dev Deployed by EventTokenFactory for each event. Burnable after 24 hours.
 *
 * Features:
 * - Ticker format: $EVENTNAME (uppercase, spaces removed)
 * - One token per attendee
 * - Exact supply = exact crowd size
 * - Burn unclaimed after 24 hours for real scarcity
 *
 * Example:
 * - Event: "Vibe Party 2026" → Ticker: $VIBEPARTY2026
 * - 850 attendees → 850 total supply
 * - 100 unclaimed after 24h → burn 100, final supply = 750
 *
 * Access Control:
 * - Only factory (owner) can mint during event
 * - Only factory can burn unclaimed after 24h
 */
contract EventToken is ERC20, Ownable {
    /// @dev Event ID (e.g., "vibe-party-2026")
    string public eventId;

    /// @dev Timestamp when token was created
    uint256 public createdAt;

    /// @dev Timestamp when burn period starts (24h after creation)
    uint256 public burnDeadline;

    /// @dev Total tokens minted (includes burned)
    uint256 public totalMinted;

    /// @dev Total tokens burned
    uint256 public totalBurned;

    /// @dev Mapping from address to claimed status
    mapping(address => bool) public claimed;

    /// @dev Constant for 24 hours in seconds
    uint256 private constant BURN_PERIOD = 24 hours;

    /// @notice Emitted when tokens are minted to an attendee
    /// @param attendee Address receiving tokens
    /// @param amount Amount of tokens minted
    event TokensMinted(address indexed attendee, uint256 amount);

    /// @notice Emitted when unclaimed tokens are burned
    /// @param amount Number of tokens burned
    event UnclaimedBurned(uint256 amount);

    /**
     * @notice Constructor creates the event token with custom name/symbol
     * @dev Called by EventTokenFactory during deployment
     * @param name_ Token name (e.g., "Vibe Party 2026 Token")
     * @param symbol_ Token symbol (e.g., "VIBEPARTY2026")
     * @param eventId_ Event identifier
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory eventId_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        eventId = eventId_;
        createdAt = block.timestamp;
        burnDeadline = block.timestamp + BURN_PERIOD;
        totalMinted = 0;
        totalBurned = 0;
    }

    /**
     * @notice Mint tokens to an attendee (1 token per attendee)
     * @dev Only callable by factory (owner) during event
     * @param attendee Address to receive tokens
     * @param amount Number of tokens to mint (typically 1)
     *
     * Requirements:
     * - Caller must be owner (factory)
     * - Attendee must not have already claimed
     *
     * Emits: TokensMinted
     *
     * Side Effects:
     * - Mints tokens to attendee
     * - Marks attendee as claimed
     * - Increments totalMinted
     */
    function mint(address attendee, uint256 amount) external onlyOwner {
        require(!claimed[attendee], "Already claimed");

        _mint(attendee, amount * 10 ** decimals());
        claimed[attendee] = true;
        totalMinted += amount;

        emit TokensMinted(attendee, amount);
    }

    /**
     * @notice Burn unclaimed tokens after 24 hours
     * @dev Reduces supply to exact attendance count
     * @param holders Array of addresses that received tokens but didn't claim
     *
     * Requirements:
     * - Caller must be owner (factory)
     * - 24 hours must have passed since creation
     *
     * Emits: UnclaimedBurned
     *
     * Side Effects:
     * - Burns all unclaimed tokens
     * - Increments totalBurned
     * - Reduces total supply permanently
     */
    function burnUnclaimed(address[] calldata holders) external onlyOwner {
        require(block.timestamp >= burnDeadline, "Burn period not reached");

        uint256 burnedCount = 0;

        for (uint256 i = 0; i < holders.length; i++) {
            address holder = holders[i];

            if (!claimed[holder] && balanceOf(holder) > 0) {
                uint256 balance = balanceOf(holder);
                _burn(holder, balance);
                burnedCount += balance / 10 ** decimals();
            }
        }

        totalBurned += burnedCount;

        emit UnclaimedBurned(burnedCount);
    }

    /**
     * @notice Get real-time token statistics
     * @return currentSupply Current circulating supply
     * @return minted Total minted (including burned)
     * @return burned Total burned
     * @return scarcityRatio Percentage of tokens remaining (0-100)
     */
    function getStats()
        external
        view
        returns (uint256 currentSupply, uint256 minted, uint256 burned, uint256 scarcityRatio)
    {
        currentSupply = totalSupply() / 10 ** decimals();
        minted = totalMinted;
        burned = totalBurned;
        scarcityRatio = totalMinted > 0 ? ((totalMinted - totalBurned) * 100) / totalMinted : 0;
    }
}
