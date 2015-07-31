# PersistentWS.js

This script provides a persistent WebSocket that attempts to reconnect after disconnections

Dependencies: None

---

## PersistentWS

Inherits: None

This is a WebSocket that attempts to reconnect after disconnections

Reconnection times start at ~5s, double after each failed attempt, and are randomized +/- 10%

Exposes standard WebSocket API (https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

```
var persistentConnection = new PersistentWS('wss://foo.bar/');

persistentConnection.addEventListener('message', function(e) {
  console.log('Received: ' + e.data);
});

// Options may be supplied as a *third* parameter, after the rarely-used protocols argument
var anotherConnection = new PersistentWS('wss://foo.bar/', undefined, {verbose: true});
```

#### Options

`Number` **initialRetryTime** -- Sets .initialRetryTime

`Boolean` **persistence** -- Sets .persistence

`Boolean` **verbose** -- Sets .verbose

#### Properties

`[[String,` **Function,** Boolean]] _listeners -- For internal use. Array of .addEventListener arguments

`Number` **attempts** -- Retry attempt # since last disconnect

`Number` **initialRetryTime** -- Delay for first retry attempt, in milliseconds. Always an integer >= 100

`Boolean` **persistence** -- If false, disables reconnection

`WebSocket` **socket** -- The actual WebSocket. Events registered directly to the raw socket will be lost after reconnections

`Boolean` **verbose** -- console.log() info about connections and disconnections

#### Methods

`undefined` **_connect**`()` -- For internal use. Connects and copies in event listeners

`Number` proto **_getListenerIndex**`(String type, Function listener[, Boolean useCapture])` -- For internal use. Returns index of a listener in ._listeners

`undefined` **_onclose**`(Event e)` -- For internal use. Calls to .onclose() and ._reconnect() where appropriate

`undefined` **_onerror**`(Error e)` -- For internal use. Calls to .onerror()

`undefined` **_onmessage**`(Event e)` -- For internal use. Calls to .onmessage()

`undefined` **_onopen**`(Event e)` -- For internal use. Calls to .onopen() and handles reconnection cleanup

`undefined` proto **_reconnect**`()` -- For internal use. Begins the reconnection timer

`Boolean` proto **dispatchEvent**`(Event event)` -- Same as calling .dispatchEvent() on .socket

