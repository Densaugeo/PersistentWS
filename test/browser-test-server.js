process.title = 'pws-test';

var ws = require('ws');

var wsServer = new ws.Server({host: '127.0.0.1', port: 8080});

wsServer.on('connection', function(connection) {
  console.log('Incoming socket connected');
  
  connection.on('message', function(message) {
    console.log('Received message: ' + message);
    
    connection.send(message);
  });
});
