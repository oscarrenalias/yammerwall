var _ = require('underscore'),
	MongoModel = require('./mongomodel'),
	MapReduce = require('./mapreduce'),
    log = require("log4js-config").get("net.renalias.yammer.wall.app");

//
// implements some basic analytics capabilities
//
function YammerAnalytics(config) {
	this.config = config;
	log.info("Enabling analytics");

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

		if(yam.replied_to) {
			var tmpYam = findUserObject(yam.replied_to);
			// Copy some of the fields only to avoid issues serializing.
			// The code is also a bit nasty because findUserObject returns a full
			// yam object, which we don't need... therefore we only extract the needed
			// data from the result and copy it to our object
			yam.replied_to.sender = {
				full_name: tmpYam.sender.full_name,
				mugshot_url: tmpYam.sender.mugshot_url,
				activated_at: tmpYam.sender.activated_at,
				web_url: tmpYam.sender.web_url,
				name: tmpYam.sender.name,
				mugshot_url_template: tmpYam.sender.mugshot_url_template
			}
		}

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
			yam.thread = {	// copy the basic parts of the yam, because if we do yam.thread=this we'll cause and endless loop during serialization :-)
				body: yam.body,
				url: yam.url,
				web_url: yam.web_url,
				created_at: yam.created_at,
				sender_id: yam.sender_id,
				topics: yam.topics,
				at_users: yam.at_users,
				sender: yam.sender
			};
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
		var denormalizeYam = _.compose(findThread, findUserObject, findTopics, findInReplyTo, findAtUsers)
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