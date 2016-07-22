// Misc tests here that don't fit elsewhere naturally

var assert = require('chai').assert;
var fs = require('fs');
var _ = require('bluebird');

var PEG = require("pegjs");
var grammar = fs.readFileSync(__dirname + '/../testgrammar.txt', "utf8");
var parser = PEG.buildParser(grammar);

var executorConstructor = require(__dirname + '/../executor');
var externalFuns = require(__dirname + '/../externalFuns');

describe('Misc tests', function() {
	
  describe('Plus-minus expressions', function() {
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
  			var a = 1.0 - 1;
  			var lowb = -0.3 + 0.2;
  			var highb = 0.3 - 0.01;

  			if (9 + 2) > (12 - 2)
				noop;
			endif 

  			if 15 - 7 == 10 - 2 - 0
				BUY_PERCENTAGE(50, ELISA);
			endif 

  			if INBETWEEN(a, lowb, highb)
				noop;
				return;
			endif 			
  		`
  		);

  		var commands = executor.getCommands(account, tree, externalFuns);
  		console.log(commands)
  		assert.deepEqual([
  			{ action: 'NOOP', args: [] } ,
  			{ action: 'BUY_PERCENTAGE', args: [50, 'ELISA'] } ,
  			{ action: 'NOOP', args: [] } 
  		], commands);


  	});
  });

  describe('Mul-div expressions', function() {
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
  			var a = 1.0 * 3 / 1.0;
  			var testb = 0.001 / 0.1;
  			var lowb = -0.3 * 0.2;
  			var highb = 0.3 * 0.1;

  			if (3 * 2) == (12 / 2)
				noop;
			endif 

  			if (3 * 15 / 5) == (3*2 * 1.5)
				BUY_PERCENTAGE(a, ELISA);
			endif 

  			if INBETWEEN(testb, lowb, highb)
				noop;
			endif 	

			if (a + a + a * a) < 0 * a
				noop;
			endif		
  		`
  		);

  		var commands = executor.getCommands(account, tree, externalFuns);
  		console.log(commands)
  		assert.deepEqual([
  			{ action: 'NOOP', args: [] } ,
  			{ action: 'BUY_PERCENTAGE', args: [3, 'ELISA'] } ,
  			{ action: 'NOOP', args: [] } 
  		], commands);


  	});
  });

});


