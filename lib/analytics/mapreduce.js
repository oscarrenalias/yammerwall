var MongoModel = require('./mongomodel'),
	RecurringTask = require('../task').RecurringTask;

var mapReduce = {
	// Basic M-R that counts things
	topUsers: {
		map: function() {
			emit({
				"id": this.sender.id,
				"name": this.sender.name, 
				"mugshot_url": this.sender.mugshot_url
			}, 1);
		},
		reduce: function(user, count) {
			return(Array.sum(count))
		},
		options: {
			out: { "replace": "top_users", }
		}		
	},
	topTopics: {
		map: function() {
			this.topics.map(function(topic) {
				emit(topic, 1)
			});
		},
		reduce: function(topic, count) {
			return(Array.sum(count))
		},
		options: {
			out: { "replace": "top_topics", }
		}
	}
}

module.exports.start = function() {
	var config = require(require('path').dirname(require.main.filename) + "/config");

	console.log("Starting analytics jobs")

	// share the same connection across all jobs
	var mongo = new MongoModel(config.analytics.mongo.uri);
	
	// update the list of top users
	var topUsers = RecurringTask(function() {
		console.log("Updating top_users");

		mongo.getCollection(config.analytics.mongo.collection).then(function(coll) {
			coll.mapReduce(
				mapReduce.topUsers.map, 
				mapReduce.topUsers.reduce, 
				mapReduce.topUsers.options,
				function(error, result) {
					if(error)
						console.error("There was an error updating the collection top_users");
					else
						console.log("top_users collection updated successfully");
				}
			)
		})
	}, {time: 1, unit: "minute"})

	// list of most used tags
	var topTopics = RecurringTask(function() {
		console.log("Updating top_topics");

		mongo.getCollection(config.analytics.mongo.collection).then(function(coll) {
			coll.mapReduce(
				mapReduce.topTopics.map, 
				mapReduce.topTopics.reduce, 
				mapReduce.topTopics.options,
				function(error, result) {
					if(error)
						console.error("There was an error updating the collection top_topics");
					else
						console.log("top_users collection updated successfully");
				}
			)
		})
	}, {time: 1, unit: "minute"})
}