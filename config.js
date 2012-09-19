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