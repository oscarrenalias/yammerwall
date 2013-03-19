module.exports.handler = function(config) {
	if(config.analytics.enabled) {	  
	  var YammerAnalytics = require("./analytics");
	  var analytics = new YammerAnalytics(config.analytics);

	  return(function(data) {
	      data.map(function(yam) {
	      
	      // process data in the respose depending on its type
	      if(yam.data) {
	          // not all messages have data to process
	          if(yam.data.type == "message") {
	            analytics.process(yam.data);
	          }
	        }
	    });
	  });
	}
	else {
		return(function(data) { /* do nothing, as we're not enabled */ });
	}
}