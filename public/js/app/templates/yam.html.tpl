<li class="yam yam-container shadow"> 
    <div class="yam-mugshot"> 
      <img src="<%= yam.sender.mugshot_url %>" alt="mugshot" /> 
    </div> 
    <div class="yam-body"> 
      <%= yam.body.rich %>
    </div>
    <% _(yam.attachments).each(function(attachment) { %>
    <div class="yam-attachments">  
      <% if (attachment.image) { %>
        <div class="yam-attachment yam-attachment-image"> 
          <a href="<%= attachment.image.url %>" alt="<%= attachment.image.original_name %>"> 
            <img src="<%= attachment.image.thumbnail_url %>" alt="Thumbnail" /> 
          </a> 
        </div> 
      <% } else { %>
        <div class="yam-attachment"> 
          <a href="<%= attachment.download_url %>" alt="Attachment"> 
            <% if (attachment["small_icon_url"]) { %><img src="<%= attachment.small_icon_url %>" alt="Icon" /><% } %>
            <%= attachment.full_name %>
          </a> 
        </div> 
      <% } /* if(attachment.image) */ %>	
      <div class="yam-attachment-info"> 
        <%= attachment.full_name %>, <% require(["common/stringutils"], function(StringUtils) { 
		print(StringUtils.formatSize(attachment.size)) 
	}) %>
      </div> 
    </div> 
    <% }) %> 	
    <div class="yam-info"> 
      Posted by <span class="yam-user"><%= yam.sender.full_name %></span> 
      <abbr class="timeago" title="<%= yam.created_at %>"><%= jQuery.timeago(yam.created_at) %></abbr>  
	   <% if (yam.replied_to) { %>
		  <a href="#" class="live-tipsy" title="<%= yam.replied_to.body.plain %>">in reply to</a> 
		  <% if(yam.replied_to.sender) { %><%= yam.replied_to.sender.full_name %><% } %>
	   <% } %>. <a href="<%= yam.web_url %>">See conversation in Yammer</a>. 
    <div> 
</li>
