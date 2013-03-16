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

	// Very simple model class that handles storage and retrieval in Mongo
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

/*
  De-normalizes a message as received from the push API, since the API returns some sort of
  normalized message using the "references" section, but that would be very uncomfortable to use
  in MongoDB, so we denormalize the message here and make analytics easier later
*/
YammerAnalytics.prototype.denormalizeMessage = function(apiMessage) {
	// process each one of the yams embedded in the message sent by the API
	var findUserObject = function(yam) {
		yam.sender = (apiMessage.data.references.filter(function(item) { 
			return(item.type == "user" && item.id == yam.sender_id);
		})[0]);

		return(yam);
	}

	var findTopics = function(yam) {
		// Extracts all hashtags from the message body, if any
		var hashtagRegexp = /[#]+[A-Za-z0-9-]+/g;
		var matches = yam.body.plain.match(hashtagRegexp);

		// TODO: I should be able to do this in the regexp...
		yam.topics = (matches == null ? [] : matches.map(function(match) { 
			return(match.replace("#", "")) })
		);

		return(yam);
	}

	var findInReplyTo = function(yam) {
		yam.replied_to = (apiMessage.data.references.filter(function(item) { 
			return(item.type == "message" && item.id == yam.replied_to_id);
		})[0]);

		return(yam);
	}

	var findAtUsers = function(yam) {
		// Extracts the list of "@" users in the message body, if any
		var userRegexp = /[@]+[A-Za-z0-9-]+/g;
		var matches = yam.body.plain.match(userRegexp);

		// TODO: I should be able to do this in the regexp...
		yam.at_users =(matches == null ? [] : matches.map(function(match) { 
			return(match.replace("@", "")) })
		);

		return(yam);
	}

	var findThread = function(yam) {
		if(yam.id == yam.thread_id) {
			// this case can happen if this yam is the first one in a thread, as it won't have a
			// matching message in the references section
			yam.thread = yam;
		}
		else {
			yam.thread = (apiMessage.data.references.filter(function(item) { 
				return(item.type == "message" && item.id == yam.thread_id);
			})[0]);
		}

		return(yam);
	}

	var yams = _(apiMessage.data.messages).map(function(yam) {
		// compose the functions so that the next one users the output of the previous one
		var denormalizeYam = _.compose(findUserObject, findTopics, findInReplyTo, findAtUsers, findThread)
		return(denormalizeYam(yam));
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