var concat = require('concat-stream');
var JSON = require('json-buffer');

function respond(data) {
  process.stdout.write(JSON.stringify(data), function() {
    process.exit(0);
  });
}

process.stdin.pipe(concat(function (stdin) {
  var argsObj = JSON.parse(stdin.toString());
  
  setTimeout(function() {
  	respond({value: 16});
  }, 2500);
}));