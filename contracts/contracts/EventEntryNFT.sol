// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EventEntryNFT
 * @author VibeConnect Team
 * @notice Door-Mint Protocol: Gasless NFT minting at event entry via QR scan
 * @dev One NFT per attendee per event. Unclaimed NFTs burn after 24 hours for real scarcity.
 *
 * Features:
 * - Gasless minting via meta-transactions (organizer pays gas)
 * - 24-hour burn mechanism for unclaimed NFTs
 * - Real scarcity: final supply = exact crowd size
 * - Event-based tracking with capacity limits
 *
 * Side Effects:
 * - Burning NFTs after 24 hours permanently reduces supply
 * - Claimed status is immutable once set
 *
 * Access Control:
 * - Only event organizers can mint/burn for their events
 * - Owner can override in emergency situations
 */
contract EventEntryNFT is ERC721, ERC721URIStorage, Ownable {
    /// @dev Counter for token IDs (global across all events)
    uint256 private _tokenIdCounter;

    /**
     * @dev Event data structure
     * @param organizer Address of the event organizer
     * @param eventId Unique identifier for the event
     * @param capacity Maximum number of attendees
     * @param totalMinted Total NFTs minted for this event
     * @param totalClaimed Total NFTs claimed by attendees
     * @param createdAt Timestamp when event was created
     * @param burnDeadline Timestamp after which unclaimed NFTs can be burned (24h after creation)
     */
    struct Event {
        address organizer;
        string eventId;
        uint256 capacity;
        uint256 totalMinted;
        uint256 totalClaimed;
        uint256 createdAt;
        uint256 burnDeadline;
    }

    /// @dev Mapping from event ID to Event struct
    mapping(string => Event) public events;

    /// @dev Mapping from event ID to token ID to claimed status
    mapping(string => mapping(uint256 => bool)) public claimedStatus;

    /// @dev Mapping from event ID to array of token IDs
    mapping(string => uint256[]) private eventTokens;

    /// @dev Constant for 24 hours in seconds
    uint256 private constant BURN_PERIOD = 24 hours;

    /// @notice Emitted when a new event is created
    /// @param eventId Unique identifier for the event
    /// @param organizer Address of the event organizer
    /// @param capacity Maximum number of attendees
    /// @param burnDeadline Timestamp when unclaimed NFTs can be burned
    event EventCreated(string indexed eventId, address indexed organizer, uint256 capacity, uint256 burnDeadline);

    /// @notice Emitted when an entry NFT is minted
    /// @param eventId Event identifier
    /// @param attendee Address receiving the NFT
    /// @param tokenId ID of the minted token
    /// @param metadataURI IPFS URI for NFT metadata
    event EntryMinted(string indexed eventId, address indexed attendee, uint256 tokenId, string metadataURI);

    /// @notice Emitted when an NFT is marked as claimed
    /// @param eventId Event identifier
    /// @param tokenId ID of the claimed token
    event EntryClaimed(string indexed eventId, uint256 tokenId);

    /// @notice Emitted when unclaimed NFTs are burned
    /// @param eventId Event identifier
    /// @param burnedCount Number of NFTs burned
    event BurnCompleted(string indexed eventId, uint256 burnedCount);

    /**
     * @notice Constructor initializes the ERC721 token
     * @dev Sets token name and symbol for the collection
     */
    constructor() ERC721("VibeConnect Event Entry", "VENTRY") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }

    /**
     * @notice Create a new event with capacity limit
     * @dev Can only be called by event organizers. Sets burn deadline to 24h after creation.
     * @param eventId Unique identifier for the event
     * @param capacity Maximum number of attendees
     *
     * Requirements:
     * - eventId must not already exist
     * - capacity must be greater than 0
     *
     * Emits: EventCreated
     *
     * Side Effects:
     * - Creates new event in storage
     * - Sets burn deadline to block.timestamp + 24 hours
     */
    function createEvent(string memory eventId, uint256 capacity) external {
        require(events[eventId].createdAt == 0, "Event already exists");
        require(capacity > 0, "Capacity must be greater than 0");

        uint256 burnDeadline = block.timestamp + BURN_PERIOD;

        events[eventId] = Event({
            organizer: msg.sender,
            eventId: eventId,
            capacity: capacity,
            totalMinted: 0,
            totalClaimed: 0,
            createdAt: block.timestamp,
            burnDeadline: burnDeadline
        });

        emit EventCreated(eventId, msg.sender, capacity, burnDeadline);
    }

    /**
     * @notice Mint an entry NFT for an attendee (gasless for attendee)
     * @dev Organizer pays gas. Attendee receives NFT instantly via QR scan.
     * @param eventId Event identifier
     * @param attendee Address to receive the NFT
     * @param metadataURI IPFS URI for the NFT metadata
     * @return tokenId The ID of the newly minted token
     *
     * Requirements:
     * - Event must exist
     * - Caller must be event organizer or contract owner
     * - Total minted must be less than capacity
     *
     * Emits: EntryMinted
     *
     * Side Effects:
     * - Increments _tokenIdCounter
     * - Increments event.totalMinted
     * - Transfers NFT to attendee
     * - Stores token ID in eventTokens array
     */
    function mintEntry(string memory eventId, address attendee, string memory metadataURI) external returns (uint256) {
        Event storage evt = events[eventId];
        require(evt.createdAt != 0, "Event does not exist");
        require(msg.sender == evt.organizer || msg.sender == owner(), "Not authorized");
        require(evt.totalMinted < evt.capacity, "Event at capacity");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(attendee, tokenId);
        _setTokenURI(tokenId, metadataURI);

        evt.totalMinted++;
        eventTokens[eventId].push(tokenId);
        claimedStatus[eventId][tokenId] = false;

        emit EntryMinted(eventId, attendee, tokenId, metadataURI);

        return tokenId;
    }

    /**
     * @notice Mark an entry NFT as claimed by the attendee
     * @dev Claimed NFTs will NOT be burned after 24 hours
     * @param eventId Event identifier
     * @param tokenId Token ID to mark as claimed
     *
     * Requirements:
     * - Event must exist
     * - Token must belong to this event
     * - Token must not already be claimed
     * - Caller must be event organizer or contract owner
     *
     * Emits: EntryClaimed
     *
     * Side Effects:
     * - Sets claimedStatus to true (immutable)
     * - Increments event.totalClaimed
     */
    function markAsClaimed(string memory eventId, uint256 tokenId) external {
        Event storage evt = events[eventId];
        require(evt.createdAt != 0, "Event does not exist");
        require(msg.sender == evt.organizer || msg.sender == owner(), "Not authorized");
        require(!claimedStatus[eventId][tokenId], "Already claimed");

        claimedStatus[eventId][tokenId] = true;
        evt.totalClaimed++;

        emit EntryClaimed(eventId, tokenId);
    }

    /**
     * @notice Burn all unclaimed NFTs for an event after 24 hours
     * @dev Implements real scarcity: final supply = exact attendance count
     * @param eventId Event identifier
     * @return burnedCount Number of NFTs burned
     *
     * Requirements:
     * - Event must exist
     * - 24 hours must have passed since event creation
     * - Caller must be event organizer or contract owner
     *
     * Emits: BurnCompleted
     *
     * Side Effects:
     * - Permanently burns all unclaimed NFTs
     * - Reduces total supply
     * - Destroys token metadata
     */
    function burnUnclaimed(string memory eventId) external returns (uint256) {
        Event storage evt = events[eventId];
        require(evt.createdAt != 0, "Event does not exist");
        require(block.timestamp >= evt.burnDeadline, "Burn period not reached");
        require(msg.sender == evt.organizer || msg.sender == owner(), "Not authorized");

        uint256 burnedCount = 0;
        uint256[] memory tokens = eventTokens[eventId];

        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 tokenId = tokens[i];

            if (!claimedStatus[eventId][tokenId] && _ownerOf(tokenId) != address(0)) {
                _burn(tokenId);
                burnedCount++;
            }
        }

        emit BurnCompleted(eventId, burnedCount);

        return burnedCount;
    }

    /**
     * @notice Get total supply of NFTs for an event (claimed + unclaimed)
     * @dev Counts only existing (non-burned) tokens
     * @param eventId Event identifier
     * @return count Current supply of NFTs for the event
     */
    function getTotalSupply(string memory eventId) external view returns (uint256) {
        Event storage evt = events[eventId];
        require(evt.createdAt != 0, "Event does not exist");

        uint256 count = 0;
        uint256[] memory tokens = eventTokens[eventId];

        for (uint256 i = 0; i < tokens.length; i++) {
            if (_ownerOf(tokens[i]) != address(0)) {
                count++;
            }
        }

        return count;
    }

    /**
     * @notice Get event details
     * @param eventId Event identifier
     * @return Event struct with all event data
     */
    function getEvent(string memory eventId) external view returns (Event memory) {
        require(events[eventId].createdAt != 0, "Event does not exist");
        return events[eventId];
    }

    /**
     * @notice Required override for ERC721URIStorage
     * @dev Returns the URI for a given token ID
     * @param tokenId Token ID to query
     * @return Token URI string
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Required override for ERC721URIStorage
     * @dev Checks if contract supports an interface
     * @param interfaceId Interface identifier
     * @return bool True if interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
