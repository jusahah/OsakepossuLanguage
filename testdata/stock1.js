var _ = require('lodash');

module.exports = {
	'NOKIA': {
		current: 36.71,
		today: [36.71, 36.65, 36.61, 36.97, 36.88],
		history: generateHistoryValues(36.71, 40)
	},
	'ELISA': {
		current: 6.71,
		today: [6.71, 6.65, 6.61, 6.97, 6.88],
		history: generateHistoryValues(6.71, 40)
	}	
}

function generateHistoryValues(startVal, count) {
	return _.times(count, function() {
		var movement = (Math.random() - Math.random()) * 1; // Max movement is 1 euro 
		startVal = Math.round((startVal + movement) * 100) / 100;
		return startVal;
	});
}