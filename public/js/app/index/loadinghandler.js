/**
 * This module handles the "loading..." message at the top of the page when no yams have been received
 * for approximately 20 seconds. It is used to provide users with some feedback that we are still waiting
 * for data, in the case that there is not much activity in the network.
 */
define(["index/eventqueue", 
		"index/events", 
		"common/logger"
		], function(eventQueue, Events, log) {

	var spinnerTimer = null;

	var timeout = 20*1000;

	EventHandlers = {	
		onNewYamAdded: function() {
		    // Hides the waiting message when a new yam or separator is added to the timeline		 
		    $('#loadingstatus').fadeOut();
		    
		    // schedule an event so that the spinner appears again if there hasn't been any yam
		    // for about 30 seconds, to indicate that we're waiting for data...
		    if(spinnerTimer) {
		    	// reset the time if it was already created
		    	log.debug("Clearing timeout for spinner timer");
		    	clearTimeout(this.spinnerTimer);
		    }

		    spinnerTimer = setTimeout(function() {
		    	log.debug("Activating spinner");
		    	$('#loadingstatus').fadeIn();
		    }, timeout)
		}
	};	

    eventQueue.subscribe(Events.NewYamAdded, EventHandlers.onNewYamAdded)
})