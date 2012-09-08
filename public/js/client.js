(function() {
  $(document).ready(function() {
    console.log("Application initialized");

    var socket = io.connect('http://' + location.hostname);  

    // callback for new socket.io data  
    socket.on('yam', function(data) {
      var yams = data.messages;
      var users = data.users;
      var newYams = "";
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
          {{yam.body.rich}} \
        </div> \
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