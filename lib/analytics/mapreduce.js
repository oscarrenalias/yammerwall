var MongoModel = require('./mongomodel'),
	config = require(require('path').dirname(require.main.filename) + "/config"),
	mongo = new MongoModel(config.analytics.mongo.uri),
	RecurringTask = require('../task').RecurringTask;

function MapReduceJob(name, definition, frequency) {
	console.log("Scheduled MapReduce job: " + name + ", frequency: " + JSON.stringify(frequency));
	return(RecurringTask(function() {
		console.log("Running " + name);

		mongo.getCollection(config.analytics.mongo.collection).then(function(coll) {
			coll.mapReduce(definition.map, definition.reduce, definition.options, function(error, result) {
				if(error)
					console.error("There was an error running job " + name + ": " + error);
				else
					console.log("Job " + name + " completed successfully");
			})
		})
	}, frequency))
}

module.exports.start = function() {
	console.log("Starting analytics jobs")

	var every1Minute = {time: 1, unit: "minute"};
	
	var topUsers = MapReduceJob("top_users", require("./mapreduce.top_users.js"), every1Minute)
	var topTopics = MapReduceJob("top_topics", require("./mapreduce.top_topics.js"), every1Minute)
	var topThreads = MapReduceJob("top_threads", require("./mapreduce.top_threads.js"), every1Minute)
	var topClients = MapReduceJob("top_clients", require("./mapreduce.top_clients.js"), every1Minute)
	var hourlyActivity = MapReduceJob("hourly_activity", require("./mapreduce.hourly_activity.js"), every1Minute)
}