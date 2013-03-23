<% _.each(data, function(user) { %>
	<li class="user">
		<a href="<%= user._id.web_url %>" title="<%= user.value %> yams">
			<img src="<%= user._id.mugshot_url %>" alt="<%= user._id.name %>" />
		</a>
	</li>
<% }) %>
