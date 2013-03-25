//
// A very simple logging module
//
// TODO: replace the current implementation with a proper logging library.
//
define(function() {
	var logger = {
		info: function(msg) {
			this.log("INFO", msg)
		},

		debug: function(msg) {
			this.log("DEBUG", msg);
		},

		warn: function(msg) {
			this.log("WARN", msg);
		},

		error: function(msg) {
			this.log("ERROR", msg);
		},

		log: function(prio, msg) {
			console.log("[ " + (new Date()).toString() + " ] " + prio + ": " + msg);
		}
	}

	return(logger);
})