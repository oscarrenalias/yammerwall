exports.oauth_token = process.env.OAUTH_TOKEN
exports.credentials = {
	"YAMMER_CONSUMER_KEY": process.env.YAMMER_CONSUMER_KEY,
	"YAMMER_CONSUMER_SECRET": process.env.YAMMER_CONSUMER_SECRET
}

// "dev" or "prod" - dev enables some additional features like sending random yams for testing
exports.mode = "prod";
