var MongoModel = require('../lib/analytics/mongomodel');

module.exports = function(config) {
	var mongo = new MongoModel(config.analytics.mongo.uri)	

	// Helper function that generates functions to handle a route for a specific collection with statistics in it
	var statsRoute = function(collection_name, limit) {
		return(function(req, res) {
			mongo.getCollection(collection_name).then(function(coll) {
				coll.find().sort([["value", -1]]).limit(limit).toArray(function(error, data) {
					res.json(data);
				})
			})			
		})
	}

	return {
		top_users: statsRoute("top_users", 20),
		top_clients: statsRoute("top_clients", 0),
		top_threads: statsRoute("top_threads", 20),
		top_topics: statsRoute("top_topics", 20)
	}
}