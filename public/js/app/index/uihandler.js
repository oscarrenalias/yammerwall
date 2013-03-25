//
// This module provides the event handlers for the application events
//
define(["index/eventqueue", 
		"index/events", 
		"common/templates",
		"common/logger"
		], function(eventQueue, Events, Templates, log) {
    
    var EventHandlers = {
		// current filter
		filter: $('#filter').val() || "",

		// This event is notified when the application starts, and it is used to retrieve
		// the 10 or so most recent yams so that there's some content on the screen
		onApplicationStarted: function(message) {		
			log.info("Initializing application. Retrieving recent yams.");

			$.get("/stats/data/recent").
			done(function(data, textStatus, jqXHR) {
				_(data.reverse()).each(function(yam) {
					eventQueue.publish({message: Events.NewYam, data: yam});
				})
			}).
			fail(function() {
				log.error("There was an error refreshing the most recent yams");
			})
		},

		// event handler that handles new yams
		onNewYam: function(message) {
		    var yam = message.value.data;
		    //var newYam = this.yamTemplate({yam: yam});
		    var newYam = Templates.yam({yam: yam});
		    
		    // insert the new content into the dom and force it to slide down
		    $("ul#yams").prepend(newYam);
		    $("ul#yams li:first").hide().slideDown("slow");        
		    // attach the timestamp auto-update to the one that was inserted (the ones below already have it)
		    $("ul#yams li:first abbr.timeago").timeago();
		    // for images, attach fancybox
		    $("ul#yams li:first .yam-attachment-image a").fancybox({
				overlayShow: true,
				overlayOpacity: 0.85,
				overlayColor: "#222",
				titleShow: true,
				transitionIn: "none",       
				transitionOut: "none"
		    });
		    
		    eventQueue.publish({message: Events.NewYamAdded, data:yam});
		},

		// event handler that updates the current filter
		onUpdatedFilter: function(v) {    
            filter = $('#filter').val();
	            
            var text = "Filter: " + filter;
            if(filter.charAt(0) === "!")
				text = "Filter: NOT " + filter.substr(1, filter.length);
            if(filter == "")
				text = "Showing all";
	            
            // if the top-most item in the list is already a separator, let's not add
            // a new one but change its content to avoid an ugly-looking list of separator
            // after separator
            var firstItemSelector = "ul#yams li:first";
            if($(firstItemSelector).hasClass('separator')) {
				$(firstItemSelector).text(text);
			} 
			else {
				// add as a new item to the list
				$('ul#yams').prepend("<li class='separator'>" + text + "</li>");
				$(firstItemSelector).hide().slideDown("slow");          
            }     

            eventQueue.publish({message: Events.NewYamAdded, data:undefined})
		},
    }

    // Subscribe to the events that we're interested in
    eventQueue.subscribe(Events.ApplicationStarted, EventHandlers.onApplicationStarted);
    eventQueue.subscribe(Events.NewYam, EventHandlers.onNewYam);
    eventQueue.subscribe(Events.FilterUpdate, EventHandlers.onUpdatedFilter); 

    return(EventHandlers);
});
