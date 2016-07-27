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

  describe('Run expressions', function() {
    it('should run daily / hourly', function() {
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

      /////////////////////////////////////////////////////////////
      // First part 

      // Set the rules
      var tree = parser.parse(
      `
        run hourly;

        always BAIL;

      `
      );
      // Should return as its hourly
      var commands = executor.getCommands(account, tree, externalFuns);
      console.log(commands)
      assert.deepEqual([
        { action: 'BAIL', args: [] } ,
      ], commands);

      // Should return as its hourly
      var commands1 = executor.getCommands(account, tree, externalFuns, 11);
      console.log(commands1)
      assert.deepEqual([
        { action: 'BAIL', args: [] } ,
      ], commands1);

      /////////////////////////////////////////////////////////////
      // Second part 

      var tree2 = parser.parse(
      `
        run daily;

        always BAIL;

      `
      );
      // Should be filled as it is 18.00
      var commands2 = executor.getCommands(account, tree2, externalFuns, 18);
      console.log(commands2)
      assert.deepEqual([
        { action: 'BAIL', args: [] } ,
      ], commands2);

      // Should be empty as its not 18.00
      var commands3 = executor.getCommands(account, tree2, externalFuns, 16);
      console.log(commands3)
      assert.deepEqual([
        // Empty
      ], commands3);

    });
  });
  describe('Run expressions p.2', function() {
    it('should run custom hours', function() {
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

      /////////////////////////////////////////////////////////////
      // First part 

      // Set the rules
      var tree = parser.parse(
      `
        run 10 11 12 13;

        always BAIL;

      `
      ); 
      // Should return as hour is not specified (by default means any hour is ok)
      var commands = executor.getCommands(account, tree, externalFuns);
      console.log(commands)
      assert.deepEqual([
        { action: 'BAIL', args: [] } ,
      ], commands);

      // Should return empty as hour is 14
      commands = executor.getCommands(account, tree, externalFuns, 14);
      console.log(commands)
      assert.deepEqual([
        // empty
      ], commands);

      // Should return as its 11.00
      var commands1 = executor.getCommands(account, tree, externalFuns, 11);
      console.log(commands1)
      assert.deepEqual([
        { action: 'BAIL', args: [] } ,
      ], commands1);

      /////////////////////////////////////////////////////////////
      // Second part 

      var tree2 = parser.parse(
      `
        run 12 16;

        always BAIL;

      `
      );
      // Should be filled as it is 12.00
      var commands2 = executor.getCommands(account, tree2, externalFuns, 12);
      console.log(commands2)
      assert.deepEqual([
        { action: 'BAIL', args: [] } ,
      ], commands2);

      // Should be empty as its not 12.00 or 16.00
      var commands3 = executor.getCommands(account, tree2, externalFuns, 15);
      console.log(commands3)
      assert.deepEqual([
        // Empty
      ], commands3);

    });
  });
});


