//
// Very simple module that exposes an event queue based on Bacon
//
define(function() {

	var eventQueue = new Bacon.Bus()

	return({
		// Pushes a message into our queue
		publish: function(message) {
			eventQueue.push(message);
		},

		subscribe: function(callback) {
			return(eventQueue.subscribe(callback))
		},

		// handy function for doing the filtering	
		ofType: function(type) {
  			return(eventQueue.filter(function(message) {
  				return(message.message == type);
  			}));      
  		},

  		// maps an event sent by a JS emitter into a message that gets pushed into the Bacon queue
		mapToMessage: function(message, data) {
			return(function(data) {
				eventQueue.push({message: message, data: data});
        	})
		}  		  
	})
})
