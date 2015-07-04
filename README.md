# PersistentWS

[![Code Climate](https://codeclimate.com/github/Densaugeo/PersistentWS/badges/gpa.svg)](https://codeclimate.com/github/Densaugeo/PersistentWS)

Provides a constructor for WebSockets that automatically attempt to reconnect after being disconnected. Reconnection times start at ~5s for the first attempt, double after each failed attempt, and are randomized by +/- 10% to prevent clients from reconnecting at the exact same time after a server event.

To install, add PersistentWS.js from this repo to your webserver root or install bower module persistent-ws

~~~
wget https://raw.githubusercontent.com/Densaugeo/PersistentWS/master/PersistentWS.js

OR

bower install --save persistent-ws
~~~

PersistentWS is then available from the PersistentWS.js file:

~~~
<script type="text/javascript" src="/PersistentWS.js"></script>

<!--Or link from your bower folder-->
<script type="text/javascript" src="/bower_components/persistent-ws/PersistentWS.js"></script>

<script type="text/javascript">
var pws = new PersistentWS({url: 'wss://your.websocket/server'});

pws.addEventListener('message', function(message) {
  console.log('Received: ' + message);
});
</script>
~~~

.addEventListener() and .removeEventListener should be called on the PersistentWS object and not on the raw socket, to allow events to be reattached properly after reconnections. .onmessage, etc. are not supported at this time.

## License

MIT
