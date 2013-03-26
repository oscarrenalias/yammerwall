/*
 This module contains the routes required by OAuth authentication
*/
module.exports = function(config) {
	return {
		login: function(req, res){
			res.render('login', { user: req.user, title: "Login", config: config });
		},

		// successful log in
		callback: function(req, res) {
			res.redirect('/');
		},

		logout: function(req, res) {
			req.logout();
			res.redirect('/');
		}
	}
}