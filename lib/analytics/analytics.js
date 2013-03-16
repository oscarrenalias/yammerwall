var _ = require('underscore'),
	MongoModel = require('./mongomodel'),
	MapReduce = require('./mapreduce');

//
// implements some basic analytics capabilities
//

function YammerAnalytics(config) {
	this.config = config;
	console.log("Enabling analytics");

	MapReduce.start();

	this.self = this;

	// Very simple model class that handles storage in Mongo
	this.Yam = (function(collection) {
		var getModel = _.memoize(function() {
			return(new MongoModel(config.mongo.uri));
		})

		var yam = {
			put: function(yam) {
				return(getModel().put(collection, yam));
			}
		}

		return(yam);
	})(config.mongo.collection);	
}

module.exports = YammerAnalytics;

//
// De-normalizes a message as received from the push API
//
YammerAnalytics.prototype.denormalizeMessage = function(apiMessage) {
	// process each one of the yams embedded in the message sent by the API
	var findUserObject = function(id) {
		return((apiMessage.data.references.filter(function(item) { 
			return(item.type == "user" && item.id == id);
		})[0]));
	}

	var findTopics = function(yam) {
		// Extracts all hashtags from the message body, if any
		var hashtagRegexp = /[#]+[A-Za-z0-9-]+/g;
		var matches = yam.body.plain.match(hashtagRegexp);

		// TODO: I should be able to do this in the regexp...
		return((matches == null ? [] : matches.map(function(match) { 
			return(match.replace("#", "")) })
		));
	}

	var findInReplyTo = function(inReplytoId) {
		return((apiMessage.data.references.filter(function(item) { 
			return(item.type == "message" && item.id == inReplytoId);
		})[0]));
	}

	var findAtUsers = function(yam) {
		// Extracts the list of "@" users in the message body, if any
		var userRegexp = /[@]+[A-Za-z0-9-]+/g;
		var matches = yam.body.plain.match(userRegexp);

		// TODO: I should be able to do this in the regexp...
		return((matches == null ? [] : matches.map(function(match) { 
			return(match.replace("@", "")) })
		));
	}

	var yams = _(apiMessage.data.messages).map(function(yam) {
		yam.sender = findUserObject(yam.sender_id);
		yam.topics = findTopics(yam);
		yam.replied_to = findInReplyTo(yam.replied_to_id)
		yam.at_users = findAtUsers(yam);
		return(yam);
	});


		
	return(yams);
}

YammerAnalytics.prototype.process = function(apiMessage) {
	var yams = _(this.denormalizeMessage(apiMessage));
	// we provide 'this' as the context for the iterator call, otherwise it gets "lost"
	yams.each(this.store, this);
}

YammerAnalytics.prototype.store = function(yam) {
	this.Yam.put(yam);
}