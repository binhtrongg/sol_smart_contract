// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "hardhat/console.sol";

contract ERC20Imp {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    uint256 public constant maxSupply = 2_000_000_000 * 10 ** 18;

    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    mapping(address => bool) public minters;
    mapping(address => bool) public pausers;
    address public admin;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Mint(address indexed minter, address indexed to, uint256 value);
    event Burn(address indexed burner, uint256 value);
    event Pause(address indexed pauser);
    event Unpause(address indexed pauser);

    bool public paused;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "Only minter can call this function");
        _;
    }

    modifier onlyPauser() {
        require(pausers[msg.sender], "Only pauser can call this function");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        admin = msg.sender;
        balances[msg.sender] = _totalSupply;
    }

    function balanceOf(address _owner) external view returns (uint256) {
        return balances[_owner];
    }

    function transfer(
        address _to,
        uint256 _amount
    ) external whenNotPaused returns (bool) {
        require(balances[msg.sender] >= _amount, "not enough money");
        balances[msg.sender] -= _amount;
        balances[_to] += _amount;

        emit Transfer(msg.sender, _to, _amount);
        return true;
    }

    function approve(
        address _spender,
        uint256 _amount
    ) external whenNotPaused returns (bool) {
        allowances[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) external whenNotPaused returns (bool) {
        require(balances[_from] >= _amount, "not enough money");
        require(
            allowances[_from][msg.sender] >= _amount,
            "not enough allowance"
        );
        allowances[_from][msg.sender] -= _amount;
        balances[_from] -= _amount;
        balances[_to] += _amount;
        emit Transfer(msg.sender, _to, _amount);
        return true;
    }

    function mint(
        address _to,
        uint256 _amount
    ) external onlyMinter whenNotPaused {
        require(totalSupply + _amount <= maxSupply, "max supply exceeded");
        totalSupply += _amount;
        balances[_to] += _amount;
        emit Mint(msg.sender, _to, _amount);
    }

    function burn(uint256 _amount) external whenNotPaused {
        require(balances[msg.sender] >= _amount, "not enough money");
        balances[msg.sender] -= _amount;
        totalSupply -= _amount;
        emit Burn(msg.sender, _amount);
    }

    function pause() external onlyPauser {
        require(!paused, "Contract is already unpaused");
        paused = true;
        emit Pause(msg.sender);
    }

    function unPause() external onlyPauser {
        require(paused, "Contract is  paused");
        paused = false;
        emit Unpause(msg.sender);
    }

    function setMinter(address _account, bool _status) external onlyAdmin {
        minters[_account] = _status;
    }

    function setPauser(address account, bool status) external onlyAdmin {
        pausers[account] = status;
    }
}
