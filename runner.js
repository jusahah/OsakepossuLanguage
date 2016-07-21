var Promise = require('bluebird');
var _ = require('lodash');

function TooSoonStockUpdate() {}
TooSoonStockUpdate.prototype = new Error();

var lastStockUpdate = Date.now() - 3600 * 1000;
function receiveStockUpdate(stockData) {
	var now = Date.now();
	// Check if its not been hour since last update
	if (lastStockUpdate > (now - 3595 * 1000)) {
		// Something is very wrong.
		throw new TooSoonStockUpdate();
	}

	lastStockUpdate = now;

	// Start runner for doing the full update of all pigs
	return getAllPigs(now)
	.map(updatePig)
	.each(sendBackToDBServer);

}

function getAllPigs(timestamp) {
	// REAL: Do HTTP call to pig database server
	return Promise.resolve(['pig1', 'pig2', 'pig3']);
}

function updatePig(pig) {
	// REAL: Come up with actions/commands for each pig and return them
	return Promise.resolve(pig + "_updated");
}

function sendBackToDBServer(updatedPig) {
	// REAL: Send actions/commands back to database serveer
	// which then saves them in event sourcing fashion
	console.log("PIG: " + updatedPig);
}

receiveStockUpdate({});