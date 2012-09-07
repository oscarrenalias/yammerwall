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

        $("ul#yams").prepend(newYam);
        $("ul#yams li:first").hide().slideDown("slow");        
      }

      $('.waiting').hide();
    });  
  });

  // UI-related functionality
  var ui = {
    formatYam: function(yam, users) {
      var user = "";
      
      // to prevent a situation where the user was not found
      if(users.length==0)
        user = { "mugshot_url": "no-link" }
      else
        user = users[0];

      var yamHtml = '<li class="yam yam-container shadow">'; 
      yamHtml += '<div class="yam-mugshot"><img src="' + user.mugshot_url + '" alt="mugshot" /></div>';
      yamHtml += '<div class="yam-body">' + yam.body.rich + "</div>";
      yamHtml += "</li>\n";
      return(yamHtml);
    }
  }
})();