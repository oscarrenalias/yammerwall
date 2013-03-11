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
// If different from an empty array, these will be used to initialize the filter
//
exports.default_filter = ["test"];
