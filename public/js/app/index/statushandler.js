//
// This module handles the little status message that appears on the top right corner on the screen
// in case the socket.io connection is lost
//
define([ "index/eventqueue", "index/events"], function(eventQueue, Events) {

	var statusInfo = {
		element: $("#connstatus"),

		setClass: function(cssClass) {
			return(this.element.removeClass().addClass(cssClass));
		},

		disconnected: function() {
			this.setClass("disconnected").html("Disconnected").fadeIn();
		},

		connected: function() {
			this.setClass("connected").html("Connected").fadeOut();
		},

		connecting: function() {
			this.setClass("connecting").html("Connecting...").fadeIn();
		},

		error: function() {
			this.setClass("disconnected").hmtl("Unable to connect").fadeIn();
		},
	}

	var statusEvents = {
		// event handler that is triggered when socket.io connects to the server
		onConnected: function() {
		    statusInfo.connected();
		},

		onDisconnected: function() {
			statusInfo.disconnected();
		},
		
		// triggered when socket.io reconnects
		onReconnected: function() {
		    statusInfo.connecting();
		},
		
		// triggered during socket.io reconnection
		onReconnecting: function() {		    
		  	statusInfo.connecting();
		},

		onConnectionFailure: function() {
			statusInfo.error();
		},
	}	

	// Events handled by this module, wired to their receivers within this module
	eventQueue.subscribe(Events.Connected, statusEvents.onConnected);
	eventQueue.subscribe(Events.Reconnected, statusEvents.onConnected);
	eventQueue.subscribe(Events.Reconnecting, statusEvents.onReconnecting);
	eventQueue.subscribe(Events.Disconnected, statusEvents.onDisconnected);
	eventQueue.subscribe(Events.ConnectFailed, statusEvents.onConnectionFailure);
	eventQueue.subscribe(Events.ReconnectFailed, statusEvents.onConnectionFailure);

	// This module does not export anything, it simply runs
});