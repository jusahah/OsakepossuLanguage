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
  				return;
  			endif

  			if 6 > 5
  				BAIL;
  			endif 

`);

console.log(JSON.stringify(tree, null, 2));

console.log("------")
console.log("---------------------");
console.log("------")


//var commands = executorConstructor(stockData).getCommands(account, tree, externalFuns);	

//console.log(commands);






