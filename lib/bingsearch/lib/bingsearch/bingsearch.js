//Author: Raymond Camden
//Courtesy of http://www.raymondcamden.com/index.cfm/2013/8/27/Another-Node-Experiment-AndKittens

var https = require('https');
var qs = require('querystring');

BingSearch = function(key) {
  this.key = key;
}

BingSearch.prototype.search = function(s,cb) {

	var result = {success:false};
	//console.log("Bing Search for "+s);
	var options = {
		hostname:"api.datamarket.azure.com",
		path:"/Bing/Search/Web?Query=%27" + qs.escape(s) + "%27&Adult=%27Off%27&$format=json&$top=1000&WebFileType=%27FEED%27",
		method:"GET",
		auth:":"+this.key,
		rejectUnauthorized:false
	}

	https.get(options, function(res) {
		//console.log("Got response: " + res.statusCode);
		var body = "";

		res.on('data', function (chunk) {
			body += chunk;
		});

		res.on('end', function() {
			result.success = true;
			var data = JSON.parse(body);
			result.data = data.d.results;
			cb(result);
		});

	}).on('error', function(e) {
		console.log("Got error: " + e.message);
		cb(result);
	});

}

exports.BingSearch = BingSearch;