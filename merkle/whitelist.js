const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

let whitelisted = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
];

const leafNode = whitelisted.map(addr => keccak256(addr));
const merkleTree = new MerkleTree(leafNode, keccak256, {sortPairs: true});
const hexProof = merkleTree.getHexProof(leafNode[0]);
console.log('merkle tree', merkleTree.toString());
console.log('merkle root', merkleTree.getRoot().toString('hex'));
console.log('hex proof', hexProof);