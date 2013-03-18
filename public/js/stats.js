(function() {
	$(document).ready(function() {
		var Every1Minute = { time: 1, unit: "minute" }

		$("#top-users").ajaxRefresh("/stats/collections/top_users", $("#tmpl-top-users").html(), Every1Minute);
		$("#top-topics").ajaxRefresh("/stats/collections/top_topics", $("#tmpl-top-topics").html(), Every1Minute);
		$("#top-threads").ajaxRefresh("/stats/collections/top_threads", $("#tmpl-top-threads").html(), Every1Minute);
	})
})();