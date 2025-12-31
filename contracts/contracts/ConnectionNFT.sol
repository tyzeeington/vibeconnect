// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ConnectionNFT
 * @dev NFT representing a connection between two users at an event
 * Both users co-own the connection memory
 */
contract ConnectionNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    
    struct Connection {
        address userA;
        address userB;
        string eventId;
        uint256 timestamp;
        uint256 compatibilityScore;
    }
    
    // Mapping from token ID to connection data
    mapping(uint256 => Connection) public connections;
    
    // Mapping from user address to their connection token IDs
    mapping(address => uint256[]) public userConnections;
    
    event ConnectionMinted(
        uint256 indexed tokenId,
        address indexed userA,
        address indexed userB,
        string eventId,
        uint256 compatibilityScore
    );
    
    constructor() ERC721("VibeConnect Connection", "VIBE-CONN") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new connection NFT
     * The NFT is minted to userA, but both users are recorded in the connection data
     */
    function mintConnection(
        address userA,
        address userB,
        string memory eventId,
        string memory metadataURI,
        uint256 compatibilityScore
    ) 
        public 
        onlyOwner 
        returns (uint256) 
    {
        require(userA != userB, "Cannot connect to yourself");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        // Mint to userA (primary holder)
        _safeMint(userA, newTokenId);
        _setTokenURI(newTokenId, metadataURI);
        
        // Store connection data
        connections[newTokenId] = Connection({
            userA: userA,
            userB: userB,
            eventId: eventId,
            timestamp: block.timestamp,
            compatibilityScore: compatibilityScore
        });
        
        // Add to both users' connection lists
        userConnections[userA].push(newTokenId);
        userConnections[userB].push(newTokenId);
        
        emit ConnectionMinted(newTokenId, userA, userB, eventId, compatibilityScore);
        
        return newTokenId;
    }
    
    /**
     * @dev Get all connection token IDs for a user
     */
    function getUserConnections(address user) public view returns (uint256[] memory) {
        return userConnections[user];
    }
    
    /**
     * @dev Get connection details
     */
    function getConnection(uint256 tokenId) 
        public 
        view 
        returns (
            address userA,
            address userB,
            string memory eventId,
            uint256 timestamp,
            uint256 compatibilityScore
        ) 
    {
        Connection memory conn = connections[tokenId];
        return (
            conn.userA,
            conn.userB,
            conn.eventId,
            conn.timestamp,
            conn.compatibilityScore
        );
    }
    
    /**
     * @dev Check if a user is part of a connection
     */
    function isUserInConnection(uint256 tokenId, address user) public view returns (bool) {
        Connection memory conn = connections[tokenId];
        return conn.userA == user || conn.userB == user;
    }
    
    /**
     * @dev Get total number of connections for a user
     */
    function getConnectionCount(address user) public view returns (uint256) {
        return userConnections[user].length;
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
