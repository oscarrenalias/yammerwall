/**
 * Application fatal error handling
 */
module.exports.handler = function(config) {
	return(function(error) {
		console.log("There was an error connecting to the real-time API, please check the OAuth configuration. Exiting...");
		process.exit(-1);		
	})
}