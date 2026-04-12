// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ExamStorage is ERC721, AccessControl {
    bytes32 public constant SERVER_ROLE = keccak256("SERVER_ROLE");

    struct Exam {
        string id;
        string name;
        uint256 totalQuestions;
        uint256 candidatesAttended;
        bytes32 questionBankHash;
    }

    mapping(string => Exam) public exams;
    string[] public examIds;
    
    mapping(string => bytes32) public resultHashes; // attemptId => resultHash
    mapping(string => bool) public processedAttempts;
    
    uint256 private _tokenIdCounter;

    event ExamCreated(string indexed id, string name, uint256 totalQuestions, bytes32 questionBankHash);
    event CandidateAttended(string indexed id, uint256 newTotalAttended);
    event ExamSubmitted(string indexed attemptId, string indexed examId, bytes32 resultHash);
    event ViolationLogged(string indexed cadetId, string indexed examId, uint256 timestamp, string violationType);

    constructor() ERC721("DigiExamCertificate", "DEC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SERVER_ROLE, msg.sender);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function createExam(string memory _id, string memory _name, uint256 _totalQuestions, bytes32 _questionBankHash) public onlyRole(SERVER_ROLE) {
        require(bytes(exams[_id].id).length == 0, "Exam already exists");
        
        exams[_id] = Exam({
            id: _id,
            name: _name,
            totalQuestions: _totalQuestions,
            candidatesAttended: 0,
            questionBankHash: _questionBankHash
        });
        examIds.push(_id);

        emit ExamCreated(_id, _name, _totalQuestions, _questionBankHash);
    }

    // Records the immutable result hash. Optionally mints a soulbound NFT if a wallet is provided and they passed.
    function submitResult(string memory _attemptId, string memory _examId, bytes32 _resultHash, address _cadetWallet) public onlyRole(SERVER_ROLE) {
        require(bytes(exams[_examId].id).length > 0, "Exam does not exist");
        require(!processedAttempts[_attemptId], "Attempt already processed");
        
        processedAttempts[_attemptId] = true;
        resultHashes[_attemptId] = _resultHash;
        exams[_examId].candidatesAttended += 1;
        
        emit ExamSubmitted(_attemptId, _examId, _resultHash);
        emit CandidateAttended(_examId, exams[_examId].candidatesAttended);
        
        // Soulbound NFT Minting for passing candidates who mapped their wallet
        if (_cadetWallet != address(0)) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter += 1;
            _safeMint(_cadetWallet, tokenId);
        }
    }
    
    function logViolation(string memory _cadetId, string memory _examId, string memory _vType) public onlyRole(SERVER_ROLE) {
        emit ViolationLogged(_cadetId, _examId, block.timestamp, _vType);
    }
    
    // Soulbound Implementation: Block transfers
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "Soulbound: Certificates are non-transferable");
        return super._update(to, tokenId, auth);
    }

    function getExam(string memory _id) public view returns (string memory, string memory, uint256, uint256, bytes32) {
        Exam memory e = exams[_id];
        return (e.id, e.name, e.totalQuestions, e.candidatesAttended, e.questionBankHash);
    }
}
