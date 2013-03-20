/**
 * HTTP-basic authentication
 */
var express = require('express'); 

module.exports = function(app, config) {
	console.log("Using HTTP Basic authentication");

	app.use(express.basicAuth(config.auth.basic.user, config.auth.basic.password));

	// configure the routes that we need
	app.get("/", require('../../routes/routes')(config).index);	

	return({app: app, config: config});	
}