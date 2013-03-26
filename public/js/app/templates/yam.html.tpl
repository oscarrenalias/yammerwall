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
        <div class="yam-attachment-info"> 
          <%= attachment.full_name %>
      </div>        
      <% } else { %>
        <div class="yam-attachment"> 
          Link: <a href="<%= attachment.web_url %>" alt="Attachment">             
            <% print(StringUtils.shortenString(attachment.web_url, 80, "...")) %>
          </a>          
        </div> 
      <% } /* if(attachment.image) */ %>	 
    </div> 
    <% }) %> 	
    <div class="yam-info"> 
      Posted by <span class="yam-user"><%= yam.sender.full_name %></span> 
      <abbr class="timeago" title="<%= yam.created_at %>"><%= jQuery.timeago(yam.created_at) %></abbr>
	   <% if (yam.replied_to) { %>		  
		    <% if(yam.replied_to.sender) { %>
          , <a href="#" class="live-tipsy" title="<%= yam.replied_to.body.plain %>">in reply to</a>
          <%= yam.replied_to.sender.full_name %>.
        <% } else { %>
          , <a href="#" class="live-tipsy" title="<%= yam.replied_to.body.plain %>">in conversation</a>.
        <% } %>
	   <% } %> <a href="<%= yam.web_url %>">See conversation in Yammer</a>. 
    <div> 
</li>
