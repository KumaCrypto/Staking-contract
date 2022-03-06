const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const StakingContract = await ethers.getContractFactory("StakingLP");
  const Staking = await StakingContract.deploy(
    "0xe98F6C683F72266fDE2E7eF2Fd07B83158Be1Eb2", // LP token contract
    "0xD39d75358040227969CAD7B4d8E82d1F99ec66f0", // Main token contract
    "0xF7A623297100b5Df95FeDDe19361584B1Ef5Ab8c" // Admin
  );

  await Staking.deployed();

  console.log(`
    Deploying 
    =================
    Staking contract address: ${Staking.address}
    Deployer: ${await Staking.provider.getSigner().getAddress()}
    Deployed to block: ${await ethers.provider.getBlockNumber()}
  `);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
