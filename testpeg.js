// Util deps
var PEG = require("pegjs");
var fs = require('fs');
var _ = require('lodash');

// Domain deps
var executorConstructor = require('./executor');
var externalFuns = require('./externalFuns');
var stockData = require('./testdata/stock1');
var account   = require('./testdata/account1');

var grammar = fs.readFileSync('./testgrammar.txt', "utf8");
var code = fs.readFileSync('./code2.txt', 'utf8');


var parser = PEG.buildParser(grammar);

var tree = parser.parse(`
  			if INBETWEEN(33, 32, 34)
  				BUY_QUANTITY(5, NOKIA);
  				SELL_ALL_OF(NOKIA);
  			endif

  			if 6 > 5
  				BAIL;
  			endif 

`);

var tree2 = parser.parse(`
	if 0 == 0
		BAIL;
	endif 
`);

console.log(JSON.stringify(tree2, null, 2));

console.log("------")
console.log("---------------------");
console.log("------")


var commands = executorConstructor(stockData).getCommands(account, tree, externalFuns);	
console.log(commands);

// Decorate with actual prices
var changesToPortfolio = resolveChanges(commands, stockData, account);
console.log(changesToPortfolio);


function resolveChanges(commands, stockData, account) {
	// Note that we could perhaps do some analysis of the commands obj
	// For example, if there is BAIL (=sell all) cmd at the end, there is no point
	// buying any stocks at the beginning. We would simply be buying and selling
	// back to back at the same price.

	// var trimmedCommands = trimObsoleteCommands(commands);

	console.log("//////////////// RESOLVE CHANGES TO PORTFOLI //////////////////")

	return _.map(commands, function(command) {
		// Note that account will be modified during this craziness
		console.log("ACTION to be transformed: " + command.action)
		console.log("Account cash now: " + account.cash)
		var res = transformCommandIntoPortfolioEvents(command, stockData, account);
		console.log("Account cash after: " + account.cash)
		console.log("-----")
		console.log("-----")		
		return res;
	})
}

// Transforms single command 
function transformCommandIntoPortfolioEvents(command, stockData, account) {

	// List of actions (as a reminder)
	/*
	/ "BUY_QUANTITY" a:amountstockclause 
	{
		return {nodeType: 'STAT',action: 'BUY_QUANTITY', args: [a.amount, a.stock]}
	}

	/ "BUY_PERCENTAGE" a:amountstockclause 
	{
		return {nodeType: 'STAT',action: 'BUY_PERCENTAGE', args: [a.amount, a.stock]}
	}

	/ "SELL_QUANTITY" a:amountstockclause 
	{
		return {nodeType: 'STAT',action: 'SELL_QUANTITY', args: [a.amount, a.stock]}
	}

	/ "SELL_ALL_OF" s:stockclause 
	{
		return {nodeType: 'STAT',action: 'SELL_ALL_OF', args: [s]}
	}

	/ "BAIL"
	{
		return {nodeType: 'STAT',action: 'BAIL', args: []}
	}
	*/

	if (command.action === 'BAIL') {
		console.log("Account stocks in BAIL")
		console.log(account.stocks);
		// We need to sell all stocks at the current price.
		// BAILs are transformed into SELL_QUANTITYs by plugging in amount

		// We have map over a copy of stocks as we mutate the original along the way
		return _.map(_.slice(account.stocks), function(stockHolding) {

			console.log("Stock holding in BAIL");
			console.log(stockHolding);
			
			var stockname = stockHolding.name;
			var amount    = stockHolding.amount;
			var price     = stockData[stockname].current;

			// So we get price * amount euros to our cash balance
			updateStockHolding(account, stockname, 0);
			addToAccountCash(account, price*amount);
			return {
				event: 'SELL_QUANTITY',
				price: price,
				amount: amount,
				cashvalue: price * amount,
				stock: stockname
			}
		});
	}
	else if (command.action === 'SELL_ALL_OF') {


		var stockname = command.args[0];
		var currentHolding = findStockHoldingFromPortfolio(stockname, account.stocks);
		var price = stockData[stockname].current;
		// If does not own any, return null which be filtered out later
		// Consider perhaps logging this
		if (!currentHolding) return null;

		var amount = currentHolding.amount;
		updateStockHolding(account, stockname, 0);
		addToAccountCash(account, price*amount);
		return {
			event: 'SELL_QUANTITY',
			price: price,
			amount: amount,
			cashvalue: price * amount,
			stock: stockname
		}
	} 
	else if (command.action === 'SELL_QUANTITY') {
	
		var sellAmount = command.args[0];		
		var stockname = command.args[1];
		var currentHolding = findStockHoldingFromPortfolio(stockname, account.stocks);

		var price = stockData[stockname].current;
		if (!currentHolding) return null;

		var amount = currentHolding.amount;
		var stocksleft = amount - sellAmount;

		if (amount < sellAmount) {
			sellAmount = amount;
			stocksleft = 0;
		}
		updateStockHolding(account, stockname, stocksleft);
		addToAccountCash(account, price*sellAmount);
		return {
			event: 'SELL_QUANTITY',
			price: price,
			amount: sellAmount,
			cashvalue: price * sellAmount,
			stock: stockname
		}
	}
	else if (command.action === 'BUY_QUANTITY') {

		

		var buyAmount = command.args[0];		
		var stockname = command.args[1];
		var currentHolding = findStockHoldingFromPortfolio(stockname, account.stocks);

		var price = stockData[stockname].current;

		var neededSum = price * buyAmount;
		// Buy does NOT go through if too little cash and
		// buyAmount is NOT floored to number where cash would be enough.
		if (!subtractFromAccountCash(account, neededSum)) {
			// Not enough money, account was not substracted
			return null;
		}
		// Update portfolio by adding stock papers to this stock
		var newAmount;
		if (currentHolding) {
			// Already owned some papers of this stock
			newAmount = currentHolding.amount + buyAmount;
		} else {
			newAmount = buyAmount;
		}
		
		updateStockHolding(account, stockname, newAmount);
		return {
			event: 'BUY_QUANTITY',
			price: price,
			amount: buyAmount,
			cashvalue: price * buyAmount,
			stock: stockname
		}
	}	
	else {
		// Other actions not supported, add here
		console.log("Unknown action in cmd transformation: " + command.action);
		return null;
	}
}

function findStockHoldingFromPortfolio(stockname, portfolio) {
	return _.find(portfolio, function(stockHolding) {
		return stockHolding.name === stockname;
	});
}


function addToAccountCash(account, cash) {
	account.cash = account.cash + cash;
	return true;
}

function subtractFromAccountCash(account, cash) {
	if (account.cash < cash) return false;
	account.cash = account.cash - cash;
	return true;
}

function updateStockHolding(account, stockname, newAmount) {
	var stocks = account.stocks;
	if (newAmount === 0) {
		// Remove the stock from holdings array altogether
		return _.remove(stocks, function(stock) {
			return stock.name === stockname;
		})
	}
	// Find the holding and update amount 
	var holding = _.find(stocks, function(stock) {
		return stock.name === stockname;
	});

	if (holding) {
		// Update the amount
		holding.amount = newAmount;
	} else {
		// Not owning any papers yet
		stocks.push({
			name: stockname,
			amount: newAmount
		});
		console.log("Stocks now");
		console.log(stocks);
	}

	
}





