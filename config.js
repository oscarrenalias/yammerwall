exports.oauth_token = "NaH7oqK11F4E4ERiMFVA";

// Name of the network from which the application is receiving the data; this value
// is used to validate that users belong to the same network
exports.network_domain = "accenture.com";

exports.credentials = {
	YAMMER_CONSUMER_KEY: "mRVIv8MI88hqmm4hXzymAQ",
	YAMMER_CONSUMER_SECRET: "WmfDUE7wvpYcNTgHn9hrQ3MccGSveuF4Lcxp3iaDkBU"
}

// "dev" or "prod" - dev enables some additional features like sending random yams for testing
exports.mode = "dev";

//
// If this toggle is enabled, no Yammer authentication will be required to access the stream.
// WARNING: this means that anyone with access to the application's URL will be able to see
// the stream.
//
exports.skip_auth = true;

//
// Allows to listen only to all yams, yams in a group or yams with the given topic (hashtag)
//
exports.filter = {
	// Supported values: "all", "topic", "group"
	type: "topic",	
	// if type="topic", fill in this field with the id of the topic to listen for
	topic: 1886302,	// "#taconf"
	// if type="group", fill in this field with the id of the group to listen for
	group: 112233,
}