(function(root, factory) {
  if(typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  }
  
  if(typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  }
  
  // Browser globals (root is window)
  root.PersistentWS = factory();
}(this, function() {
  /**
   * @description This script provides a persistent WebSocket that attempts to reconnect after disconnections
   */
  
  /**
   * @module PersistentWS
   * @description This is a WebSocket that attempts to reconnect after disconnections
   * @description Reconnection times start at ~5s, double after each failed attempt, and are randomized +/- 10%
   * @description Exposes standard WebSocket API (https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
   * 
   * @example var persistentConnection = new PersistentWS('wss://foo.bar/');
   * @example
   * @example persistentConnection.addEventListener('message', function(e) {
   * @example   console.log('Received: ' + e.data);
   * @example });
   * @example
   * @example // Options may be supplied as a *third* parameter, after the rarely-used protocols argument
   * @example var anotherConnection = new PersistentWS('wss://foo.bar/', undefined, {verbose: true});
   */
  var PersistentWS = function PersistentWS(url, protocols, options) {
    var self = this;
    
    // @prop Boolean verbose -- log info about connections and disconnections
    // @option Boolean verbose -- Sets .verbose
    this.verbose = Boolean(options && options.verbose) || false;
    
    // @prop Number initialRetryTime -- Delay for first retry attempt, in milliseconds. Always an integer >= 100
    // @option Number initialRetryTime -- Sets .initialRetryTime
    this.initialRetryTime = Number(options && options.initialRetryTime) || 5000;
    
    // @prop Number maxRetryTime -- Maximum delay between retry attempts, in milliseconds. Integer or null
    // @option Number maxRetryTime -- Sets .maxRetryTime
    this.maxRetryTime = Number(options && options.maxRetryTime) || null;
    
    // @prop Boolean persistence -- If false, disables reconnection
    // @option Boolean persistence -- Sets .persistence
    this.persistence = options === undefined || options.persistence === undefined || Boolean(options.persistence);
    
    // @prop Number attempts -- Retry attempt # since last disconnect
    this.attempts = 0;
    
    // @prop WebSocket socket -- The actual WebSocket. Events registered directly to the raw socket will be lost after reconnections
    this.socket = {};
    
    // @option Function logger -- Sets .logger
    // @method * logger(*) -- Method to use for logging. Defaults to console.log
    this.logger = (options && options.logger) || function(m) {console.log(m)};
    
    // @method undefined _onopen(Event e) -- For internal use. Calls to .onopen() and handles reconnection cleanup
    this._onopen = function(e) {
      if(self.onopen) {
        self.onopen(e);
      }
    }
    
    // @method undefined _onmessage(Event e) -- For internal use. Calls to .onmessage()
    this._onmessage = function(e) {
      if(self.onmessage) {
        self.onmessage(e);
      }
    }
    
    // @method undefined _onerror(Error e) -- For internal use. Calls to .onerror()
    this._onerror = function(e) {
      if(self.onerror) {
        self.onerror(e);
      }
    }
    
    // @method undefined _onclose(Event e) -- For internal use. Calls to .onclose() and ._reconnect() where appropriate
    this._onclose = function(e) {
      if(self.persistence) {
        self._reconnect();
      }
      
      if(self.onclose) {
        self.onclose(e);
      }
    }
    
    // @prop [[String, Function, Boolean]] _listeners -- For internal use. Array of .addEventListener arguments
    this._listeners = [
      ['open', this._onopen],
      ['message', this._onmessage],
      ['error', this._onerror],
      ['close', this._onclose]
    ];
    
    // @method undefined _connect() -- For internal use. Connects and copies in event listeners
    this._connect = function _connect() {
      if(self.verbose) {
        self.logger('Opening WebSocket to ' + url);
      }
      
      var binaryType = self.socket.binaryType;
      
      self.socket = new WebSocket(url, protocols);
      
      self.socket.binaryType = binaryType || self.socket.binaryType;
      
      // Reset .attempts counter on successful connection
      self.socket.addEventListener('open', function() {
        if(self.verbose) {
          self.logger('WebSocket connected to ' + self.url);
        }
        
        self.attempts = 0;
      });
      
      self._listeners.forEach(function(v) {
        self.socket.addEventListener.apply(self.socket, v);
      });
    }
    
    this._connect();
  }
  
  PersistentWS.CONNECTING = WebSocket.CONNECTING;
  PersistentWS.OPEN       = WebSocket.OPEN;
  PersistentWS.CLOSING    = WebSocket.CLOSING;
  PersistentWS.CLOSED     = WebSocket.CLOSED;
  
  PersistentWS.prototype.CONNECTING = WebSocket.CONNECTING;
  PersistentWS.prototype.OPEN       = WebSocket.OPEN;
  PersistentWS.prototype.CLOSING    = WebSocket.CLOSING;
  PersistentWS.prototype.CLOSED     = WebSocket.CLOSED;
  
  var webSocketProperties = ['binaryType', 'bufferedAmount', 'extensions', 'protocol', 'readyState', 'url'];
  
  webSocketProperties.forEach(function(v) {
    Object.defineProperty(PersistentWS.prototype, v, {
      get: function() {
        return this.socket[v];
      },
      set: function(x) {
        return (this.socket[v] = x);
      }
    });
  });
  
  PersistentWS.prototype.close = function(code, reason) {
    this.socket.close(code, reason);
  }
  
  PersistentWS.prototype.send = function(data) {
    this.socket.send(data);
  }
  
  PersistentWS.prototype.addEventListener = function addEventListener(type, listener, useCapture) {
    this.socket.addEventListener(type, listener, useCapture);
    
    var alreadyStored = this._getListenerIndex(type, listener, useCapture) !== -1;
    
    if(!alreadyStored) {
      // Store optional parameter useCapture as Boolean, for consistency with
      // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
      var useCaptureBoolean = Boolean(useCapture);
      
      this._listeners.push([type, listener, useCaptureBoolean]);
    }
  }
  
  PersistentWS.prototype.removeEventListener = function removeEventListener(type, listener, useCapture) {
    this.socket.removeEventListener(type, listener, useCapture);
    
    var indexToRemove = this._getListenerIndex(type, listener, useCapture);
    
    if(indexToRemove !== -1) {
      this._listeners.splice(indexToRemove, 1);
    }
  }
  
  // @method proto Boolean dispatchEvent(Event event) -- Same as calling .dispatchEvent() on .socket
  PersistentWS.prototype.dispatchEvent = function(event) {
    return this.socket.dispatchEvent(event);
  }
  
  // @method proto Number _getListenerIndex(String type, Function listener[, Boolean useCapture]) -- For internal use. Returns index of a listener in ._listeners
  PersistentWS.prototype._getListenerIndex = function _getListenerIndex(type, listener, useCapture) {
    // Store optional parameter useCapture as Boolean, for consistency with
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
    var useCaptureBoolean = Boolean(useCapture);
    
    var result = -1;
    
    this._listeners.forEach(function(v, i) {
      if(v[0] === type && v[1] === listener && v[2] === useCaptureBoolean) {
        result = i;
      }
    });
    
    return result;
  }
  
  // @method proto undefined _reconnect() -- For internal use. Begins the reconnection timer
  PersistentWS.prototype._reconnect = function() {
    // Retty time falls of exponentially
    var retryTime = this.initialRetryTime*Math.pow(2, this.attempts++);
    
    // If .maxRetryTime was specified, retry time must be no more than 90% of max before randomization
    if(typeof this.maxRetryTime === 'number') {
      retryTime = Math.min(retryTime, 0.9*this.maxRetryTime);
    }
    
    // Retry time is randomized +/- 10% to prevent clients reconnecting at the exact same time after a server event
    retryTime += Math.floor(Math.random()*retryTime/5 - retryTime/10);
    
    if(this.verbose) {
      this.logger('WebSocket disconnected, attempting to reconnect in ' + retryTime + 'ms...');
    }
    
    setTimeout(this._connect, retryTime);
  }
  
  // Only one object to return, so no need for module object to hold it
  return PersistentWS;
})); // Module pattern
