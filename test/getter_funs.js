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
  			VAR teststock = KONE;

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
  			VAR teststock = ATRIA;
  			VAR sellq  = 40; 

  			if STOCK_VALUE(teststock) < 7.70
  				return;
  			endif
  			
  			if STOCK_VALUE(teststock) == 7.75
  				SELL_ALL_OF(teststock);
  			endif

  			if STOCK_VALUE(NOKIA) > 5.99
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


});