/*
 Connection factory
*/
var YammerPushAPI = require('yammer-push-api-client');

module.exports = function(config) {
	if(config.mode() == "dev")
    	var client = YammerPushAPI.Mock({delay: 5000 /* 5 seconds */});
  	else
    	var client = YammerPushAPI.Client(config.oauth_token, config.filter);

  	return(client);
}