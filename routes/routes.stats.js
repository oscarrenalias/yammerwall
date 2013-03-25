var MongoModel = require('../lib/analytics/mongomodel');

module.exports = function(config) {
	var mongo = new MongoModel(config.analytics.mongo.uri)	

	var MongoJSONResponseHandler = function(res) {
		return(function(error, data) {
			if(error) {
				console.log("Error processing stats: " + error);
				res.send("Error processing request", 500);	
			}
			else	
				res.json(data);
		});
	}

	// Helper function that generates functions to handle a route for a specific collection with statistics in it
	var MongoCollectionRoute = function(collection_name, limit, sorting) {
		
		// use the given sort criteria if any, or a default one if none
		var sort_criteria = sorting == undefined ? [["value", -1]] : sorting;

		return(function(req, res) {
			mongo.getCollection(collection_name).then(function(coll) {
				coll.find().sort(sort_criteria).limit(limit).toArray(MongoJSONResponseHandler(res));
			})			
		})
	}

	return {
		top_users: MongoCollectionRoute("top_users", 25),
		top_clients: MongoCollectionRoute("top_clients", 0),
		top_threads: MongoCollectionRoute("top_threads", 10),
		top_topics: MongoCollectionRoute("top_topics", 20),
		hourly_activity: MongoCollectionRoute("hourly_activity", 0, [["_id.s", -1]]),
		daily_activity: MongoCollectionRoute("daily_activity", 0, [["_id.s", -1 ]]),
		recent: function(req, res) {
			mongo.getCollection("yams").then(function(coll) {
				// TODO: parameterize this
				coll.find().sort([["created_at", "desc"]]).limit(10).toArray(MongoJSONResponseHandler(res));
			})
		},
		
		ui: function(req, res) {
			res.render("stats", { user: req.user, config: config, title: "YammerWall | Statistics" });
		}
	}
}