import { ethers } from 'ethers';

const getContract = () => {
    const rpcUrl = process.env.WEB3_RPC_URL;
    const privateKey = process.env.WEB3_PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
        return null;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const abi = [
        "function createExam(string memory _id, string memory _name, uint256 _totalQuestions, bytes32 _questionBankHash) public",
        "function submitResult(string memory _attemptId, string memory _examId, bytes32 _resultHash, address _cadetWallet) public",
        "function logViolation(string memory _cadetId, string memory _examId, string memory _vType) public"
    ];

    return new ethers.Contract(contractAddress, abi, wallet);
};

export async function createExamOnWeb3(id, name, totalQuestions, questionBankHash = ethers.ZeroHash) {
    try {
        const contract = getContract();
        if (!contract) return null;
        
        const tx = await contract.createExam(id, name, totalQuestions, questionBankHash);
        await tx.wait();
        return tx.hash;
    } catch (e) {
        console.error("Web3 Create Exam Error:", e);
        return null;
    }
}

export async function submitResultOnWeb3(attemptId, examId, resultHash, cadetWallet = ethers.ZeroAddress) {
    try {
        const contract = getContract();
        if (!contract) return null;
        
        const tx = await contract.submitResult(attemptId, examId, resultHash, cadetWallet);
        await tx.wait();
        return tx.hash;
    } catch (e) {
        console.error("Web3 Submit Result Error:", e);
        return null;
    }
}

export async function logViolationOnWeb3(cadetId, examId, type) {
    try {
        const contract = getContract();
        if (!contract) return null;
        
        const tx = await contract.logViolation(cadetId, examId, type);
        await tx.wait();
        return tx.hash;
    } catch (e) {
        console.error("Web3 Log Violation Error:", e);
        return null;
    }
}
