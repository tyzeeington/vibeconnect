from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_defunct
from app.config import settings
from typing import Dict, Optional, List
import json
import os

class Web3Service:
    """
    Service for interacting with Base/Polygon blockchain
    Handles profile NFTs, connection NFTs, and PesoBytes token transactions
    """

    def __init__(self):
        # Use BASE_RPC_URL from settings (updated from POLYGON_RPC_URL)
        rpc_url = settings.BASE_RPC_URL
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))

        if settings.PRIVATE_KEY:
            self.account = Account.from_key(settings.PRIVATE_KEY)
        else:
            self.account = None

        # Contract addresses (will be set after deployment)
        self.profile_nft_address = settings.PROFILE_NFT_CONTRACT
        self.connection_nft_address = settings.CONNECTION_NFT_CONTRACT
        self.pesobytes_address = settings.PESOBYTES_CONTRACT

        # Load ABIs
        self.profile_nft_abi = self._load_abi('ProfileNFT.json')
        self.connection_nft_abi = self._load_abi('ConnectionNFT.json')
        self.pesobytes_abi = self._load_abi('PesoBytes.json')

    def _load_abi(self, filename: str):
        """Load ABI from JSON file"""
        try:
            abi_path = os.path.join(os.path.dirname(__file__), '..', 'abis', filename)
            with open(abi_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading ABI {filename}: {e}")
            return None
    
    def verify_wallet_signature(self, wallet_address: str, signature: str, message: str) -> bool:
        """
        Verify that a user owns their wallet address

        Args:
            wallet_address: The wallet address to verify
            signature: The signature provided by the user
            message: The message that was signed

        Returns:
            True if signature is valid
        """
        try:
            # Encode message according to EIP-191 standard
            encoded_message = encode_defunct(text=message)

            # Recover the address that signed the message
            recovered_address = self.w3.eth.account.recover_message(
                encoded_message,
                signature=signature
            )

            # Compare addresses (case-insensitive)
            return recovered_address.lower() == wallet_address.lower()
        except Exception as e:
            print(f"Signature verification error: {e}")
            return False
    
    async def mint_profile_nft(self, wallet_address: str, metadata_uri: str) -> Optional[Dict]:
        """
        Mint a profile NFT for a new user
        
        Args:
            wallet_address: User's wallet address
            metadata_uri: IPFS URI containing profile metadata
            
        Returns:
            Transaction receipt with NFT token ID
        """
        if not self.profile_nft_address or not self.profile_nft_abi:
            print("Profile NFT contract not configured")
            return None
        
        try:
            contract = self.w3.eth.contract(
                address=self.profile_nft_address,
                abi=self.profile_nft_abi
            )
            
            # Build transaction
            txn = contract.functions.mintProfile(
                wallet_address,
                metadata_uri
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send
            signed_txn = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Extract token ID from logs
            token_id = contract.events.ProfileMinted().process_receipt(receipt)[0]['args']['tokenId']
            
            return {
                'transaction_hash': tx_hash.hex(),
                'token_id': token_id,
                'block_number': receipt['blockNumber']
            }
            
        except Exception as e:
            print(f"Error minting profile NFT: {e}")
            return None
    
    async def mint_connection_nft(
        self,
        user_a_address: str,
        user_b_address: str,
        event_id: str,
        metadata_uri: str,
        compatibility_score: int
    ) -> Optional[Dict]:
        """
        Mint a connection NFT when two users connect

        Args:
            user_a_address: First user's wallet
            user_b_address: Second user's wallet
            event_id: Event where they connected
            metadata_uri: IPFS URI with connection memory data
            compatibility_score: Compatibility score (0-100)

        Returns:
            Transaction receipt with NFT token ID
        """
        if not self.connection_nft_address or not self.connection_nft_abi:
            print("Connection NFT contract not configured")
            return None
        
        try:
            contract = self.w3.eth.contract(
                address=self.connection_nft_address,
                abi=self.connection_nft_abi
            )
            
            txn = contract.functions.mintConnection(
                user_a_address,
                user_b_address,
                event_id,
                metadata_uri,
                compatibility_score
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 250000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            signed_txn = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            token_id = contract.events.ConnectionMinted().process_receipt(receipt)[0]['args']['tokenId']
            
            return {
                'transaction_hash': tx_hash.hex(),
                'token_id': token_id,
                'block_number': receipt['blockNumber']
            }
            
        except Exception as e:
            print(f"Error minting connection NFT: {e}")
            return None
    
    async def award_pesobytes(self, wallet_address: str, amount: int) -> Optional[str]:
        """
        Award PesoBytes tokens to a user
        
        Args:
            wallet_address: User's wallet address
            amount: Number of tokens to award
            
        Returns:
            Transaction hash
        """
        if not self.pesobytes_address or not self.pesobytes_abi:
            print("PesoBytes contract not configured")
            return None
        
        try:
            contract = self.w3.eth.contract(
                address=self.pesobytes_address,
                abi=self.pesobytes_abi
            )
            
            # Convert amount to wei (assuming 18 decimals)
            amount_wei = self.w3.to_wei(amount, 'ether')
            
            txn = contract.functions.transfer(
                wallet_address,
                amount_wei
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            signed_txn = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            return tx_hash.hex()
            
        except Exception as e:
            print(f"Error awarding PesoBytes: {e}")
            return None

    async def award_connection_pesobytes(
        self,
        user_a_address: str,
        user_b_address: str,
        compatibility_score: int
    ) -> Optional[str]:
        """
        Award PesoBytes tokens to both users for making a connection
        Uses the contract's awardConnectionReward() method which automatically
        applies high-quality bonuses for compatibility scores >= 90

        Args:
            user_a_address: First user's wallet address
            user_b_address: Second user's wallet address
            compatibility_score: Compatibility score (0-100)

        Returns:
            Transaction hash
        """
        if not self.pesobytes_address or not self.pesobytes_abi:
            print("PesoBytes contract not configured")
            return None

        try:
            contract = self.w3.eth.contract(
                address=self.pesobytes_address,
                abi=self.pesobytes_abi
            )

            txn = contract.functions.awardConnectionReward(
                user_a_address,
                user_b_address,
                compatibility_score
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 150000,
                'gasPrice': self.w3.eth.gas_price
            })

            signed_txn = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)

            return tx_hash.hex()

        except Exception as e:
            print(f"Error awarding connection PesoBytes: {e}")
            return None

    async def get_connection_nft_data(self, token_id: int) -> Optional[Dict]:
        """
        Query on-chain data for a connection NFT

        Args:
            token_id: The NFT token ID

        Returns:
            Dictionary with connection data from blockchain
        """
        if not self.connection_nft_address or not self.connection_nft_abi:
            print("Connection NFT contract not configured")
            return None

        try:
            contract = self.w3.eth.contract(
                address=self.connection_nft_address,
                abi=self.connection_nft_abi
            )

            # Get connection details
            user_a, user_b, event_id, timestamp, compatibility_score = contract.functions.getConnection(token_id).call()

            # Get metadata URI
            try:
                metadata_uri = contract.functions.tokenURI(token_id).call()
            except Exception:
                metadata_uri = None

            return {
                'token_id': token_id,
                'user_a': user_a,
                'user_b': user_b,
                'event_id': event_id,
                'timestamp': timestamp,
                'compatibility_score': compatibility_score,
                'metadata_uri': metadata_uri
            }

        except Exception as e:
            print(f"Error fetching connection NFT data: {e}")
            return None

    async def get_user_connection_nfts(self, wallet_address: str) -> List[int]:
        """
        Get all connection NFT token IDs for a user

        Args:
            wallet_address: User's wallet address

        Returns:
            List of token IDs
        """
        if not self.connection_nft_address or not self.connection_nft_abi:
            print("Connection NFT contract not configured")
            return []

        try:
            contract = self.w3.eth.contract(
                address=self.connection_nft_address,
                abi=self.connection_nft_abi
            )

            # Get user's connection token IDs
            token_ids = contract.functions.getUserConnections(wallet_address).call()

            return list(token_ids)

        except Exception as e:
            print(f"Error fetching user connections: {e}")
            return []

# Initialize web3 service
web3_service = Web3Service()
