var assert       = require('assert');
var sinon        = require('sinon');
var ws           = require('ws');
global.WebSocket = ws; // Supply WebSocket global for client-side library
var PersistentWS = require('..');

var wsServer = new ws.Server({host: '127.0.0.1', port: 8080});

wsServer.on('connection', function(connection) {
  connection.on('message', function(message) {
    connection.send(message);
  });
});

suite('WebSocket API', function() {
  beforeEach(function() {
    
  });
  
  test('PWS should connect to host using browser WebSocket syntax', function(done) {
    var pws = new PersistentWS('ws://localhost:8080/');
    
    pws.addEventListener('open', function() {
      done();
    });
  });
  
  test('PWS should connect to host using options object syntax', function(done) {
    var pws = new PersistentWS({url: 'ws://localhost:8080/'});
    
    pws.addEventListener('open', function() {
      done();
    });
  });
});
