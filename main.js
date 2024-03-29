/** Connect to Moralis server */
const serverUrl = "https://atebq7m4ehh9.usemoralis.com:2053/server";
const appId = "HPAnXh3tlnShjJnZxky7GjKY3ApjmnJGLDDusqwy";
Moralis.start({ serverUrl, appId });

let currentTrade = {};
let currentSelectSide;
let tokens;

/** Add from here down */
async function init() {
    await Moralis.initPlugins();
    await Moralis.enable();
    await listAvailableTokens();
    currentUser = Moralis.User.current();
    if (currentUser) {
        document.getElementById("swap_button").disabled = false;
     
    }
}
//Does not work, come back later tomorrow morning
async function listAvailableTokens() {
    const result = await Moralis.Plugins.oneInch.getSupportedTokens({
        chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
        });
        tokens = result.tokens;
        let parent = document.getElementById("token_list");
        for(const address in tokens){
            let token = tokens[address];
            let div = document.createElement('div');
            div.setAttribute("data-address", address)
            div.className = "token_row";
            let html = `
            <img class="token_list_img" src="${token.logoURI}">
            <span class="token_list_text">${token.symbol}</span>
            `
            div.onclick = selectToken;
            div.innerHTML = html;
            parent.appendChild(div);
        }
}


    function selectToken(){
     closeModal();
    let address = event.target.getAttribute("data-address");
    currentTrade[currentSelectSide] = tokens[address];
    console.log(currentTrade);
    renderInterface();
    getQuote();
    

 }

 function renderInterface(){
     if(currentTrade.from) {

     
     document.getElementById("from_token_img").src = currentTrade.from.logoURI;
     document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
     }
     if(currentTrade.to){
     document.getElementById("to_token_img").src = currentTrade.to.logoURI;
     document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
     }
 }

 
 async function login() {
    let user = Moralis.User.current();
    if (!user) {
     try {
        user = await Moralis.authenticate({ signingMessage: "Hello World!" })
        console.log(user)
        console.log(user.get('ethAddress'))
        document.getElementById("swap_button").disabled = false;
     } catch(error) {
       console.log(error)
     }
    }
    
  }



function openModal(side){
    currentSelectSide = side;
    document.getElementById("token_modal").style.display = "block";
}

function closeModal(){
    document.getElementById("token_modal").style.display = "none";
}
async function getQuote(){
    if(!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;

    let amount = Number(document.getElementById("from_amount").value * 10**currentTrade.from.decimals);

    
     const quote = await Moralis.Plugins.oneInch.quote({
     chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: currentTrade.from.address, // The token you want to swap
    toTokenAddress: currentTrade.to.address, // The token you want to receive
    amount: amount,
    });
    console.log(quote);
    document.getElementById("gas_estimate").innerHTML = quote.estimatedGas;
    document.getElementById("to_amount").value = quote.toTokenAmount / (10**quote.toToken.decimals);

      
}

async function trySwap() {
    let address = Moralis.User.current().get("ethAddress");
    let amount = Number(document.getElementById("from_amount").value * 10**currentTrade.from.decimals)
    if(currentTrade.from.symbol !== "ETH"){
        
            const allowance = await Moralis.Plugins.oneInch.hasAllowance({
              chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
              fromTokenAddress: currentTrade.from.address, // The token you want to swap
              fromAddress: address, // Your wallet address
              amount: amount,
            });
            console.log(allowance);
            if(!allowance){
                    await Moralis.Plugins.oneInch.approve({
                      chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
                      tokenAddress: currentTrade.from.address, // The token you want to swap
                      fromAddress: address, // Your wallet address
                    });

            }
          }

          let receipt = await doSwap(address, amount);
          alert("Swap complete");
    }

    function doSwap(userAddress, amount) {

            return Moralis.Plugins.oneInch.swap({
              chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
              fromTokenAddress: currentTrade.from.address, // The token you want to swap
              toTokenAddress: currentTrade.to.address, // The token you want to receive
              amount: amount,
              fromAddress: userAddress, // Your wallet address
              slippage: 1,
            });
          }
    
        
    



init();

document.getElementById("from_token_select").onclick = (() => {openModal("from")});
document.getElementById("to_token_select").onclick = (() => {openModal("to")});
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_amount").onblur = getQuote;
document.getElementById("swap_button").onclick = trySwap;
document.getElementById("login_button").onclick = login;