<% _.each(data, function(thread) { %>
	<li class="thread">
		<a href="<%= thread._id.web_url %>" title="<%= thread.value%> yams"><%= thread._id.content_excerpt %></a>
	</li>
<% }) %>
