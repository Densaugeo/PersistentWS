var assert = require('assert');
var sinon = require('sinon');

if(typeof WebSocket === 'undefined') {
  var ws = require('ws');
  global.WebSocket = ws; // Supply WebSocket global for node.js-based tests
}

var PersistentWS = require('..');

var nodeJS = process && process.versions && process.versions.node;
var websocket;

if(nodeJS) {
  websocket = require('websocket');
  
  var wsServer = new ws.Server({host: '127.0.0.1', port: 8080});
  
  wsServer.on('connection', function(connection) {
    connection.on('message', function(message) {
      connection.send(message);
    });
  });
}

var constants = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
var properties = ['binaryType', 'bufferedAmount', 'extensions', 'protocol', 'readyState', 'url'];

var pws = {};

suite('WebSocket API', function() {
  test('Should connect to host using browser WebSocket syntax', function(done) {
    pws = new PersistentWS('ws://localhost:8080/');
    
    pws.addEventListener('open', function() {
      done();
    });
  });
  
  test('Should be able to send message to server', function(done) {
    pws = new PersistentWS('ws://localhost:8080/');
    
    pws.addEventListener('open', function() {
      pws.addEventListener('message', function(m) {
        assert.strictEqual(m.data, 'foo');
        
        done();
      });
      
      pws.send('foo');
    });
  });
  
  test('Options arguent should set .verbose and .initialRetryTime options', function() {
    pws = new PersistentWS('ws://localhost:8080/', undefined, {verbose: false, initialRetryTime: 1000});
    assert.strictEqual(pws.verbose, false);
    assert.strictEqual(pws.initialRetryTime, 1000);
    
    sinon.stub(console, 'log');
    
    pws = new PersistentWS('ws://localhost:8080/', undefined, {verbose: true, initialRetryTime: 5000});
    assert.strictEqual(pws.verbose, true);
    assert.strictEqual(pws.initialRetryTime, 5000);
    
    pws.verbose = false;
    
    console.log.restore();
  });
  
  test('Constructor should have WebSocket\'s constants', function() {
    constants.forEach(function(v) {
      assert.strictEqual(PersistentWS[v], WebSocket[v]);
    });
  });
  
  test('Instances should have WebSocket\'s constants', function() {
    constants.forEach(function(v) {
      assert.strictEqual(pws[v], WebSocket[v]);
    });
  });
  
  test('.socket should provide access to the raw WebSocket', function() {
    assert.strictEqual(pws.socket.constructor, WebSocket);
  });
  
  test('Lookups on standard WebSocket properties should be passed through to .socket', function(done) {
    pws = new PersistentWS('ws://localhost:8080/');
    
    // Check all the properties are the same...
    properties.forEach(function(v) {
      assert.strictEqual(pws[v], pws.socket[v]);
    });
    
    pws.addEventListener('open', function() {
      // ...and check again after opening
      properties.forEach(function(v) {
        assert.strictEqual(pws[v], pws.socket[v]);
      });
      
      done();
    });
  });
  
  test('.binaryType should be settable to either \'blob\' or \'arraybuffer\'', function() {
    pws.binaryType = 'blob';
    assert.strictEqual(pws.binaryType, 'blob');
    assert.strictEqual(pws.socket.binaryType, 'blob');
    
    pws.binaryType = 'arraybuffer';
    assert.strictEqual(pws.binaryType, 'arraybuffer');
    assert.strictEqual(pws.socket.binaryType, 'arraybuffer');
  });
  
  test('.on[event] properties should be settable to functions', function() {
    var events = ['onclose', 'onerror', 'onmessage', 'onopen'];
    
    events.forEach(function(v) {
      var aFunction = function() {}
      
      pws[v] = aFunction;
      assert.strictEqual(pws[v], aFunction);
    });
  });
  
  test('Should automatically reconnect after connection is cut', function(done) {
    this.slow(250);
    
    pws = new PersistentWS('ws://localhost:8080/', undefined, {initialRetryTime: 100});
    
    pws.onopen = function() {
      pws.close();
      
      pws.onopen = function() {
        done();
      }
    }
  });
  
  test('If .persistence is false, should not automatically reconnect', function(done) {
    this.slow(600);
    
    pws = new PersistentWS('ws://localhost:8080/', undefined, {initialRetryTime: 100, persistence: false});
    
    var hasReconnected = false;
    
    pws.addEventListener('open', function() {
      pws.close();
      
      pws.addEventListener('open', function() {
        hasReconnected = true;
      });
    });
    
    setTimeout(function() {
      assert.strictEqual(hasReconnected, false);
      
      done();
    }, 250);
  });
  
  test('Writable properties should be transferred to new .socket after reconnecting', function(done) {
    this.slow(250);
    
    pws = new PersistentWS('ws://localhost:8080/', undefined, {initialRetryTime: 100});
    
    var binaryType = pws.binaryType = 'arraybuffer';
    
    pws.onopen = function() {
      pws.onopen = function() {
        assert.strictEqual(pws.socket.binaryType, binaryType);
        
        done();
      }
      
      pws.close();
    }
  });
  
  test('Event listeners registered with .onopen should be called with an event argument', function(done) {
    pws = new PersistentWS('ws://localhost:8080/');
    
    pws.onopen = function(e) {
      assert.strictEqual(typeof e, 'object');
      
      done();
    }
  });
  
  test('Event listeners registered with .onmessage should be called with an event argument', function(done) {
    pws = new PersistentWS('ws://localhost:8080/');
    
    pws.onmessage = function(e) {
      assert.strictEqual(typeof e, 'object');
      
      done();
    }
    
    pws.addEventListener('open', function() {
      pws.send('foo');
    });
  });
  
  test('Event listeners registered with .onclose should be called with an event argument', function(done) {
    pws = new PersistentWS('ws://localhost:8080/');
    
    pws.onclose = function(e) {
      assert.strictEqual(typeof e, 'object');
      
      done();
    }
    
    pws.addEventListener('open', function() {
      pws.persistence = false;
      
      pws.close();
    });
  });
  
  test('Event listeners registered with .onerror should be called with an error argument', function(done) {
    pws = new PersistentWS('ws://localhost:1234/');
    
    pws.onerror = function(e) {
      assert.strictEqual(typeof e, 'object');
      
      done();
    }
  });
  
  test('Event listeners registered with .on[event] should fire after reconnecting', function(done) {
    this.slow(250);
    
    pws = new PersistentWS('ws://localhost:8080/', undefined, {initialRetryTime: 100});
    
    pws.onmessage = function() {
      done();
    }
    
    pws.onopen = function() {
      pws.close();
      
      pws.onopen = function() {
        // Has just reconnected
        pws.send('foo');
      }
    }
  });
  
  test('Event listeners registered with .addEventListener should fire', function(done) {
    pws = new PersistentWS('ws://localhost:8080/');
    
    pws.addEventListener('open', function() {
      done();
    });
  });
  
  test('Should be able to add multiple listeners with .addEventListener', function(done) {
    this.slow(250);
    
    pws = new PersistentWS('ws://localhost:8080/');
    
    var listenerOne = new sinon.spy();
    var listenerTwo = new sinon.spy();
    
    pws.addEventListener('open', listenerOne);
    pws.addEventListener('open', listenerTwo);
    
    setTimeout(function() {
      assert.strictEqual(listenerOne.calledOnce, true);
      assert.strictEqual(listenerTwo.calledOnce, true);
      
      done();
    }, 100);
  });
  
  test('Event listeners registered with .addEventListener should still fire after reconnecting', function(done) {
    this.slow(250);
    
    pws = new PersistentWS('ws://localhost:8080/', undefined, {initialRetryTime: 100});
    
    pws.addEventListener('message', function() {
      done();
    });
    
    pws.onopen = function() {
      pws.close();
      
      pws.onopen = function() {
        // Has just reconnected
        pws.send('foo');
      }
    }
  });
  
  test('Event listeners removed with .removeEventListener should not fire', function(done) {
    // Swap to WebSocket library that supports .removeEventListener()
    if(nodeJS) {
      global.WebSocket = websocket.w3cwebsocket;
    }
    
    this.slow(250);
    
    pws = new PersistentWS('ws://localhost:8080/');
    
    var listener = new sinon.spy();
    
    pws.addEventListener('open', listener);
    pws.removeEventListener('open', listener);
    
    setTimeout(function() {
      assert.strictEqual(listener.called, false);
      
      done();
    }, 100);
    
    // Swap WebSocket library back
    if(nodeJS) {
      global.WebSocket = ws;
    }
  });
  
  test('Event listeners removed with .removeEventListener should not fire after reconnecting', function(done) {
    // Swap to WebSocket library that supports .removeEventListener()
    if(nodeJS) {
      global.WebSocket = websocket.w3cwebsocket;
    }
    
    this.slow(500);
    
    pws = new PersistentWS('ws://localhost:8080/', undefined, {initialRetryTime: 100});
    
    var listener = new sinon.spy();
    
    pws.addEventListener('open', listener);
    pws.removeEventListener('open', listener);
    
    pws.onopen = function() {
      pws.close();
      
      pws.onopen = function() {
        // Has just reconnected
        setTimeout(function() {
          assert.strictEqual(listener.called, false);
          
          done();
        }, 100);
      }
    }
    
    // Swap WebSocket library back
    if(nodeJS) {
      global.WebSocket = ws;
    }
  });
  
  test('Should talk to console if .verbose is set', function() {
    var spy = new sinon.stub(console, 'log');
    
    pws = new PersistentWS('ws://localhost:8080/', undefined, {verbose: true});
    
    assert.strictEqual(spy.called, true);
    
    pws.verbose = false;
    
    console.log.restore();
  });
  
  test('Should not talk to console if .verbose is not set', function() {
    var spy = new sinon.stub(console, 'log');
    
    pws = new PersistentWS('ws://localhost:8080/');
    
    assert.strictEqual(spy.called, false);
    
    console.log.restore();
  });
});
