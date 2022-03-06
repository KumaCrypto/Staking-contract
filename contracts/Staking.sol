// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StakingLP is AccessControl {

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    //The role allows to change the blocking time and interest rate
    
    IERC20 public rewardsToken;
    IERC20 public stakingToken;

    constructor(address _stakingToken, address _rewardsToken, address _admin) {
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
        _setupRole(ADMIN_ROLE, _admin);
    }

    uint private _totalSupply;
    uint private lastUpdatedTime;

    uint private interestRate = 20;
    uint private blockedTime = 1200;

    event Staked(address indexed sender, uint amount);
    event Unstaked(address indexed receiver, uint amount);
    event Claimed(address indexed receiver, uint amount);

    mapping(address => uint) private _rewards;
    mapping(address => uint) private _balances;
    mapping(address => uint) private _stakingStartedTime;

    modifier amountNotA0(uint _amount) {
       require(_amount > 0, "The amount must be greater then 0");
        _;
    }

    modifier checkTime(address account) {
        timeUpdate();
        require(_stakingStartedTime[account] < lastUpdatedTime, "Token lock time has not yet expired");
        _;
    }
    
    modifier updateReward(address account) {
        _rewards[account] = earned(account);
        _;
    }

    function earned(address account) public view returns (uint) {
        uint rate = _balances[account] / 100 * interestRate;
        return ((lastUpdatedTime - _stakingStartedTime[account]) / 600 * rate);
    }

    function stake(uint _amount) external amountNotA0(_amount) {
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        _totalSupply += _amount;
        _balances[msg.sender] += _amount;
        _stakingStartedTime[msg.sender] = block.timestamp + blockedTime;
        emit Staked(msg.sender, _amount);
    }

    function unstake(uint _amount) external amountNotA0(_amount) checkTime(msg.sender) {
        stakingToken.transfer(msg.sender, _amount);
        _totalSupply -= _amount;
        _balances[msg.sender] -= _amount;
        emit Unstaked(msg.sender, _amount);
    }

    function claim() external updateReward(msg.sender) checkTime(msg.sender) {
        uint reward = _rewards[msg.sender];
        _rewards[msg.sender] = 0;
        rewardsToken.transfer(msg.sender, reward);
        emit Claimed(msg.sender, reward);
    }


    function getRewardsToken() external view returns(IERC20) {
        return rewardsToken;
    }

    function getStakingToken() external view returns(IERC20) {
        return stakingToken;
    }

    function getTotalSupply() external view returns(uint) {
        return _totalSupply;
    }

    function getGlobalRate() external view returns(uint) {
        return interestRate;
    }

    function setGlobalRate(uint _newRate) external onlyRole(ADMIN_ROLE) {
        interestRate = _newRate;
    }

    function getBlockedTime() external view returns(uint) {
        return blockedTime;
    }
    function setBlockedTime(uint _newTime) external onlyRole(ADMIN_ROLE) {
        blockedTime = _newTime;
    }

    function balanceOf(address _account) external view returns(uint){
        return _balances[_account];
    }

    function stakingTime(address _account) external view returns(uint){
        return _stakingStartedTime[_account];
    }

    function getLastUpdatedTime() external view returns(uint){
        return lastUpdatedTime;
    }

    function timeUpdate() public {
        lastUpdatedTime = block.timestamp;
    }
}