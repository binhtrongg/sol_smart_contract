// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ERC721Imp {
    string public name;
    string public symbol;
    uint256 public totalSupply;
    uint256 public constant MAX_SUPPLY = 100_000;

    mapping(uint256 => address) private owners;
    mapping(address => uint256) private balances;
    mapping(uint256 => address) private tokenApprovals;
    string private baseTokenURI = "https://metadata.example/";
    modifier onlyTokenOwner(uint256 _tokenId) {
        require(owners[_tokenId] == msg.sender, "Not the token owner");
        _;
    }

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );
    event Approval(
        address indexed owner,
        address indexed approved,
        uint256 indexed tokenId
    );

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function balanceOf(address _owner) public view returns (uint256) {
        require(_owner != address(0), "Invalid address");
        return balances[_owner];
    }

    function ownerOf(uint256 _tokenId) public view returns (address) {
        address owner = owners[_tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }

    function tokenURI(uint256 _tokenId) public view returns (string memory) {
        require(owners[_tokenId] != address(0), "Token does not exist");
        return string(abi.encodePacked(baseTokenURI, toString(_tokenId)));
    }

    function approve(address _to, uint256 _tokenId) public {
        address owner = owners[_tokenId];
        require(owner == msg.sender, "Not the token owner");
        require(_to != owner, "Cannot approve self");

        tokenApprovals[_tokenId] = _to;
        emit Approval(owner, _to, _tokenId);
    }

    function getApproved(uint256 _tokenId) public view returns (address) {
        require(owners[_tokenId] != address(0), "Token does not exist");
        return tokenApprovals[_tokenId];
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) public {
        require(_isApprovedOrOwner(msg.sender, _tokenId), "Not authorized");
        require(owners[_tokenId] == _from, "Not the token owner");
        require(_to != address(0), "Invalid address");
        _approve(address(0), _tokenId);
        balances[_from] -= 1;
        balances[_to] += 1;
        owners[_tokenId] = _to;

        emit Transfer(_from, _to, _tokenId);
    }

    function mint() public {
        require(totalSupply < MAX_SUPPLY, "Max supply reached");

        uint256 tokenId = totalSupply + 1;
        balances[msg.sender] += 1;
        owners[tokenId] = msg.sender;
        totalSupply += 1;

        emit Transfer(address(0), msg.sender, tokenId);
    }

    function _approve(address _to, uint256 _tokenId) internal {
        tokenApprovals[_tokenId] = _to;
        emit Approval(owners[_tokenId], _to, _tokenId);
    }

    function _isApprovedOrOwner(
        address _spender,
        uint256 _tokenId
    ) internal view returns (bool) {
        address owner = owners[_tokenId];
        return (_spender == owner || getApproved(_tokenId) == _spender);
    }


    // from gpt
    function toString(uint256 _value) internal pure returns (string memory) {
        if (_value == 0) {
            return "0";
        }
        uint256 temp = _value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(_value % 10)));
            _value /= 10;
        }
        return string(buffer);
    }
}
