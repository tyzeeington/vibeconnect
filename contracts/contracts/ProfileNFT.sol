// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProfileNFT
 * @dev NFT representing a user's profile on VibeConnect
 * Each user gets one profile NFT that they own and control
 */
contract ProfileNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    
    // Mapping from wallet address to profile token ID
    mapping(address => uint256) public userProfiles;
    
    // Mapping from token ID to wallet address (inverse)
    mapping(uint256 => address) public profileOwners;
    
    event ProfileMinted(address indexed user, uint256 indexed tokenId, string metadataURI);
    event ProfileUpdated(uint256 indexed tokenId, string newMetadataURI);
    
    constructor() ERC721("VibeConnect Profile", "VIBE") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new profile NFT for a user
     * Each user can only have one profile NFT
     */
    function mintProfile(address to, string memory metadataURI) 
        public 
        onlyOwner 
        returns (uint256) 
    {
        require(userProfiles[to] == 0, "User already has a profile");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, metadataURI);
        
        userProfiles[to] = newTokenId;
        profileOwners[newTokenId] = to;
        
        emit ProfileMinted(to, newTokenId, metadataURI);
        
        return newTokenId;
    }
    
    /**
     * @dev Update profile metadata URI
     */
    function updateProfile(uint256 tokenId, string memory newMetadataURI) 
        public 
    {
        require(ownerOf(tokenId) == msg.sender, "Not the profile owner");
        _setTokenURI(tokenId, newMetadataURI);
        
        emit ProfileUpdated(tokenId, newMetadataURI);
    }
    
    /**
     * @dev Get profile token ID for a user
     */
    function getProfileId(address user) public view returns (uint256) {
        return userProfiles[user];
    }
    
    /**
     * @dev Check if user has a profile
     */
    function hasProfile(address user) public view returns (bool) {
        return userProfiles[user] != 0;
    }
    
    /**
     * @dev Override transfers to prevent profile NFT trading
     * Profiles are soulbound - they cannot be transferred
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Disallow all transfers (from != address(0))
        require(from == address(0), "Profile NFTs are soulbound and cannot be transferred");
        
        return super._update(to, tokenId, auth);
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
