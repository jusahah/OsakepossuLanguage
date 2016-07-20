var PEG = require("pegjs");
var fs = require('fs');
var _ = require('lodash');

var grammar = fs.readFileSync('./testgrammar.txt', "utf8");
var code = fs.readFileSync('./code.txt', 'utf8');

var parser = PEG.buildParser(grammar);

var tree = parser.parse(code);



console.log(JSON.stringify(tree, null, 2));


function pruneNulls(tree) {

	return _.compact(_.map(tree, function(node) {
		if (!Array.isArray(node)) {
			return node;
		}

		return _.compact(pruneNulls(node));
	}));
}

