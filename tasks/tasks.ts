import { task } from "hardhat/config";
import hre from "hardhat";
const ethers = hre.ethers;

const contractAddress = "0x75291d181036360fd67E7c9467bf1367A586ae68";

task("Stake", "Stake your LP's & get reward in native tokens")
  .addParam("amount", "How much do you want to stake")
  .setAction(async (taskArgs, hre) => {
    const token = await hre.ethers.getContractAt("StakingLP", contractAddress);
    await token.stake(taskArgs.amount);
    console.log(`Yep! You successfully staked ${taskArgs.amount}`);
  });

task("Unstake", "Get Your LP's back")
  .addParam("amount", "How much do you want to get back")
  .setAction(async (taskArgs, hre) => {
    const token = await hre.ethers.getContractAt("StakingLP", contractAddress);
    await token.unstake(taskArgs.amount);
    console.log(
      `Yep! You successfully unstake ${taskArgs.amount}. You can stake your LP's again in any time!`
    );
  });

task(
  "Claim",
  "Get Your reward (native tokens), be careful, if enough time has not elapsed - claim will fail"
).setAction(async (hre) => {
  const token = await hre.ethers.getContractAt("StakingLP", contractAddress);
  await token.claim();
  console.log(
    `Yep! You successfully claimed a reward. You can stake your LP's again in any time & get more tokens!`
  );
});
