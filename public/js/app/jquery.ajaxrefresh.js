/*
 Small jQuery plugin that refreshes the given selector from the given JSON endpoint
*/
(function(jQuery) {
    function RecurringTask(callback, recurrence, opts) {
		var opts = opts || {immediate: false};		
	
		var time = 0;
		if(recurrence.unit == "ms")
		    time = recurrence.time;
		else if(recurrence.unit == "s" || recurrence.unit == "sec" || recurrence.unit == "seconds")
		    time = recurrence.time * 1000;
		else if(recurrence.unit == "m" || recurrence.unit == "minute" || recurrence.unit == "minutes")
		    time = recurrence.time * 1000 * 60;
		else
		    throw(Exception("Unrecognized time unit: " + recurrence.unit));
		
		var interval = setInterval(callback, time);
		
		if(opts.immediate) {
		    callback();			
		}

		return({
		    cancel: function() {
				clearInterval(interval);
		    }
		})
    }
    
    jQuery.fn.ajaxRefresh = function(url, template, freq) {
		return this.each(function(idx, item) {
		    var $this = $(this);
		    RecurringTask(function() {
			$.get(url).done(function(data, textStatus, jqXHR) {
			    $this.html(template({data: data}));
			}).fail(function() {
			    console.log("Error refreshing contents from " + url);
			})
		    }, freq, {immediate: true})
		    return($this);
		})
   }
})(jQuery);
