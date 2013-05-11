/**
 * HTTP-basic authentication
 */
var express = require('express'),
    log = require("log4js-config").get("net.renalias.yammer.wall.app");

module.exports = function(app, config) {
	console.info("Using HTTP Basic authentication");

	app.use(express.basicAuth(config.auth.basic.user, config.auth.basic.password));

	// configure the routes that we need
	app.get("/", require('../../routes/routes')(config).index);	

	return({app: app, config: config});	
}