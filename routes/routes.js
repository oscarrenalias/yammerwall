/*
 This module contains the application routes, broken down into smaller functions.

 Since some of the routes require a config object, obtaining the actual route handlers requires
 that we provide a 'config' object to the module's export function, which will return an object with 
 the functions themselves
*/
module.exports = function(config) {
	return {
		index: function(req, res) {
			res.render("index", { user: req.user, config: config, title: config.ui.title });
		}
	}
}