var Promise = require('bluebird');
var _ = require('lodash');

function TooSoonStockUpdate() {}
TooSoonStockUpdate.prototype = new Error();

var lastStockUpdate = Date.now() - 3600 * 1000;
function receiveStockUpdate(stockData) {
	var now = Date.now();
	if (lastStockUpdate > (now - 3595 * 1000)) {
		throw new TooSoonStockUpdate();
	}

	lastStockUpdate = now;

	// Start runner for doing the full update of all pigs
	return getAllPigs(now)
	.map(updatePig)
	.each(sendBackToDBServer);

}

function getAllPigs(timestamp) {
	return Promise.resolve(['pig1', 'pig2', 'pig3']);
}

function updatePig(pig) {
	return Promise.resolve(pig + "_updated");
}

function sendBackToDBServer(updatedPig) {
	console.log("PIG: " + updatedPig);
}



receiveStockUpdate({});