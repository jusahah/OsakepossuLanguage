var Parser = require("jison").Parser;
function test() {return 7;}

// a grammar in JSON
var grammar = {
    "lex": {
        "rules": [
           ["\\s+", "/* skip whitespace */"],
           ["if\\b", "return 'IF';"],
           ["[a-z]+\\b", "return 'STAT';"],
           ["[A-Z]+\\b", "return 'STOCK';"],
           ["[0-9]+\\b", "return 'NUMBER';"],

        ]
    },
    "tokens": "STOCK STAT NUMBER IF",
    "start": "IfClause",
    "bnf": {
    	"IfClause": [["IF STOCK", "$$ = test();"]]
    }
};

// `grammar` can also be a string that uses jison's grammar format
var parser = new Parser(grammar);

// generate source, ready to be written to disk
var parserSource = parser.generate();

// you can also use the parser directly from memory

// returns true
console.log(parser.parse("if NOKIA"));

