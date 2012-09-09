(function() {
  $(document).ready(function() {
    console.log("Application initialized");

    var socket = io.connect('http://' + location.hostname);  

    // callback for new socket.io data  
    socket.on('yam', function(data) {
      var yams = data.messages;
      var users = data.users;
      for(i=0; i < yams.length; i++) {
        var yam = yams[i];
        var newYam = ui.formatYam(yam, users.filter(function(user) {
          return(user.id == yam.sender_id);
        })); 

        // insert the new content into the dom and force it to slide down
        $("ul#yams").prepend(newYam);
        $("ul#yams li:first").hide().slideDown("slow");        
        // attach the timestamp auto-update to the one that was inserted (the ones below already have it)
        $("ul#yams li:first abbr.timeago").timeago();
        // for images, attach fancybox
        $("ul#yams li:first .attachment-image a").fancybox({
          overlayShow: true,
          overlayOpacity: 0.85,
          overlayColor: "#222",
          titleShow: true,
          transitionIn: "none",
          transitionOut: "none"
        });
      }

      $('.waiting').hide();
    });  
  });

  // UI-related functionality
  var ui = {

    yamTemplate: '\
      <li class="yam yam-container shadow"> \
        <div class="yam-mugshot"> \
          <img src="{{user.mugshot_url}}" alt="mugshot" /> \
        </div> \
        <div class="yam-body"> \
          {{{yam.body.rich}}} \
        </div> \
        {{#yam.attachments}} \
        <div class="yam-attachments"> \
          {{#image}} \
            <div class="attachment attachment-image"> \
              <a href="{{image.url}}" alt="{{image.original_name}}" title="{{full_name}}"> \
                <img src="{{image.thumbnail_url}}" alt="Thumbnail" /> \
              </a> \
            </div> \
          {{/image}} \
          <div class="attachment-info"> \
            {{full_name}} \
          </div> \
        </div> \
        {{/yam.attachments}} \
        <div class="yam-info"> \
          Posted by <span class="yam-user">{{user.full_name}}</span>, \
          <abbr class="timeago" title="{{yam.created_at}}">{{created_at_formatted}}</abbr> \
        <div> \
      </li>',

    formatYam: function(yam, users) {
      var user = "";
      
      // to prevent a situation where the user was not found
      if(users.length==0)
        user = { "mugshot_url": "no-link" }
      else
        user = users[0];

      var yamHtml = jQuery.mustache(ui.yamTemplate, { 
        yam: yam, 
        user: user, 
        created_at_formatted: jQuery.timeago(yam.created_at) 
      });
      return(yamHtml);
    }
  }
})();