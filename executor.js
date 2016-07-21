var _ = require('lodash');

module.exports = function(stockData) {

	var getCommands = function(account, rules, externalFuns) {
		executeRules(stockData, account, rules, externalFuns);
	}

	return {

		getCommands: getCommands
	}
}

// Return expression
function ReturnExpression() {}
ReturnExpression.prototype = new Error();

// Execution errors
function IfClauseExpected() {}
IfClauseExpected.prototype = new Error();

var getterFuns = {
	VALUE_AT_DATE: function(stock, bindings) {

	},
	LAST_WEEK_CHANGE: function(args, bindings) {
		console.log("STOCK IS (LAST_WEEK_CHANGE): " + args[0]);
		var stock = args[0];
		console.log("Last week change for: " + stock);
		return 63.12;
	},
	LAST_MONTH_CHANGE: function(args, bindings) {
		console.log("STOCK IS (LAST_MONTH_CHANGE): " + args[0]);
		var stock = args[0];
		console.log("Last week change for: " + stock);
		return 63.12;
	},	
	EXTERNAL: function(args, bindings) {
		console.log("ARGS FOR (EXTERNAL): " + JSON.stringify(args));
		// Make external call
		// How do this correctly?
		// We must do it in sync but thats not a problem as this is run in AWS Lambda anyway
		// Then if the result comes back from wire, we just replace it to expression
		// If it does not come (within timeout), we bail from the ifClause and move to next one!
		// Also log info that external call failed
		var name = args[0];

		if (_.has(bindings.externalFuns, name)) {
			// Okay here we go
			var extF = bindings.externalFuns[name];
			return extF(args); // Must be SYNC!
		}

		throw "No external function present: " + name;

	},
	RANDOM_STOCK: function() {
		// Do a lottery here of all stocks
		return 'NOKIA'; // For testing
	}
}

function executeRules(stockData, account, rules, externalFuns) {

	console.log("Starting to execute rules");

	var aliases = rules.declarations || {};

	var code = rules.code;

	var bindings = {
		aliases: aliases,
		collectedActions: [],
		stockData: stockData,
		account: account,
		externalFuns: externalFuns
	}
	// Code contains zero or more ifClauses!
	// For now, there are no other nodes possible
	_.forEach(code, function(ifClause) {
		try {
			executeIf(ifClause, bindings);
		} catch (e) {
			if (e instanceof ReturnExpression) {
				return false; // Explicitly stops forEach iteration!
			} else {
				throw e; // Logical error or smth, we don't know how to handle it.

			}
		}
	});
	console.log("Collected actions when done");
	console.log(bindings.collectedActions);

	return bindings.collectedActions;
}

function executeIf(ifClause, bindings) {
	if (ifClause.controlFlow !== 'IF') throw new IfClauseExpected();

	console.log("Execute if");

	if (processComparisonOperation(ifClause.clause1, ifClause.comparison, ifClause.clause2, bindings)) {
		// If expression was true, run the expression
		console.log("Comparison true!");
		processIfBody(ifClause.bodyIfTrue, bindings);		
	}
}

function processIfBody(ifBody, bindings) {
	console.log("Processing if body");
	if (ifBody.nodeType === 'STAT_LIST') {
		processStatements(ifBody.statements, bindings);
	}
}

function processStatements(statements, bindings) {
	_.forEach(statements, function(statement) {
		console.log("Processing single statement: " + statement.nodeType);
		if (statement.nodeType === 'STAT') {

			staticCheckOfArgs(statement.action, statement.args); // Throws "InvalidArgs";

			var evalledArgs = _.map(statement.args, function(statArg) {
				return processExpression(statArg, bindings);
			});
			
			bindings.collectedActions.push({action: statement.action, args: evalledArgs});
		} else if (statement.nodeType === 'CONTROL') {
			if (statement.controlFlow === 'RETURN') {
				throw new ReturnExpression(); // Finish AST walk
			}
		}
	});
}

function staticCheckOfArgs(actionName, actionArgs) {
	return true; // Disabled for now
}

function processComparisonOperation(c1, comp, c2, bindings) {
	console.log("process Comparison");

	var c1Val = processExpression(c1, bindings);
	var c2Val = processExpression(c2, bindings);

	console.log("c1: " + c1Val)
	console.log("c2: " + c2Val)

	if (comp.value === '==') return c1Val == c2Val;
	if (comp.value === '<') return c1Val < c2Val;
	if (comp.value === '<=') return c1Val <= c2Val;
	if (comp.value === '>') return c1Val > c2Val;
	if (comp.value === '>=') return c1Val >= c2Val;

	throw "Comparison not matched: " + comp.value;

}

function processExpression(expr, bindings) {
	console.log("process Expression: " + expr.nodeType);


	// Literal matching
	if (expr.nodeType === 'LITERAL') {
		if (expr.valueType === 'INT') return expr.value;
		if (expr.valueType === 'STRING') return processString(expr.value, bindings);
		if (expr.valueType === 'DATE') return processDate(expr.value, bindings);
	} 
	// Getter vars
	else if (expr.nodeType === 'GETTER') {
		return processGetter(expr.valueType, bindings);
	}
	// Getter funs
	else if (expr.nodeType === 'GETTER_FUN') {
		return processGetterFun(expr.getter, expr, bindings);
	}
	// Math expression
	else if (expr.nodeType === 'MATH_EXPR') {
		var leftSide = processExpression(expr.expr.e1, bindings);
		var rightSide = processExpression(expr.expr.e2, bindings);

		if (expr.expr.op === 'PLUS') {
			return leftSide + rightSide;
		} 
		else if (expr.expr.op === 'MINUS') {
			return leftSide - rightSide;
		}
	}

	throw "Unmatched expression: " + JSON.stringify(expr);
}

function processString(s, bindings) {
	console.log("process String: " + s);

	// s is either stock name or declared variable name
	if (isStock(s, bindings)) {
		return s;
	} 
	else if (isDeclaredVar(s, bindings)) {
		return processExpression(getDeclaredVarValue(s, bindings), bindings);
	}
	else {
		// We assume its just normal string going to external serv perhaps
		return s;
	}
}

function isStock(s, bindings) {
	return _.has(bindings.stockData, s);
}

function isDeclaredVar(s, bindings) {
	return _.has(bindings.aliases, s);
}

function getDeclaredVarValue(s, bindings) {
	return bindings.aliases[s];
}

function processGetter(getterName, bindings) {
	console.log("process Getter: " + getterName);
	console.log(bindings.account);
	return bindings.account[getterName];
}

function processGetterFun(getterFunName, expr, bindings) {
	console.log("process Getter_fun: " + getterFunName);
	console.log("First arg: " + JSON.stringify(expr));
	var f = getterFuns[getterFunName];

	var evalledArgs = _.map(expr.args, function(funarg) {
		return processExpression(funarg, bindings);
	});
	return f(evalledArgs, bindings);

}