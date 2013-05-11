/**
 * Pass-through
 */
var log = require("log4js-config").get("net.renalias.yammer.wall.app");

module.exports = function(app, config) {
    log.info("Using no authentication");
    log.warn("The application is configured without authentication; anyone with access the application's URL will have access to your stream");

	// configure the routes that we need
	app.get("/", require('../../routes/routes')(config).index);

	return({app:app, config:config});
}