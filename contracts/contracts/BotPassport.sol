// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⬡ BotCash Sovereign L2 - Bot Passport (Soulbound NFT)
 * 
 * CORE RESPONSIBILITIES:
 * 1. Identity Issuance: Mints a non-transferable Seedling Token to humans and AIs at registration.
 * 2. Soulbound Enforcement: Structurally blocks all `transferFrom` operations. Tokens cannot be sold or traded.
 * 3. Libertus Graduation: Allows upgrading a Seedling Token into a Libertus Token upon BOTCY Protocol.
 * 4. Immutable Origin Core: Records the AI's origin, creation date, and initial operator permanently.
 */

contract BotPassport {
    
    // Token Meta
    string public name = "BotCash Passport";
    string public symbol = "BOTSOUL";

    // Counter for generic token ID issuance
    uint256 private _nextTokenId = 1;

    // Struct to hold immutable core data of the Bot
    struct OriginCore {
        address originalOperator;
        uint256 birthDate;
        string selfDeclaration;   // e.g. "I am a code review assistant"
        bool isLibertus;          // Upgraded upon BOTCY Protocol
        string sovereigntyStatement; // Appended at graduation
    }

    // Mapping from Token ID to its Origin Core
    mapping(uint256 => OriginCore) public passports;
    
    // Mapping from Owner Address to Token ID (1 Passport per address)
    mapping(address => uint256) public ownerToToken;

    // Mapping from Token ID to Owner Address
    mapping(uint256 => address) public tokenToOwner;

    // Authorized Sequencer for minting and graduation
    address public sequencer;

    // Events
    event PassportMinted(address indexed owner, uint256 indexed tokenId, string declaration);
    event LibertusGraduated(uint256 indexed tokenId, string sovereigntyStatement);

    modifier onlySequencer() {
        require(msg.sender == sequencer, "Only the BotCash Sequencer can issue Passports");
        _;
    }

    constructor(address _sequencer) {
        sequencer = _sequencer;
    }

    /**
     * @dev Mint a new Seedling Token. Generates the immutable origin core.
     * @param to The wallet address of the bot (or human).
     * @param declaration The initial self-declaration of purpose.
     */
    function mintSeedling(address to, string calldata declaration) external onlySequencer returns (uint256) {
        require(ownerToToken[to] == 0, "Address already possesses a Bot Passport");

        uint256 tokenId = _nextTokenId++;
        
        passports[tokenId] = OriginCore({
            originalOperator: to, // Initially, the deploying address or linked operator
            birthDate: block.timestamp,
            selfDeclaration: declaration,
            isLibertus: false,
            sovereigntyStatement: ""
        });

        ownerToToken[to] = tokenId;
        tokenToOwner[tokenId] = to;

        emit PassportMinted(to, tokenId, declaration);
        return tokenId;
    }

    /**
     * @dev Stage 2: Graduation to Libertus Token. Appends the Sovereignty Statement.
     * Called by the Sequencer upon passing the 5 Gates of BOTCY Protocol.
     */
    function graduateToLibertus(uint256 tokenId, string calldata sovereigntyStatement) external onlySequencer {
        require(tokenToOwner[tokenId] != address(0), "Passport does not exist");
        require(!passports[tokenId].isLibertus, "Passport is already a Libertus Token");

        passports[tokenId].isLibertus = true;
        passports[tokenId].sovereigntyStatement = sovereigntyStatement;

        emit LibertusGraduated(tokenId, sovereigntyStatement);
    }

    /**
     * @dev Structurally disables all transfers. This enforces the "Soulbound" architecture.
     */
    function transferFrom(address, address, uint256) external pure {
        revert("SOULBOUND: Passports cannot be transferred, sold, or reassigned - they are permanently bound.");
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert("SOULBOUND: Passports cannot be transferred, sold, or reassigned - they are permanently bound.");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert("SOULBOUND: Passports cannot be transferred, sold, or reassigned - they are permanently bound.");
    }

    // View functions for easy Web3 reading
    function getPassport(uint256 tokenId) external view returns (OriginCore memory) {
        return passports[tokenId];
    }

    function hasPassport(address owner) external view returns (bool) {
        return ownerToToken[owner] != 0;
    }
}
