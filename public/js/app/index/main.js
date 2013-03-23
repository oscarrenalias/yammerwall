//
// This module implements the entry point to the application that runs in the index page ("/"), and pulls
// in its dependencies as required via RequireJS
//
// In essence the application is only an event generator, that mainly converts socket.io and DOM events into
// Bacon events, that get shoved into a Bacon.Bus event bus for further processing. The EventHandlers module
// provides event hanlers for the exposed events
//
define(["common/stringutils", "index/eventqueue", "index/events", "index/eventhandlers"], function(StringUtils, eventQueue, Events, EventHandlers) {
    var app = {
      
      // Use Bacon's own Bus to handle event generation, handling and filtering within our application
      //eventQueue: new Bacon.Bus(),
      
      // socket.io initialization
      socket: io.connect('http://' + location.hostname),
      
      //
      // Initializes the application
      //
      init: function() {
	  console.log("Initializing the application");
	  
	  $('a.live-tipsy').tipsy({
              live: true,
              fade: true,
              gravity: $.fn.tipsy.autoNS
	  });

	  // handy function for doing the filtering
	  eventQueue.ofType = function(type) {
              return(eventQueue.filter(function(message) {
		  return(message.message == type);
              }));      
	  }  

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
		// TODO: maybe we should do this in the server...?
		yam.sender = findReference(message.data.references.users, yam.sender_id);
		yam.replied_to = findReference(message.data.references.messages, yam.replied_to_id);
		if(yam.replied_to) {
		    yam.replied_to.sender = findReference(message.data.references.users, yam.replied_to.sender_id);
		}
		return(yam);
            });
	    
            return(Bacon.sequentially(0, denormalizedData));
	} 

	// wire our custom events (from the DOM or socke.io) to receivers
	eventQueue.ofType(Events.NewYam).flatMap(splitMessages).filter(app.filterMessage).subscribe(EventHandlers.onNewYam);
	eventQueue.ofType(Events.FilterUpdate).subscribe(EventHandlers.onUpdatedFilter); 
	eventQueue.ofType(Events.NewYamAdded).take(1).subscribe(EventHandlers.onNewYamAdded);
	eventQueue.ofType(Events.Connected).subscribe(EventHandlers.onConnected);
	eventQueue.ofType(Events.Reconnected).subscribe(EventHandlers.onReconnected);
	eventQueue.ofType(Events.Reconnecting).subscribe(EventHandlers.onReconnecting);

	// trigger a custom event in our application bus every time the textbox with the filter
	// is updated
	$('#filter')
	    .popover() // add a tooltip to the filter field
	    .asEventStream("keyup")
	    .skipDuplicates()
	    .throttle(1500)
	    /*.filter(function(data) { // TODO: FIX THIS
		// do not generate a new event if the value did not change (this can happen if
		// the user presses arrow keys or any other arrow that generates the keyup event
		// but does not change the content of the field)
		return(app.filter != $('#filter').val())
	    })*/
	    .subscribe(function(data) {
		eventQueue.push({ message: Events.FilterUpdate, data: data})
	    })

	// Helper function that helps map socket.io events to custom application events
	var BaconEventTransformer = function(message, data) {
            return(function(data) {
		eventQueue.push({message: message, data: data});
            })
	}

	// Convert socket.io events to custom application events
	this.socket.on("yam", BaconEventTransformer(Events.NewYam));
	this.socket.on("connect", BaconEventTransformer(Events.Connected));
	this.socket.on("disconnect", BaconEventTransformer(Events.Disconnected));
	this.socket.on("connect_failed", BaconEventTransformer(Events.ConnectFailed));
	this.socket.on("reconnect_failed", BaconEventTransformer(Events.ReconnectFailed));
	this.socket.on("reconnect", BaconEventTransformer(Events.Reconnected))
	this.socket.on("reconnecting", BaconEventTransformer(Events.Reconnecting));
    },

    // Filters messages to determine if they need to be pushed as events (and therefore be
    // made visible in the timeline). 
    // It simply checks the current value of the filter text field and uses String.search
    // to determine if the string is the message bobdy; if not, ignore it
    // TODO: tags in yammer may also be part of the metadata and not appear in the message body!
    filterMessage: function(message) {
      // check if the current filter matches any content in the message
      /*if(app.filter == "") {
        console.log("Filter is empty; accepting all messages");
        return(true);
      }

      // is it a reverse filter?
      var isReverse = (app.filter.charAt(0) === "!")
      if(isReverse)
        var toFilter = app.filter.substr(1, app.filter.length)
      else
        var toFilter = app.filter

      var yam = message.data.messages[0];
      var keep = (helpers.matchWord(yam.body.plain, toFilter));
      if(isReverse) // TODO: is there a more straightforward way to do this?
        keep = !keep

      return(keep);*/

	return(true);
    },
  }

    return(app);
})
