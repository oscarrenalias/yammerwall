define(["common/templates"], function(templates) {
    var Every1Minute = { time: 1, unit: "minute" }
	
    var app = {
		init: function() {
		    $("#top-users").ajaxRefresh("/stats/collections/top_users", templates.topUsers, Every1Minute);
		    $("#top-topics").ajaxRefresh("/stats/collections/top_topics", templates.topTopics, Every1Minute);
		    $("#top-threads").ajaxRefresh("/stats/collections/top_threads", templates.topThreads, Every1Minute);
		}
    }

    return(app);
})
