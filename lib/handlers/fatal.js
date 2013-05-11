/**
 * Application fatal error handling
 */
var log = require("log4js-config").get("net.renalias.yammer.wall.app");

module.exports.handler = function(config) {
	return(function(error) {
		log.error("There was an error connecting to the real-time API, please check the OAuth configuration. Exiting...");
		process.exit(-1);		
	})
}