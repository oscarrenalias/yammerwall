//
// This module loads all templates via the RequireJS text plugin, compiles them via Underscore and
// exposes them as injectable dependencies for other modules to use.
//
define(
    [ "text!templates/yam.html.tpl", 
      "text!templates/top_users.html.tpl", 
      "text!templates/top_topics.html.tpl", 
      "text!templates/top_threads.html.tpl" ], 
    function(yamTemplate, topUsersTemplate, topTopicsTemplate, topThreadsTemplate) {
	
	var templates = {
	    yam: _.template(yamTemplate),
	    topUsers: _.template(topUsersTemplate), 
	    topTopics:_.template(topTopicsTemplate),
	    topThreads: _.template(topThreadsTemplate),
	};

	return(templates);
    }
)
