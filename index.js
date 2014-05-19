#! /usr/bin/env node

var request = require("request");
var exec = require("child_process").exec;
var colors = require("colors");
var b = require("./lib/bingsearch");
var settings = require('./config.json');


var bingsearch = new BingSearch(settings.bing_api_key);

var prompts = ['Seed Keywords (Comma-Delimited)'];
var mode = 'create';
var existing_files = [];
var feeds_to_write = [];

function checkExistingFiles(callback) {
	var valid_files = [];
	exec("ls", function(error, stdout, stderr) {
		var fileArray = [];
		fileArray = stdout.replace( /\n/g, " " ).split( " " );
		fileArray.forEach(function(file) {
			if (file !== null && file.substr(file.length-4) == '.txt' || file.substr(file.length-5) == '.json') {
				if (file !== "package.json") {

					valid_files.push(file);
				}
			}
		});

		callback(null, valid_files);
	});
}

console.log('RSS' .yellow);
console.log('STACKER' .blue);

checkExistingFiles(function(err, files) {
	existing_files = files;
	if (files.length > 0) {
		prompts.push('Existing files detected - [A]ppend to a file or [C]reate new? A/C');
	} else {
		prompts.push('Destination File Name');
	}
});

function completer(line) {
  var completions = existing_files;
  var hits = completions.filter(function(c) { return c.indexOf(line) == 0 })
  // show all completions if none found
  return [hits.length ? hits : completions, line]
}

var rl = require("readline").createInterface(
	process.stdin, process.stdout, completer
	),
	prompts = prompts,
	p = 0,
	data = {},
	extracted_links = []
;


var get = function() {
	if (!settings.bing_api_key) {
	console.log('You must supply a bing API key in your config.json' .red);
	console.log('Please see https://datamarket.azure.com/dataset/5BA839F1-12CE-4CCE-BF57-A49D98D29A44' .red);
	process.exit();
}
	rl.setPrompt(prompts[p] + ': ');
	rl.prompt();

	p++
};

get();

rl.on('line', function(line) {

	line = line.toLowerCase().trim();

	if (line == "a") {

		mode = 'append';
		prompts.push('Select the File To Append to');
	}

	if (line == "c") {

		mode = 'create';
		prompts.push('Destination File Name');

	}

	if (line.substr(line.length-4) === '.txt' || line.substr(line.length-5) === '.json') {

		console.log('Appending new feeds to ' + line);

		data['Destination File Name'] = line;
		mode = 'append';

		return rl.close();
	}

	data[prompts[p - 1]] = line;

	if (p === prompts.length) {
		return rl.close();
	}

get();

}).on('close', function() {

	console.log('Please Stand By...');

	queryBing();

});

var queryBing = function() {
	bingsearch.search(data['Seed Keywords (Comma-Delimited)'], function(results) {
		results.data.forEach(function(result) {
			feeds_to_write.push(result.Url);
		});
		writeLinks();
	});
};

var writeLinks = function() {

	var target_file = data['Destination File Name'].substr(data['Destination File Name'].length -4) === '.txt' ?
					  data['Destination File Name'] :
					  data['Destination File Name'] + '.txt';

	console.log('target file is: ' + target_file);

 	if (mode == 'append') {
 		require('fs').appendFileSync(target_file, (feeds_to_write.join("\n")));

 	} else if (mode == 'create') {
 		require('fs').writeFileSync(target_file, (feeds_to_write.join("\n")));
 	}

	console.log('Success! Your feed links are now available in: %s' .green, target_file .rainbow);
	var count_command = "wc -l " + target_file;
	exec(count_command, function(error, stdout, stderr) {

		var numLinesRegex = /\d+/;
		var lineCount = stdout.match(numLinesRegex);
		var numLines = parseInt(lineCount[0]);
		var finalCount = numLines + 1;

		console.log(target_file + ' now contains %s feeds' .yellow, finalCount);

	});

}
