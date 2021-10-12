pragma solidity ^0.6.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";

contract MyContract is BaseRelayRecipient {
 
    
    
    IERC20  LINK;
  
    
    constructor(address token,address _trustedForwarder) public {
             LINK = IERC20(token);
             trustedForwarder = _trustedForwarder;
    }
    
    
    function transfertip(address to_, uint256 amount_) public {
        
        LINK.transferFrom(_msgSender(),to_, amount_);
    }
  
    function versionRecipient() external view override returns (string memory) {
        return "1";
    }
    
}
