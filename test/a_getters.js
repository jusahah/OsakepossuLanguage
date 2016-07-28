var assert = require('chai').assert;
var fs = require('fs');

var PEG = require("pegjs");
var grammar = fs.readFileSync(__dirname + '/../testgrammar.txt', "utf8");
var parser = PEG.buildParser(grammar);

var executorConstructor = require(__dirname + '/../executor');
var externalFuns = require(__dirname + '/../externalFuns');

describe('Getter variables', function() {
	
  describe('TOTAL_BALANCE', function() {
  	it('should parse and execute successfully', function() {
  		// Set the stockData
  		var executor = executorConstructor({
  			NOKIA: [1,1,1,1,1,1,1],
  			ELISA: [2,2,2,2,2,2,2]
  		});

  		// Set the account
  		var account = {
  			TOTAL_BALANCE: 15
  			// Rest are irrelevant for this test
  		};

  		// Set the rules
  		var tree = parser.parse(
  		`
  			if TOTAL_BALANCE > 10
				BAIL;
			endif 

  			if TOTAL_BALANCE == 10
				BUY_PERCENTAGE(20, ELISA);
			endif 

  			if TOTAL_BALANCE < 20
				SELL_ALL_OF(NOKIA);
			endif 			
  		`
  		);

  		var commands = executor.getCommands(account, tree, externalFuns);

  		assert.equal(2, commands.length);
  		assert.equal('BAIL', commands[0].action);
  		assert.equal('SELL_ALL_OF', commands[1].action);
  		assert.deepEqual(['NOKIA'], commands[1].args);


  	});
  });

  describe('STOCK_BALANCE', function() {
  	it('should parse and execute successfully', function() {
  		// Set the stockData
  		var executor = executorConstructor({
  			NOKIA: [1,1,1,1,1,1,1],
  			ELISA: [2,2,2,2,2,2,2]
  		});

  		// Set the account
  		var account = {
  			STOCK_BALANCE: 15
  			// Rest are irrelevant for this test
  		};

  		// Set the rules
  		var tree = parser.parse(
  		`

  			if STOCK_BALANCE >= 10
				BAIL;
			endif 

  			if STOCK_BALANCE === (20 - 5)
				BUY_PERCENTAGE(20, ELISA);
			endif 

  			if STOCK_BALANCE == STOCK_BALANCE
				SELL_ALL_OF(ATRIA);
				return;
			endif 

  			if STOCK_BALANCE >= 10
				BAIL;
			endif 						
  		`
  		);

  		// ALL RULES EXCEPT LAST SHOULD BE PRESENT

  		var commands = executor.getCommands(account, tree, externalFuns);

  		assert.equal(3, commands.length);
  		assert.equal('BAIL', commands[0].action);
  		assert.equal('BUY_PERCENTAGE', commands[1].action);
  		assert.deepEqual([20, 'ELISA'], commands[1].args);
  		assert.equal('SELL_ALL_OF', commands[2].action);
  		assert.deepEqual(['ATRIA'], commands[2].args);

  	});
  });

  describe('CASH_BALANCE', function() {
  	it('should parse and execute successfully', function() {
  		// Set the stockData
  		var executor = executorConstructor({
  			NOKIA: [1,1,1,1,1,1,1],
  			ELISA: [2,2,2,2,2,2,2]
  		});

  		// Set the account
  		var account = {
  			CASH_BALANCE: 15,
  			TOTAL_BALANCE: 30,
  			STOCK_BALANCE: 15
  			// Rest are irrelevant for this test
  		};

  		// Set the rules
  		var tree = parser.parse(
  		`
  			var tosell = ATRIA;

  			if CASH_BALANCE >= 10
				SELL_QUANTITY(5, tosell);
			endif 

  			if CASH_BALANCE === TOTAL_BALANCE
				BAIL;
				return;
			endif 

  			if CASH_BALANCE == STOCK_BALANCE
				SELL_ALL_OF(tosell);
				SELL_ALL_OF(NOKIA);
			endif 

  			if CASH_BALANCE >= 10
				BAIL;
			endif 						
  		`
  		);

  		// ALL RULES EXCEPT LAST SHOULD BE PRESENT

  		var commands = executor.getCommands(account, tree, externalFuns);
  		// Copy from terminal and paste here
      console.log(commands);
  		assert.deepEqual(
  			[ 
  			  { action: 'SELL_QUANTITY', args: [ 5, 'ATRIA' ] },
			  { action: 'SELL_ALL_OF', args: [ 'ATRIA' ] },
			  { action: 'SELL_ALL_OF', args: [ 'NOKIA' ] },
			  { action: 'BAIL', args: [] } 
  			], 
  		commands);

  	});
  });
});