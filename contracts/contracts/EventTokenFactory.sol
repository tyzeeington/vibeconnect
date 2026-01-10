// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EventToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EventTokenFactory
 * @author VibeConnect Team
 * @notice Auto-Meme Coin Factory: Deploys one ERC20 token per event
 * @dev Factory pattern for creating event-specific tokens with automatic scarcity
 *
 * Features:
 * - One token per event (ticker: $EVENTNAME)
 * - Automated deployment on event creation
 * - Supply tracking and burning after 24 hours
 * - Real scarcity: final supply = exact attendance
 *
 * Token Naming Convention:
 * - Event: "Vibe Party 2026" → $VIBEPARTY2026
 * - Event: "ETH Denver" → $ETHDENVER
 * - Event: "NFT NYC 2026" → $NFTNYC2026
 *
 * Access Control:
 * - Only owner (backend) can create tokens
 * - Only owner can trigger burns
 *
 * Side Effects:
 * - Deploying tokens costs gas
 * - Each token is an independent contract
 */
contract EventTokenFactory is Ownable {
    /// @dev Mapping from event ID to deployed token address
    mapping(string => address) public eventTokens;

    /// @dev Array of all deployed token addresses (for enumeration)
    address[] public allTokens;

    /// @dev Mapping to track if event already has a token
    mapping(string => bool) public hasToken;

    /// @notice Emitted when a new event token is created
    /// @param eventId Event identifier
    /// @param tokenAddress Address of the deployed token contract
    /// @param name Token name
    /// @param symbol Token symbol
    event TokenCreated(string indexed eventId, address indexed tokenAddress, string name, string symbol);

    /// @notice Emitted when tokens are minted for an event
    /// @param eventId Event identifier
    /// @param attendee Address receiving tokens
    /// @param amount Number of tokens minted
    event TokensMinted(string indexed eventId, address indexed attendee, uint256 amount);

    /// @notice Emitted when unclaimed tokens are burned
    /// @param eventId Event identifier
    /// @param burnedCount Number of tokens burned
    event TokensBurned(string indexed eventId, uint256 burnedCount);

    /**
     * @notice Constructor sets the contract owner
     * @dev Owner is typically the backend service
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create a new event token with auto-generated ticker
     * @dev Deploys a new EventToken contract for the specified event
     * @param eventId Event identifier (e.g., "vibe-party-2026")
     * @param eventName Human-readable event name (e.g., "Vibe Party 2026")
     * @return tokenAddress Address of the newly deployed token
     *
     * Ticker Generation:
     * - Uppercase the name
     * - Remove spaces and special characters
     * - Prefix with $
     * - Example: "Vibe Party 2026" → $VIBEPARTY2026
     *
     * Requirements:
     * - Event must not already have a token
     * - Caller must be owner
     *
     * Emits: TokenCreated
     *
     * Side Effects:
     * - Deploys new EventToken contract
     * - Stores token address in eventTokens mapping
     * - Adds to allTokens array
     * - Marks event as having a token
     */
    function createEventToken(string memory eventId, string memory eventName) external onlyOwner returns (address) {
        require(!hasToken[eventId], "Token already exists for this event");

        // Generate ticker symbol: uppercase + remove spaces
        string memory symbol = _generateSymbol(eventName);
        string memory name = string(abi.encodePacked(eventName, " Token"));

        // Deploy new EventToken contract
        EventToken newToken = new EventToken(name, symbol, eventId);

        address tokenAddress = address(newToken);

        // Store token data
        eventTokens[eventId] = tokenAddress;
        allTokens.push(tokenAddress);
        hasToken[eventId] = true;

        emit TokenCreated(eventId, tokenAddress, name, symbol);

        return tokenAddress;
    }

    /**
     * @notice Mint tokens to an attendee for a specific event
     * @dev Calls mint() on the event's token contract
     * @param eventId Event identifier
     * @param attendee Address to receive tokens
     * @param amount Number of tokens to mint (typically 1 per attendee)
     *
     * Requirements:
     * - Event must have a token
     * - Caller must be owner
     *
     * Emits: TokensMinted
     *
     * Side Effects:
     * - Mints tokens to attendee via EventToken contract
     */
    function mintTokens(string memory eventId, address attendee, uint256 amount) external onlyOwner {
        require(hasToken[eventId], "No token for this event");

        address tokenAddress = eventTokens[eventId];
        EventToken token = EventToken(tokenAddress);

        token.mint(attendee, amount);

        emit TokensMinted(eventId, attendee, amount);
    }

    /**
     * @notice Burn unclaimed tokens after 24 hours (real scarcity mechanism)
     * @dev Calls burnUnclaimed() on the event's token contract
     * @param eventId Event identifier
     * @param unclaimedHolders Array of addresses with unclaimed tokens
     * @return burnedCount Number of tokens burned
     *
     * Requirements:
     * - Event must have a token
     * - 24 hours must have passed
     * - Caller must be owner
     *
     * Emits: TokensBurned
     *
     * Side Effects:
     * - Permanently burns unclaimed tokens
     * - Reduces total supply to exact attendance
     */
    function burnUnclaimed(
        string memory eventId,
        address[] calldata unclaimedHolders
    ) external onlyOwner returns (uint256) {
        require(hasToken[eventId], "No token for this event");

        address tokenAddress = eventTokens[eventId];
        EventToken token = EventToken(tokenAddress);

        token.burnUnclaimed(unclaimedHolders);

        // Get burned count from token stats
        (, , uint256 burned, ) = token.getStats();

        emit TokensBurned(eventId, burned);

        return burned;
    }

    /**
     * @notice Get token address for an event
     * @param eventId Event identifier
     * @return tokenAddress Address of the event's token (0x0 if none)
     */
    function getEventToken(string memory eventId) external view returns (address) {
        return eventTokens[eventId];
    }

    /**
     * @notice Get total number of tokens deployed
     * @return count Number of event tokens created
     */
    function getTotalTokens() external view returns (uint256) {
        return allTokens.length;
    }

    /**
     * @notice Get token statistics for an event
     * @param eventId Event identifier
     * @return supply Current circulating supply
     * @return minted Total minted
     * @return burned Total burned
     * @return scarcityRatio Percentage remaining (0-100)
     */
    function getTokenStats(
        string memory eventId
    ) external view returns (uint256 supply, uint256 minted, uint256 burned, uint256 scarcityRatio) {
        require(hasToken[eventId], "No token for this event");

        address tokenAddress = eventTokens[eventId];
        EventToken token = EventToken(tokenAddress);

        return token.getStats();
    }

    /**
     * @dev Internal function to generate ticker symbol from event name
     * @param eventName Human-readable event name
     * @return symbol Ticker symbol (uppercase, no spaces)
     *
     * Examples:
     * - "Vibe Party 2026" → "VIBEPARTY2026"
     * - "ETH Denver" → "ETHDENVER"
     * - "NFT.NYC 2026!" → "NFTNYC2026"
     */
    function _generateSymbol(string memory eventName) private pure returns (string memory) {
        bytes memory nameBytes = bytes(eventName);
        bytes memory symbolBytes = new bytes(nameBytes.length);
        uint256 symbolLength = 0;

        for (uint256 i = 0; i < nameBytes.length; i++) {
            bytes1 char = nameBytes[i];

            // Convert lowercase to uppercase (a-z → A-Z)
            if (char >= 0x61 && char <= 0x7A) {
                symbolBytes[symbolLength] = bytes1(uint8(char) - 32);
                symbolLength++;
            }
            // Keep uppercase letters (A-Z)
            else if (char >= 0x41 && char <= 0x5A) {
                symbolBytes[symbolLength] = char;
                symbolLength++;
            }
            // Keep numbers (0-9)
            else if (char >= 0x30 && char <= 0x39) {
                symbolBytes[symbolLength] = char;
                symbolLength++;
            }
            // Skip spaces and special characters
        }

        // Trim to actual length
        bytes memory trimmedSymbol = new bytes(symbolLength);
        for (uint256 i = 0; i < symbolLength; i++) {
            trimmedSymbol[i] = symbolBytes[i];
        }

        return string(trimmedSymbol);
    }
}
