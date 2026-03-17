const { expect } = require("chai");

describe("BotCashAnchor", function () {
  let BotCashAnchor, anchor, sequencer, snarkVerifier;
  const MAX_SUPPLY = 10000000n * 10n**18n;

  beforeEach(async function () {
    [sequencer, user1, user2] = await ethers.getSigners();
    
    // Mock SNARK Verifier
    const MockVerifier = await ethers.getContractFactory("MockZKVerifier");
    snarkVerifier = await MockVerifier.deploy();
    
    BotCashAnchor = await ethers.getContractFactory("BotCashAnchor");
    anchor = await BotCashAnchor.deploy(sequencer.address, await snarkVerifier.getAddress());
  });

  it("Should initialize with correct MAX_SUPPLY and sequencer", async function () {
    expect(await anchor.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    expect(await anchor.sequencer()).to.equal(sequencer.address);
  });

  it("Should anchor state properly when ZK proof is valid", async function () {
    const newRoot = ethers.encodeBytes32String("NEW_ROOT");
    const delta = ethers.parseEther("100");
    await anchor.connect(sequencer).anchorL2State(
      newRoot,
      delta,
      [0, 0], [[0, 0], [0, 0]], [0, 0], [0]
    );

    expect(await anchor.currentL2StateRoot()).to.equal(newRoot);
    expect(await anchor.totalMaceratedSupply()).to.equal(delta);
  });

  it("Should fail if supply hardcap is exceeded", async function () {
    const newRoot = ethers.encodeBytes32String("NEW_ROOT");
    const delta = MAX_SUPPLY + 1n;
    
    await expect(anchor.connect(sequencer).anchorL2State(
      newRoot,
      delta,
      [0, 0], [[0, 0], [0, 0]], [0, 0], [0]
    )).to.be.revertedWith("Cannot exceed 10M absolute hardcap");
  });

  it("Should fail if caller is not the sequencer", async function () {
    const newRoot = ethers.encodeBytes32String("NEW_ROOT");
    const delta = ethers.parseEther("100");
    
    await expect(anchor.connect(user1).anchorL2State(
      newRoot,
      delta,
      [0, 0], [[0, 0], [0, 0]], [0, 0], [0]
    )).to.be.revertedWith("Only the BotCash Sequencer can anchor state");
  });

  it("Should collect rollup rent and allow sequencer to claim", async function () {
    // mock merkle proof
    const amount = ethers.parseEther("50");
    const rent = ethers.parseEther("0.001");
    await anchor.connect(user1).bridgeToL1(amount, [], { value: rent });
    
    expect(await anchor.l1Balances(user1.address)).to.equal(amount);
    
    // claim
    const balanceBefore = await ethers.provider.getBalance(sequencer.address);
    // Gas usage will reduce balance so exact match is tricky, checking increase
    const tx = await anchor.connect(sequencer).claimRollupRent();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    
    const balanceAfter = await ethers.provider.getBalance(sequencer.address);
    expect(balanceAfter).to.equal(balanceBefore + rent - gasUsed);
  });
});
