var spawnSync = require('child_process').spawnSync;
var fs = require('fs');

module.exports = {
	ulkolampotila: function(args) {
		// 
		var inputObj =  {
			name: 'ulkolampotila',
			args2: args
		};

		var inputString = JSON.stringify(inputObj);
		var res = spawnSync(process.execPath, [require.resolve('./externalWorker')], { input: inputString});

		if (res.status !== 0) {
			throw new Error(res.stderr.toString());
		}

		if (res.error) {
			if (typeof res.error === 'string') res.error = new Error(res.error);
    		throw res.error;
		}

		// All is fine
		var response = JSON.parse(res.stdout);

		console.log("RES BACK FROM SPAWNSYNC: " + JSON.stringify(response));


		return response.value;
	}
}