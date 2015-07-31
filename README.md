# PersistentWS

NOTE: I just noticed other people are downloading this off npm, so I will make it pass through the standard WebSocket API soon.

Provides a constructor for WebSockets that automatically attempt to reconnect after being disconnected. Reconnection times start at ~5s for the first attempt, double after each failed attempt, and are randomized by +/- 10% to prevent clients from reconnecting at the exact same time after a server event.

[![npm](https://img.shields.io/npm/l/express.svg)]()
[![Code Climate](https://codeclimate.com/github/Densaugeo/PersistentWS/badges/gpa.svg)](https://codeclimate.com/github/Densaugeo/PersistentWS)

## Installation

Install with bower, npm, or link PersistentWS.js from your html:

~~~
wget https://raw.githubusercontent.com/Densaugeo/PersistentWS/master/PersistentWS.js

OR

bower install --save persistent-ws

OR

npm install --save persistent-ws
~~~

## Import

Supports node.js, AMD, and browser global modules.

~~~
In your html:
<script type="text/javascript" src="/your/folders/PersistentWS.js"></script>

Or with browserify:
var PersistentWS = require('persistent-ws');
~~~

## Usage

~~~
<script type="text/javascript">
var pws = new PersistentWS({url: 'wss://your.websocket/server'});

pws.addEventListener('message', function(message) {
  console.log('Received: ' + message);
});

pws.socket.send('Hello from a persitent websocket!');
</script>
~~~

.addEventListener() and .removeEventListener should be called on the PersistentWS object and not on the raw socket, to allow events to be reattached properly after reconnections. .onmessage, etc. are not supported at this time.

## License

MIT
