// Getter functions tests here
var assert = require('chai').assert;
var fs = require('fs');

var PEG = require("pegjs");
var grammar = fs.readFileSync(__dirname + '/../testgrammar.txt', "utf8");
var parser = PEG.buildParser(grammar);

var executorConstructor = require(__dirname + '/../executor');
var externalFuns = require(__dirname + '/../externalFuns');

describe('Getter funs', function() {

  describe('HAS_STOCK', function() {
  	it('should parse and execute successfully', function() {
  		// Set the stockData
  		var executor = executorConstructor({});

  		// Set the account
  		var account = {
  			portfolio: [
  				{
  					stock: 'NOKIA',
  					amount: 10
  				},
  				{
  					stock: 'ATRIA',
  					amount: 150
  				},
  				{
  					stock: 'KONE',
  					amount: 50
  				}
  			]
  		};

  		// Set the rules
  		var tree = parser.parse(
  		`
  			var teststock = KONE;

  			if HAS_STOCK(NOKIA) == 1
  				SELL_ALL_OF(NOKIA);
  			endif
  			
  			if HAS_STOCK(teststock) == 1
  				SELL_ALL_OF(teststock);
  			endif

  			if HAS_STOCK(HUHTAMAKI) === 1
  				SELL_ALL_OF(HUHTAMAKI);
  			endif
  		`
  		);
  		console.log("RUNNING HAS_STOCK");
  		var commands = executor.getCommands(account, tree, externalFuns);
  		console.log(commands);

  		assert.deepEqual(
  		[ 
  			{ action: 'SELL_ALL_OF', args: [ 'NOKIA' ] },
		  	{ action: 'SELL_ALL_OF', args: [ 'KONE' ] } 
		]
		, commands);


  	});
  });

  describe('STOCK_VALUE', function() {
  	it('should parse and execute successfully', function() {
  		// Set the stockData
  		var executor = executorConstructor({
  			NOKIA: {
  				current: 6.00
  			},
  			ATRIA: {
  				current: 7.75
  			}

  		});

  		// Set the account
  		var account = {};

  		// Set the rules
  		var tree = parser.parse(
  		`
  			var teststock = ATRIA;
  			var sellq  = 40; 

  			if STOCK_VALUE(teststock) < (5.70 + 2)
  				return;
  			endif
  			
  			if STOCK_VALUE(teststock) == 7.75
  				SELL_ALL_OF(teststock);
  			endif

  			if STOCK_VALUE(NOKIA) > (6.99 - 1.01111)
  				SELL_QUANTITY(sellq, HUHTAMAKI);
  			endif
  		`
  		);
  		console.log("RUNNING STOCK_VALUE");
  		var commands = executor.getCommands(account, tree, externalFuns);
  		console.log(commands);

  		assert.deepEqual(
		[ 
			{ action: 'SELL_ALL_OF', args: [ 'ATRIA' ] },
  			{ action: 'SELL_QUANTITY', args: [ 40, 'HUHTAMAKI' ] } 
  		]
		, commands);


  	});
  });

  describe('CHANGE_LAST_HOUR', function() {
  	it('should parse and execute successfully', function() {
  		// Set the stockData
  		var executor = executorConstructor({
  			NOKIA: {
  				current: 8.00,
  				today: [6.00, 7.00, 7.00, 8.00] // +14.28%
  			},
  			ATRIA: {
  				current: 7.10,
  				today: [7.50, 7.10] // -5.33%
  			}

  		});

  		// Set the account
  		var account = {};

  		// Set the rules
  		var tree = parser.parse(
  		`
  			var teststock = ATRIA;
  			var sellq  = (40 - 7); 

  			if CHANGE_LAST_HOUR(teststock) < -7.5
  				return;
  			endif

   			if CHANGE_LAST_HOUR(teststock) > -10.000
  				SELL_ALL_OF(ELISA);
  			endif 

  			if CHANGE_LAST_HOUR(teststock) == 0
  				return;
  			endif

  			if CHANGE_LAST_HOUR(teststock) > (3 - 1)
  				return;
  			endif

  			if CHANGE_LAST_HOUR(teststock) <= -4.00
  				SELL_ALL_OF(teststock);
  			endif

  			if CHANGE_LAST_HOUR(NOKIA) < 14.0
  				BAIL;
  			endif

  			if CHANGE_LAST_HOUR(NOKIA) < -14.00
  				BAIL;
  				return;
  			endif

  			if CHANGE_LAST_HOUR(NOKIA) <= 15.00
  				SELL_QUANTITY(sellq, HUHTAMAKI);
  			endif
  		`
  		);
  		console.log("RUNNING STOCK_VALUE");
  		var commands = executor.getCommands(account, tree, externalFuns);
  		console.log("CMDS back")
  		console.log(commands);

  		assert.deepEqual(
		[ 
		  { action: 'SELL_ALL_OF', args: [ 'ELISA' ] },
		  { action: 'SELL_ALL_OF', args: [ 'ATRIA' ] },
		  { action: 'SELL_QUANTITY', args: [ 33, 'HUHTAMAKI' ] } 
  		]
		, commands);


  	});
  });


  describe('CHANGE_SINCE_MORNING', function() {
  	it('should parse and execute successfully', function() {
  		// Set the stockData
  		var executor = executorConstructor({
  			NOKIA: {
  				current: 7.50,
  				today: [6.00, 7.00, 7.00, 8.00, 7.50] // +25%
  			},
  			ATRIA: {
  				current: 7.00,
  				today: [7.50, 7.10, 7.00] // -6.66%
  			}

  		});

  		// Set the account
  		var account = {};

  		// Set the rules
  		var tree = parser.parse(
  		`
  			var teststock = ATRIA;
  			var sellq  = (40 - 6); 

  			if CHANGE_SINCE_MORNING(teststock) < -7.5
  				return;
  			endif

   			if CHANGE_SINCE_MORNING(teststock) > -6.70
  				SELL_ALL_OF(ELISA);
  			endif 

  			if CHANGE_SINCE_MORNING(teststock) == -6.6666
  				return;
  			endif

  			if CHANGE_SINCE_MORNING(teststock) > (3 - 1)
  				return;
  			endif

  			if CHANGE_SINCE_MORNING(teststock) <= 4.00
  				SELL_ALL_OF(teststock);
  			endif

  			if CHANGE_SINCE_MORNING(NOKIA) < 14.0
  				BAIL;
  			endif

  			if CHANGE_SINCE_MORNING(NOKIA) < -14.00
  				BAIL;
  				return;
  			endif

  			if CHANGE_SINCE_MORNING(NOKIA) <= 25.01
  				SELL_QUANTITY(sellq, HUHTAMAKI);
  			endif

  			if CHANGE_SINCE_MORNING(NOKIA) > (CHANGE_SINCE_MORNING(ATRIA) + 10)
  				BUY_PERCENTAGE(8, HUHTAMAKI);
  			endif

  			if CHANGE_SINCE_MORNING(NOKIA) <= CHANGE_SINCE_MORNING(ATRIA)
  				BAIL;
  			endif

  		`
  		);
  		console.log("RUNNING STOCK_VALUE");
  		var commands = executor.getCommands(account, tree, externalFuns);
  		console.log("CMDS back")
  		console.log(commands);

  		assert.deepEqual(
			[ { action: 'SELL_ALL_OF', args: [ 'ELISA' ] },
			  { action: 'SELL_ALL_OF', args: [ 'ATRIA' ] },
			  { action: 'SELL_QUANTITY', args: [ 34, 'HUHTAMAKI' ] },
			  { action: 'BUY_PERCENTAGE', args: [ 8, 'HUHTAMAKI' ] } 
			], commands
		);


  	});
  });

});