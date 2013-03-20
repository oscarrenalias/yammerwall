/**
 * Pass-through
 */
module.exports = function(app, config) {
	console.log("************");
	console.log("WARNING: The application is configured without authentication; anyone with access the application's URL will have access to your stream");
	console.log("************");

	// configure the routes that we need
	app.get("/", require('../../routes/routes')(config).index);

	return({app:app, config:config});
}