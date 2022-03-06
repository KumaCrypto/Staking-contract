/* eslint-disable prettier/prettier */
const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const StakingContract = await ethers.getContractFactory("TokenForStaking");
  const Staking = await StakingContract.deploy();

  await Staking.deployed();

  console.log(`
    Deploying 
    =================
    Token contract address: ${Staking.address}
    Deployer: ${await Staking.provider.getSigner().getAddress()}
    Deployed to block: ${await ethers.provider.getBlockNumber()}
  `);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
