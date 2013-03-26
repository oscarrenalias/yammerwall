//
// This module implements the entry point to the application that runs in the index page ("/"), and pulls
// in its dependencies as required via RequireJS
//
// In essence the application is only an event generator, that mainly converts socket.io and DOM events into
// Bacon events, that get shoved into a Bacon.Bus event bus for further processing. The EventHandlers module
// provides event hanlers for the exposed events
//
define(["common/stringutils", 
		"index/eventqueue", 
		"index/events", 
		"index/uihandler",
		"index/statushandler",
		"index/loadinghandler",
		"common/logger"], function(StringUtils, eventQueue, Events, UIHandler, StatusHandler, LoadingHandler, log) {
    var app = {
      
      	// Use Bacon's own Bus to handle event generation, handling and filtering within our application
      	//eventQueue: new Bacon.Bus(),
      
      	// socket.io initialization
      	socket: io.connect('http://' + location.hostname),
      
      	//
      	// Initializes the application
      	//
      	init: function() {
	  		log.info("Initializing the application");
	  
	  		$('a.live-tipsy').tipsy({
        	      live: true,
            	  fade: true,
              	gravity: $.fn.tipsy.autoNS
	  		});

	  		// The server may send more than one yam in the single socket.io message,
	  		// so we will split that into an array of a single message each, keeping the same
	  		// references, metadata, etc; doing so we can implement message filtering much
	  		// more easily
	  		var splitMessages = function(message) {
	  			var findReference = function(references, id) {
	  				return(_(references).filter(function(item) {
	  					return(item.id == id)
					})[0]);
        		}
	      
        		var denormalizedData = message.data.messages.map(function(yam) {
					yam.sender = findReference(message.data.references.users, yam.sender_id);
					yam.replied_to = findReference(message.data.references.messages, yam.replied_to_id);
					if(yam.replied_to) {
		    			yam.replied_to.sender = findReference(message.data.references.users, yam.replied_to.sender_id);
					}
					return(yam);
    			});
	    
    			return(Bacon.sequentially(0, denormalizedData));
			} 

			// when a message is received from socket.io, split it into smaller yams and push it again in a
			// more consumable format (since ther server may pack a big bunch of messages into one, in 
			// normalized format)		
			eventQueue.ofType(Events.MessageReceived).flatMap(splitMessages).subscribe(function(message) {
				eventQueue.publish({message: Events.NewYam, data: message.value});
			})
			
			// notify that the application has started
			eventQueue.publish({message: Events.ApplicationStarted})
			
			// Convert socket.io events to custom application events
			this.socket.on("yam", eventQueue.mapToMessage(Events.MessageReceived));
			this.socket.on("connect", eventQueue.mapToMessage(Events.Connected));
			this.socket.on("disconnect", eventQueue.mapToMessage(Events.Disconnected));
			this.socket.on("connect_failed", eventQueue.mapToMessage(Events.ConnectFailed));
			this.socket.on("reconnect_failed", eventQueue.mapToMessage(Events.ReconnectFailed));
			this.socket.on("reconnect", eventQueue.mapToMessage(Events.Reconnected))
			this.socket.on("reconnecting", eventQueue.mapToMessage(Events.Reconnecting));
    	}
  	}

    return(app);
})
