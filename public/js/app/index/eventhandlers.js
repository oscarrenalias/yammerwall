//
// This module provides the event handlers for the application events
//
define(["index/eventqueue", "index/events", "common/templates"], function(eventQueue, Events, Templates) {
    var EventHandlers = {
		// current filter
		filter: $('#filter').val() || "",

		// event handler that handles new yams
		onNewYam: function(message) {
		    var yam = message.value;
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

		onNewYamAdded: function() {
		    // Hides the waiting message when a new yam or separator is added to the timeline
		    $('.waiting').hide();
		}
    }

    return(EventHandlers);
});
