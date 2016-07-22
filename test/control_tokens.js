var assert = require('chai').assert;
var fs = require('fs');

var PEG = require("pegjs");
var grammar = fs.readFileSync(__dirname + '/../testgrammar.txt', "utf8");
var parser = PEG.buildParser(grammar);

var executorConstructor = require(__dirname + '/../executor');
var externalFuns = require(__dirname + '/../externalFuns');

describe('Control tokens', function() {
	
  describe('RETURN', function() {
  	it('should parse and execute correctly', function() {

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
  			if 11 > 10
				noop;
			endif 

  			if 10 == 10
				noop;
				return;
			endif 

  			if 10 < 20
				noop;
			endif 			
  		`
  		);

  		// Should produce two NOOPs as third clause is never run
  		var commands = executor.getCommands(account, tree, externalFuns);
  		console.log(commands);

  		assert.deepEqual([
  			{ action: 'NOOP', args: [] } ,
  			{ action: 'NOOP', args: [] } 
  		], commands);

  	});

  });

  describe('Variable declarations', function() {
  	it('should parse and execute correctly', function() {

  		var executor = executorConstructor({
  			NOKIA: {
  				current: 8.00,
  				today: [6.00, 7.00, 7.00, 8.00] // +14.28%
  			},

  		});

  		// Set the account
  		var account = {
  			TOTAL_BALANCE: 150
  		};

  		// Set the rules
  		var tree = parser.parse(
  		`
  			var a = 10;
  			var b = TOTAL_BALANCE;
  			var c = STOCK_VALUE(NOKIA);
  			var d = a + 10;

  			if a == 10
				noop;
			endif 

  			if INBETWEEN(a, c, b) 
				BAIL;
			endif 

  			if STOCK_VALUE(NOKIA) < (c - 1)
  				SELL_ALL_OF(NOKIA);
				return;
			endif 	

			if (b + c) == (c + b)
				noop;
			endif 

			if d == 20
				noop;
			endif 					
  		`
  		);

  		// Should produce two NOOPs as third clause is never run
  		var commands = executor.getCommands(account, tree, externalFuns);
  		console.log(commands);

  		assert.deepEqual([
  			{ action: 'NOOP', args: [] } ,
  			{ action: 'BAIL', args: [] } ,
  			{ action: 'NOOP', args: [] } ,
  			{ action: 'NOOP', args: [] } 
  		], commands);

  	});

  });

  describe('ALWAYS control token', function() {
  	it('should parse and execute correctly', function() {

  		var executor = executorConstructor({
  			NOKIA: {
  				current: 8.00,
  				today: [6.00, 7.00, 7.00, 8.00] // +14.28%
  			},

  		});

  		// Set the account
  		var account = {
  			TOTAL_BALANCE: 150
  		};

  		// Set the rules
  		var tree = parser.parse(
  		`
  			var a = 10;
  			var b = HUHTAMAKI;

			always BAIL;
			always BUY_QUANTITY(a, b);	

			if a == 11
				return;
			endif

			if a == 10
				noop;
				return;
				noop;
			endif				
  		`
  		);

  		// Should produce two NOOPs as third clause is never run
  		var commands = executor.getCommands(account, tree, externalFuns);
  		console.log(commands);

  		assert.deepEqual([
  			{ action: 'BAIL', args: [] } ,
  			{ action: 'BUY_QUANTITY', args: [10, 'HUHTAMAKI'] } ,
  			{ action: 'NOOP', args: [] } 
  		], commands);

  	});

  });


});