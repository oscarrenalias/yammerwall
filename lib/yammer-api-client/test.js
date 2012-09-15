var YammerClient = require('./lib/api.js'),
	assert = require('assert'),
	client = new YammerClient({ token: "NaH7oqK11F4E4ERiMFVA" });

// Test messages
client.messages.private({ limit: 1 }, function(error, data) {
	assert(data, "There should not be an error here");
	console.log("Data received");
});

client.messages.following({}, function(error, data) {
	assert(data, "There should not be an error here");
	console.log("Data received");
});

client.messages.all({ limit: 1 }, function(error, data) {
	assert(data, "There should not be an error here");
	assert(data.messages.length == 1, "There should be only one message in the response!");
	console.log("Data received");
});

/*client.messages.liked_by(11111, {}, function(error, data) {
	assert(data, "There should not be an error here");	
	console.log("Message data received:" + JSON.stringify(data));
});*/

/*client.messages.in_group(121212, {}, function(error, data) {
	assert(data, "There should not be an error here");	
	console.log("Message data received:" + JSON.stringify(data));
});*/

/*client.messages.in_thread(121212, {}, function(error, data) {
	assert(data, "There should not be an error here");	
	console.log("Message data received:" + JSON.stringify(data));
});*/

// Test users
client.users.current(function(error, data) {
	assert(data, "There should not be an error here");
});

// Test groups
client.groups.list({}, function(error, data) {
	assert(data, "There should not be an error here");
});

/*client.groups.get("123", function(error, data) {
	assert(data, "There should not be an error here");
});*/