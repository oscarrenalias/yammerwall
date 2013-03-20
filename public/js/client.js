(function() {
  $(document).ready(function() {
    console.log("Application initialized");

    $('a.live-tipsy').tipsy({
      live: true,
      fade: true,
      gravity: $.fn.tipsy.autoNS
    });

    var ApplicationEvents = {
      NewYam: "new-yam",
      NewYamAdded: "new-yam-added",
      FilterUpdate: "filter-update",
      Connected: "connected",
      Reconnected: "reconnected",
      Disconnected: "disconnected",
      ConnectFailed: "connect_failed",
      Reconnecting: "reconnecting",
      ReconnectFailed: "reconnect_failed"
    }

    eventQueue = new Bacon.Bus();

    // handy function for doing the filtering
    eventQueue.ofType = function(type) {
      return(eventQueue.filter(function(message) {
        return(message.message == type);
      }));      
    }  

    // The server may send more than one yam in the single socket.io message,
    // so we will split that into an array of a single message each, keeping the same
    // references, metadata, etc; doing so we can implement message filtering much
    // more easily
    var splitMessages = function(message) {
      var findReference = function(references, id) {
        return(_(references).filter(function(item) {
          return(item.id == id)
        })[0]);
      }

      var denormalizedData = message.data.messages.map(function(yam) {
        // TODO: maybe we should do this in the server...?
        yam.sender = findReference(message.data.references.users, yam.sender_id);
        yam.replied_to = findReference(message.data.references.messages, yam.replied_to_id);
        if(yam.replied_to) {
          yam.replied_to.sender = findReference(message.data.references.users, yam.replied_to.sender_id);
        }
        return(yam);
      });

      return(Bacon.sequentially(0, denormalizedData));
    } 

    // wire the events to receivers
    eventQueue.ofType(ApplicationEvents.NewYam).flatMap(splitMessages).filter(app.filterMessage).subscribe(app.newYam);
    eventQueue.ofType(ApplicationEvents.FilterUpdate).subscribe(app.updateFilter); 
    eventQueue.ofType(ApplicationEvents.NewYamAdded).take(1).subscribe(app.hideWaitingMessage);
    eventQueue.ofType(ApplicationEvents.Connected).subscribe(app.onConnected);
    eventQueue.ofType(ApplicationEvents.Reconnected).subscribe(app.onReconnected);    
    eventQueue.ofType(ApplicationEvents.Reconnecting).subscribe(app.onReconnecting);

    // trigger a custom event in our application bus every time the textbox with the filter
    // is updated
    $('#filter').
      asEventStream("keyup").
      skipDuplicates().
      throttle(1500).
      filter(function(data) {
        // do not generate a new event if the value did not change (this can happen if
        // the user presses arrow keys or any other arrow that generates the keyup event
        // but does not change the content of the field)
        return(app.filter != $('#filter').val())
      }).
      subscribe(function(data) {
        eventQueue.push({ message: ApplicationEvents.FilterUpdate, data: data})
      });

    // add a tooltip to the filter field
    $('#filter').popover();

    // callback for new socket.io data  
    var socket = io.connect('http://' + location.hostname);  
    socket.on('yam', function(data) {
      eventQueue.push({ message: ApplicationEvents.NewYam, data: data });
    });

    //
    // Socket.io events mapping to Bacon bus events
    //
    var BaconEventTransformer = function(message) {
      return(function() {
        eventQueue.push({message: message});
      })
    }

    socket.on("connect", BaconEventTransformer(ApplicationEvents.Connected));
    socket.on("disconnect", BaconEventTransformer(ApplicationEvents.Disconnected));
    socket.on("connect_failed", BaconEventTransformer(ApplicationEvents.ConnectFailed));
    socket.on("reconnect_failed", BaconEventTransformer(ApplicationEvents.ReconnectFailed));
    socket.on("reconnect", BaconEventTransformer(ApplicationEvents.Reconnected))
    socket.on("reconnecting", BaconEventTransformer(ApplicationEvents.Reconnecting));
  });

  // UI-related functionality
  var app = {

    // compiled version of the template for new yams
    yamTemplate: _.template($("#tmpl-yam").html()),

    // current filter
    filter: $('#filter').val() || "",

    // Hides the waiting message when a new yam or separator is added to the timeline
    hideWaitingMessage: function() {
      $('.waiting').hide();
    },

    // Filters messages to determine if they need to be pushed as events (and therefore be
    // made visible in the timeline). 
    // It simply checks the current value of the filter text field and uses String.search
    // to determine if the string is the message bobdy; if not, ignore it
    // TODO: tags in yammer may also be part of the metadata and not appear in the message body!
    filterMessage: function(message) {
      // check if the current filter matches any content in the message
      if(app.filter == "") {
        console.log("Filter is empty; accepting all messages");
        return(true);
      }

      // is it a reverse filter?
      var isReverse = (app.filter.charAt(0) === "!")
      if(isReverse)
        var toFilter = app.filter.substr(1, app.filter.length)
      else
        var toFilter = app.filter

      var yam = message.data.messages[0];
      var keep = (helpers.matchWord(yam.body.plain, toFilter));
      if(isReverse) // TODO: is there a more straightforward way to do this?
        keep = !keep

      console.log("processing message: " + yam.id + ", filter: " + toFilter + ", reverse: " + isReverse + " - result: " + keep);
      return(keep);
    },

    // event handler that is triggered when socket.io connects to the server
    onConnected: function() {
      console.log("Connected!");
    },

    // triggered when socket.io reconnects
    onReconnected: function() {
      console.log("Reconnected!");
    },

    // triggered during socket.io reconnection
    onReconnecting: function() {
      //console.log("Reconnecting...");
    },

    // event handler that updates the current filter
    updateFilter: function(v) {    
        app.filter = $('#filter').val();
        console.log("New filter value = " + app.filter); 
        
        var text = "Filter: " + app.filter;
        if(app.filter.charAt(0) === "!")
            text = "Filter: NOT " + app.filter.substr(1, app.filter.length);
        if(app.filter == "")
          text = "Showing all";
              
        // if the top-most item in the list is already a separator, let's not add
        // a new one but change its content to avoid an ugly-looking list of separator
        // after separator
        var firstItemSelector = "ul#yams li:first";
        if($(firstItemSelector).hasClass('separator')) {
          $(firstItemSelector).text(text);
        } 
        else {
          // add as a new item to the list
          $('ul#yams').prepend("<li class='separator'>" + text + "</li>");
          $(firstItemSelector).hide().slideDown("slow");          
        }     

        // TODO: could we do this with an event?
        //$('.waiting').hide();
        eventQueue.push({message: ApplicationEvents.NewYamAdded, data:undefined})
    },

    // event handler that handles new yams
    newYam: function(message) {
      var yam = message.value;
      var newYam = app.yamTemplate({yam: yam});

      // insert the new content into the dom and force it to slide down
      $("ul#yams").prepend(newYam);
      $("ul#yams li:first").hide().slideDown("slow");        
      // attach the timestamp auto-update to the one that was inserted (the ones below already have it)
      $("ul#yams li:first abbr.timeago").timeago();
      // for images, attach fancybox
      $("ul#yams li:first .yam-attachment-image a").fancybox({
        overlayShow: true,
        overlayOpacity: 0.85,
        overlayColor: "#222",
        titleShow: true,
        transitionIn: "none",       
        transitionOut: "none"
      });

      eventQueue.push({message: "new-yam-added", data:yam});
    },
  }
})();