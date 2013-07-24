exports.push = function (request, response) {
	console.log(request.params.payload);
	var exec = require('child_process').exec;
	var puts = function(error, stdout, stderr) { console.log(stdout); }
	exec('sh update.sh', '/root', puts);
}