/* eslint-disable prettier/prettier */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import {
  StakingLP,
  StakingLP__factory,
  TokenForStaking,
  TokenForStaking__factory,
  TokenForRewards,
  TokenForRewards__factory,
} from "../typechain-types";

describe("Staking", function () {
  let StakeToken: TokenForStaking;
  let RewardToken: TokenForRewards;
  let Staking: StakingLP;
  let signers: SignerWithAddress[];

  beforeEach(async function () {
    signers = await ethers.getSigners();
    StakeToken = await new TokenForStaking__factory(signers[0]).deploy();
    RewardToken = await new TokenForRewards__factory(signers[0]).deploy();
    Staking = await new StakingLP__factory(signers[0]).deploy(
      StakeToken.address,
      RewardToken.address,
      signers[0].address
    );
  });

  describe("Checking constructor arguments", () => {

    it("rewardToken is correct", async () => {
      const rewardToken = await Staking.getRewardsToken();
      expect(RewardToken.address).to.eq(rewardToken);
    });
    
    it("stakeToken is correct", async () => {
      const stakeToken = await Staking.getStakingToken();
      expect(StakeToken.address).to.eq(stakeToken);
    });

    it("Role is correct", async () => {
      const ADMIN_ROLE = ethers.utils.id("ADMIN_ROLE");
      expect(true).to.eq(await Staking.hasRole(ADMIN_ROLE, signers[0].address));
    });

  });
  describe("Total supply", () => {

    it("When deployed value eq 0 ", async () => {
      expect(await Staking.getTotalSupply()).to.eq(0);
    });

    it("'stake' change a total supply", async () => {
      await StakeToken.approve(Staking.address, 100);
      await Staking.stake(100);

      expect(await Staking.getTotalSupply()).to.eq(100);
    });

    it("'unstake' change a total supply", async () => {
      await StakeToken.approve(Staking.address, 100);
      await Staking.stake(100);

      await ethers.provider.send("evm_increaseTime", [1201]);

      await Staking.unstake(50);
      expect(await Staking.getTotalSupply()).to.eq(50);
    });

  });
  describe("interestRate", () => {

    it("When deployed rate eq to defolt value", async () => {
      expect(await Staking.getGlobalRate()).to.eq(20);
    });

    it("Set rate", async () => {
      await Staking.setGlobalRate(30);
      expect(await Staking.getGlobalRate()).to.eq(30);
    });

  });
  describe("blockedTime", () => {

    it("When deployed blockedTime eq to defolt value", async () => {
      expect(await Staking.getBlockedTime()).to.eq(1200);
    });

    it("Set blockedTime", async () => {
      await Staking.setBlockedTime(2000);
      expect(await Staking.getBlockedTime()).to.eq(2000);
    });

  });
  describe("balanceOf", () => {

    it("When deployed value eq 0 ", async () => {
      expect(await Staking.balanceOf(signers[0].address)).to.eq(0);
    });

    it("'stake' change a balance", async () => {
      await StakeToken.approve(Staking.address, 100);
      await Staking.stake(100);
      expect(await Staking.balanceOf(signers[0].address)).to.eq(100);
    });

    it("'unstake' change a balance", async () => {
      await StakeToken.approve(Staking.address, 100);
      await Staking.stake(100);

      await ethers.provider.send("evm_increaseTime", [1201]);

      await Staking.unstake(50);
      expect(await Staking.balanceOf(signers[0].address)).to.eq(50);
    });
  });
  describe("stakingTime", () => {
    it("stakingTime is correct", async () => {
      const blockNumber = await ethers.provider.getBlockNumber();
      const time = await ethers.provider.getBlock(blockNumber);

      await StakeToken.approve(Staking.address, 100);
      await Staking.stake(100);

      expect(time.timestamp + 1202).to.eq(                                // 2 секунды задержка из-за эвайта транзакций
        await Staking.stakingTime(signers[0].address)
      );

    });
  });
  describe("earned", () => {
    let rate: BigNumber,
        period: number,
        amount: number,
        balanceRate: BigNumber,
        time: number,
        timeDelta : BigNumber,
        earnTokens: BigNumber,
        checkEarnTokens: BigNumber;

    before(async () => {
      rate = await Staking.getGlobalRate();
      period = 600;
      amount = 100;
      time = 1800;
    });

    beforeEach(async () => {
      await StakeToken.approve(Staking.address, amount);
      await Staking.stake(amount);

      balanceRate = (await Staking.balanceOf(signers[0].address))
      .div(100)
      .mul(rate);

      await ethers.provider.send("evm_increaseTime", [time]);
      await Staking.timeUpdate();

      timeDelta = (await Staking.getLastUpdatedTime()).sub(
        await Staking.stakingTime(signers[0].address)
      );

      earnTokens = await Staking.earned(signers[0].address);
      checkEarnTokens = timeDelta.div(period).mul(balanceRate);
    });

    it("0. earned value is correct balance: 100 time: 1800", async () => {
      expect(earnTokens).to.eq(checkEarnTokens);
    });

    time = 2000;

    it("1. earned value is correct balance: 100 time: 2000", async () => {
      expect(earnTokens).to.eq(checkEarnTokens);
    });

    amount = 250;
    time = 1800;

    it("2. earned value is correct balance: 250 time: 1800", async () => {
      expect(earnTokens).to.eq(checkEarnTokens);
    });

    amount = 65452;

    it("3. earned value is correct balance: 65452 time: 1800", async () => {
      expect(earnTokens).to.eq(checkEarnTokens);
    });

    time = 6465464;

    it("4. earned value is correct balance: 65452 time: 6465464", async () => {
      expect(earnTokens).to.eq(checkEarnTokens);
    });

  });
  describe("stake", () => {
    const amount = 100;
    const allAmount = 250;

    let balanceCA_Before: BigNumber,
        totalSupplyBefore: BigNumber,
        balanceBefore: BigNumber;

    beforeEach(async () => {
      balanceCA_Before = await StakeToken.balanceOf(Staking.address);
      totalSupplyBefore = await Staking.getTotalSupply();
      balanceBefore = await Staking.balanceOf(signers[0].address);

      await StakeToken.approve(Staking.address, allAmount);
      await Staking.stake(amount);
    });

    it("contract balance receive tokens", async () => {
      const balanceCA_After = await StakeToken.balanceOf(Staking.address);
      expect(balanceCA_Before.add(amount)).to.eq(balanceCA_After);
    });

    it("total supply increased", async () => {
      const totalSupplyAfter = await Staking.getTotalSupply();
      expect(totalSupplyBefore.add(amount)).to.eq(totalSupplyAfter);
    });

    it("balance increased", async () => {
      const balanceAfter = await Staking.balanceOf(signers[0].address);
      expect(balanceBefore.add(amount)).to.eq(balanceAfter);
    });

    it("Started time fixed", async () => {
      const stakingTime = await Staking.stakingTime(signers[0].address);
      const blockNumber = await ethers.provider.getBlockNumber();
      const time = (await ethers.provider.getBlock(blockNumber)).timestamp;
      expect(time + 1200).to.eq(stakingTime);
    });

    it("amountNotA0 - reverted", async () => {
      await expect(Staking.stake(0)).to.be.revertedWith("The amount must be greater then 0");
    });

    it("Event Staked", async () => {
      expect(Staking.stake(50)).to.emit(Staking, "Staked").withArgs(signers[0].address, 50);
    });
    
  });
  describe("unstake", () => {
    const amount = 100;
    const allAmount = 250;

    let balanceCA_Before: BigNumber,
        totalSupply_Before: BigNumber;

    beforeEach(async function () {
      await StakeToken.approve(Staking.address, allAmount);
      await Staking.stake(amount);
      await ethers.provider.send("evm_increaseTime", [1800]);

      balanceCA_Before = await StakeToken.balanceOf(Staking.address);
      totalSupply_Before = await Staking.getTotalSupply();

      await Staking.unstake(amount);
    });

    it("contract balance decreased", async () => {
      const balanceCA_After = await StakeToken.balanceOf(Staking.address);
      expect(balanceCA_After.add(amount)).to.eq(balanceCA_Before);
    });

    it("total supply decreased", async () => {
      const totalSupply_After = await Staking.getTotalSupply();
      expect(totalSupply_After.add(amount)).to.eq(totalSupply_Before);
    });

    it("Event Unstaked", async () => {
      await Staking.stake(amount);
      await ethers.provider.send("evm_increaseTime", [1800]);
      expect(Staking.unstake(50)).to.emit(Staking, "Unstaked").withArgs(signers[0].address, 50);
    });

  });

  describe("claim", () => {
    let
        amount: number,
        time: number,
        rewardBalanceBefore: BigNumber,
        rewardBalanceAfter: BigNumber,
        balanceDelta: BigNumber,
        earnTokens: BigNumber;
    const allAmount = 250;

    before(async () => {
      amount = 100;
      time = 1800;
    });

    beforeEach(async () => {
      RewardToken.transfer(Staking.address, 10000000);

      await StakeToken.approve(Staking.address, allAmount);
      await Staking.stake(amount);

      await ethers.provider.send("evm_increaseTime", [time]);
      await Staking.timeUpdate();

      earnTokens = await Staking.earned(signers[0].address);

      rewardBalanceBefore = await RewardToken.balanceOf(signers[0].address);
      await Staking.claim();
      rewardBalanceAfter = await RewardToken.balanceOf(signers[0].address);
      balanceDelta = rewardBalanceAfter.sub(rewardBalanceBefore);
    });

    it("0. claimed value is correct staked: 100 time: 1800", async () => {
      expect(earnTokens).to.eq(balanceDelta);
    });

    amount = 1515;
    it("1. claimed value is correct staked: 1515 time: 1800", async () => {
      expect(earnTokens).to.eq(balanceDelta);
    });

    time = 44544;
    it("2. claimed value is correct staked: 1515 time: 44544", async () => {
      expect(earnTokens).to.eq(balanceDelta);
    });

    time = 455445;
    amount = 984;
    it("3. claimed value is correct staked: 984 time: 455445", async () => {
      expect(earnTokens).to.eq(balanceDelta);
    });

    it("Event Claimed", async () => {
      await Staking.stake(amount);
      await ethers.provider.send("evm_increaseTime", [1800]);
      expect(Staking.unstake(10)).to.emit(Staking, "Claimed").withArgs(signers[0].address, 10);
    });
  });
  
  describe("checkTime", () => {
    it("unstake - reverted", async () => {
      await StakeToken.approve(Staking.address, 100);
      await Staking.stake(100);
      await expect(Staking.unstake(50)).to.be.revertedWith("Token lock time has not yet expired");
    })
  });

});
