const express = require('express');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const cors = require('cors');
const whitelisted = require('./whitelist.json');

const leafNode = whitelisted.map(addr => keccak256(addr));
const merkleTree = new MerkleTree(leafNode, keccak256, {sortPairs: true});

const app = express();
app.use(cors());

app.listen(3000, () => {
 console.log("Server running on port 3000");
});

app.get("/merkle/root", (req, res, next) => {
  res.json({
    root: merkleTree.getHexRoot()
  });
});

app.get("/whitelisted/:address", (req, res, next) => {
  let address = req.params.address;
  console.log(leafNode);
  console.log(address);

  res.json({
    proof: merkleTree.getHexProof(keccak256(address))
  })
})