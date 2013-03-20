var MongoModel = require('../lib/analytics/mongomodel');

module.exports = function(config) {
	var mongo = new MongoModel(config.analytics.mongo.uri)	

	// Helper function that generates functions to handle a route for a specific collection with statistics in it
	var MongoCollectionRoute = function(collection_name, limit) {
		return(function(req, res) {
			mongo.getCollection(collection_name).then(function(coll) {
				coll.find().sort([["value", -1]]).limit(limit).toArray(function(error, data) {
					// TODO: return a proper HTTP error code
					res.json(data);
				})
			})			
		})
	}

	return {
		top_users: MongoCollectionRoute("top_users", 25),
		top_clients: MongoCollectionRoute("top_clients", 0),
		top_threads: MongoCollectionRoute("top_threads", 10),
		top_topics: MongoCollectionRoute("top_topics", 20),
		hourly_activity: MongoCollectionRoute("hourly_activity", 0),

		recent: function(req, res) {
			mongo.getCollection("yams").then(function(coll) {
				// TODO: parameterize this
				coll.find().sort([["created_at", "desc"]]).limit(15).toArray(function(error, data) {
					// TODO: return a proper error code
					res.json(data);
				})
			})
		},
		
		ui: function(req, res) {
			res.render("stats", { user: req.user, config: config, title: "YammerWall | Statistics" });
		}
	}
}