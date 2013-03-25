exports.oauth_token = "NaH7oqK11F4E4ERiMFVA";

// Name of the network from which the application is receiving the data; this value
// is used to validate that users belong to the same network
exports.network_domain = "accenture.com";

// "dev" or "prod" - dev enables some additional features like sending random yams for testing.
// Keep in mind that this is a function, so we can actually implement some kind of smart logic
// to determine whether we're in "dev" or "prod" mode if needed
exports.mode = function() {
	return("dev");
}

exports.ui = {
	// enable or disable the client-side search box
	show_search: false,
	// title to show at the top of the page
	title: "YammerWall"
}

exports.auth = {
	//
	// One of:
	//	"none" - free access
	//	"basic" - use HTTP basic auth, using the user and password provided below
	//	"oauth" - enable Yammer OAuth2 authentication
	//
	type: "oauth",

	// HTTP Basic auth configuration
	basic: {
		user: "testUser",
		password: "testPassword",
	},

	// OAuth configuration
	oauth: {
		key: "mRVIv8MI88hqmm4hXzymAQ",
		secret: "WmfDUE7wvpYcNTgHn9hrQ3MccGSveuF4Lcxp3iaDkBU"
	}
}

// Allows to listen only to all yams, yams in a group or yams with the given topic (hashtag)
exports.filter = {
	// Supported values: "all", "topic", "group"
	type: "all",	
	// if type="topic", fill in this field with the id of the topic to listen for
	topic: 1886302,	// "#taconf"
	// if type="group", fill in this field with the id of the group to listen for
	group: 112233,
}

// Some experimental analytics features
exports.file_writer = {
	enabled: false,
	folder: "./data",
}

exports.analytics = {
	// Control the analytics jobs and processing
	enabled: true,

	// Whether some of the analytics data should be shown in the front page
	show_in_front_page: true,

	mongo: {
		uri: process.env.MONGOLAB_URI || "mongodb://192.168.33.190/yammerwall",
		collection: "yams"
	}
}
