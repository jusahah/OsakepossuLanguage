var concat = require('concat-stream');
var JSON = require('json-buffer');

function respond(data) {
  process.stdout.write(JSON.stringify(data), function() {
    process.exit(0);
  });
}

process.stdin.pipe(concat(function (stdin) {
  var argsObj = JSON.parse(stdin.toString());

  // Do logic here, for example doing async http call

  setTimeout(function() {
  	respond({value: 65});
  }, 0);
}));