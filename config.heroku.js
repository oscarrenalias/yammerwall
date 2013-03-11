exports.oauth_token = process.env.OAUTH_TOKEN

// Name of the network from which the application is receiving the data; this value
// is used to validate that users belong to the same network
exports.network_domain = process.env.OWN_NETWORK

exports.credentials = {
	"YAMMER_CONSUMER_KEY": process.env.YAMMER_CONSUMER_KEY,
	"YAMMER_CONSUMER_SECRET": process.env.YAMMER_CONSUMER_SECRET
}

// "dev" or "prod" - dev enables some additional features like sending random yams for testing
exports.mode = "prod";

//
// If this toggle is enabled, no Yammer authentication will be required to access the stream.
// WARNING: this means that anyone with access to the application's URL will be able to see
// the stream.
//
exports.skip_auth = true;

//
// If different from an empty array, these will be used to initialize the filter
//
exports.default_filter = ["test"];
