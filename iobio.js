(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (Buffer){
/*! binary.js build:0.2.1, development. Copyright(c) 2012 Eric Zhang <eric@ericzhang.com> MIT Licensed */
(function(exports){
var binaryFeatures = {};
binaryFeatures.useBlobBuilder = (function(){
  try {
    new Blob([]);
    return false;
  } catch (e) {
    return true;
  }
})();

binaryFeatures.useArrayBufferView = !binaryFeatures.useBlobBuilder && (function(){
  try {
    return (new Blob([new Uint8Array([])])).size === 0;
  } catch (e) {
    return true;
  }
})();
binaryFeatures.supportsBinaryWebsockets = (function(){
  try {
    var wstest = new WebSocket('ws://null');
    wstest.onerror = function(){};
    if (typeof(wstest.binaryType) !== "undefined") {
      return true;
    } else {
      return false;
    }
    wstest.close();
    wstest = null;
  } catch (e) {
    return false;
  }
})();

exports.binaryFeatures = binaryFeatures;
exports.BlobBuilder = window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder || window.BlobBuilder;

function BufferBuilder(){
  this._pieces = [];
  this._parts = [];
}

BufferBuilder.prototype.append = function(data) {
  if(typeof data === 'number') {
    this._pieces.push(data);
  } else {
    this.flush();
    this._parts.push(data);
  }
};

BufferBuilder.prototype.flush = function() {
  if (this._pieces.length > 0) {
    var buf = new Uint8Array(this._pieces);
    if(!binaryFeatures.useArrayBufferView) {
      buf = buf.buffer;
    }
    this._parts.push(buf);
    this._pieces = [];
  }
};

BufferBuilder.prototype.getBuffer = function() {
  this.flush();
  if(binaryFeatures.useBlobBuilder) {
    var builder = new BlobBuilder();
    for(var i = 0, ii = this._parts.length; i < ii; i++) {
      builder.append(this._parts[i]);
    }
    return builder.getBlob();
  } else {
    return new Blob(this._parts);
  }
};
exports.BinaryPack = {
  unpack: function(data){
    var unpacker = new Unpacker(data);
    return unpacker.unpack();
  },
  pack: function(data){
    var packer = new Packer();
    packer.pack(data);
    var buffer = packer.getBuffer();
    return buffer;
  }
};

function Unpacker (data){
  // Data is ArrayBuffer
  this.index = 0;
  this.dataBuffer = data;
  this.dataView = new Uint8Array(this.dataBuffer);
  this.length = this.dataBuffer.byteLength;
}


Unpacker.prototype.unpack = function(){
  var type = this.unpack_uint8();
  if (type < 0x80){
    var positive_fixnum = type;
    return positive_fixnum;
  } else if ((type ^ 0xe0) < 0x20){
    var negative_fixnum = (type ^ 0xe0) - 0x20;
    return negative_fixnum;
  }
  var size;
  if ((size = type ^ 0xa0) <= 0x0f){
    return this.unpack_raw(size);
  } else if ((size = type ^ 0xb0) <= 0x0f){
    return this.unpack_string(size);
  } else if ((size = type ^ 0x90) <= 0x0f){
    return this.unpack_array(size);
  } else if ((size = type ^ 0x80) <= 0x0f){
    return this.unpack_map(size);
  }
  switch(type){
    case 0xc0:
      return null;
    case 0xc1:
      return undefined;
    case 0xc2:
      return false;
    case 0xc3:
      return true;
    case 0xca:
      return this.unpack_float();
    case 0xcb:
      return this.unpack_double();
    case 0xcc:
      return this.unpack_uint8();
    case 0xcd:
      return this.unpack_uint16();
    case 0xce:
      return this.unpack_uint32();
    case 0xcf:
      return this.unpack_uint64();
    case 0xd0:
      return this.unpack_int8();
    case 0xd1:
      return this.unpack_int16();
    case 0xd2:
      return this.unpack_int32();
    case 0xd3:
      return this.unpack_int64();
    case 0xd4:
      return undefined;
    case 0xd5:
      return undefined;
    case 0xd6:
      return undefined;
    case 0xd7:
      return undefined;
    case 0xd8:
      size = this.unpack_uint16();
      return this.unpack_string(size);
    case 0xd9:
      size = this.unpack_uint32();
      return this.unpack_string(size);
    case 0xda:
      size = this.unpack_uint16();
      return this.unpack_raw(size);
    case 0xdb:
      size = this.unpack_uint32();
      return this.unpack_raw(size);
    case 0xdc:
      size = this.unpack_uint16();
      return this.unpack_array(size);
    case 0xdd:
      size = this.unpack_uint32();
      return this.unpack_array(size);
    case 0xde:
      size = this.unpack_uint16();
      return this.unpack_map(size);
    case 0xdf:
      size = this.unpack_uint32();
      return this.unpack_map(size);
  }
}

Unpacker.prototype.unpack_uint8 = function(){
  var byte = this.dataView[this.index] & 0xff;
  this.index++;
  return byte;
};

Unpacker.prototype.unpack_uint16 = function(){
  var bytes = this.read(2);
  var uint16 =
    ((bytes[0] & 0xff) * 256) + (bytes[1] & 0xff);
  this.index += 2;
  return uint16;
}

Unpacker.prototype.unpack_uint32 = function(){
  var bytes = this.read(4);
  var uint32 =
     ((bytes[0]  * 256 +
       bytes[1]) * 256 +
       bytes[2]) * 256 +
       bytes[3];
  this.index += 4;
  return uint32;
}

Unpacker.prototype.unpack_uint64 = function(){
  var bytes = this.read(8);
  var uint64 =
   ((((((bytes[0]  * 256 +
       bytes[1]) * 256 +
       bytes[2]) * 256 +
       bytes[3]) * 256 +
       bytes[4]) * 256 +
       bytes[5]) * 256 +
       bytes[6]) * 256 +
       bytes[7];
  this.index += 8;
  return uint64;
}


Unpacker.prototype.unpack_int8 = function(){
  var uint8 = this.unpack_uint8();
  return (uint8 < 0x80 ) ? uint8 : uint8 - (1 << 8);
};

Unpacker.prototype.unpack_int16 = function(){
  var uint16 = this.unpack_uint16();
  return (uint16 < 0x8000 ) ? uint16 : uint16 - (1 << 16);
}

Unpacker.prototype.unpack_int32 = function(){
  var uint32 = this.unpack_uint32();
  return (uint32 < Math.pow(2, 31) ) ? uint32 :
    uint32 - Math.pow(2, 32);
}

Unpacker.prototype.unpack_int64 = function(){
  var uint64 = this.unpack_uint64();
  return (uint64 < Math.pow(2, 63) ) ? uint64 :
    uint64 - Math.pow(2, 64);
}

Unpacker.prototype.unpack_raw = function(size){
  if ( this.length < this.index + size){
    throw new Error('BinaryPackFailure: index is out of range'
      + ' ' + this.index + ' ' + size + ' ' + this.length);
  }
  var buf = this.dataBuffer.slice(this.index, this.index + size);
  this.index += size;

    //buf = util.bufferToString(buf);

  return buf;
}

Unpacker.prototype.unpack_string = function(size){
  var bytes = this.read(size);
  var i = 0, str = '', c, code;
  while(i < size){
    c = bytes[i];
    if ( c < 128){
      str += String.fromCharCode(c);
      i++;
    } else if ((c ^ 0xc0) < 32){
      code = ((c ^ 0xc0) << 6) | (bytes[i+1] & 63);
      str += String.fromCharCode(code);
      i += 2;
    } else {
      code = ((c & 15) << 12) | ((bytes[i+1] & 63) << 6) |
        (bytes[i+2] & 63);
      str += String.fromCharCode(code);
      i += 3;
    }
  }
  this.index += size;
  return str;
}

Unpacker.prototype.unpack_array = function(size){
  var objects = new Array(size);
  for(var i = 0; i < size ; i++){
    objects[i] = this.unpack();
  }
  return objects;
}

Unpacker.prototype.unpack_map = function(size){
  var map = {};
  for(var i = 0; i < size ; i++){
    var key  = this.unpack();
    var value = this.unpack();
    map[key] = value;
  }
  return map;
}

Unpacker.prototype.unpack_float = function(){
  var uint32 = this.unpack_uint32();
  var sign = uint32 >> 31;
  var exp  = ((uint32 >> 23) & 0xff) - 127;
  var fraction = ( uint32 & 0x7fffff ) | 0x800000;
  return (sign == 0 ? 1 : -1) *
    fraction * Math.pow(2, exp - 23);
}

Unpacker.prototype.unpack_double = function(){
  var h32 = this.unpack_uint32();
  var l32 = this.unpack_uint32();
  var sign = h32 >> 31;
  var exp  = ((h32 >> 20) & 0x7ff) - 1023;
  var hfrac = ( h32 & 0xfffff ) | 0x100000;
  var frac = hfrac * Math.pow(2, exp - 20) +
    l32   * Math.pow(2, exp - 52);
  return (sign == 0 ? 1 : -1) * frac;
}

Unpacker.prototype.read = function(length){
  var j = this.index;
  if (j + length <= this.length) {
    return this.dataView.subarray(j, j + length);
  } else {
    throw new Error('BinaryPackFailure: read index out of range');
  }
}

function Packer(){
  this.bufferBuilder = new BufferBuilder();
}

Packer.prototype.getBuffer = function(){
  return this.bufferBuilder.getBuffer();
}

Packer.prototype.pack = function(value){
  var type = typeof(value);
  if (type == 'string'){
    this.pack_string(value);
  } else if (type == 'number'){
    if (Math.floor(value) === value){
      this.pack_integer(value);
    } else{
      this.pack_double(value);
    }
  } else if (type == 'boolean'){
    if (value === true){
      this.bufferBuilder.append(0xc3);
    } else if (value === false){
      this.bufferBuilder.append(0xc2);
    }
  } else if (type == 'undefined'){
    this.bufferBuilder.append(0xc0);
  } else if (type == 'object'){
    if (value === null){
      this.bufferBuilder.append(0xc0);
    } else {
      var constructor = value.constructor;
      if (constructor == Array){
        this.pack_array(value);
      } else if (constructor == Blob || constructor == File) {
        this.pack_bin(value);
      } else if (constructor == ArrayBuffer) {
        if(binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value));
        } else {
          this.pack_bin(value);
        }
      } else if ('BYTES_PER_ELEMENT' in value){
        if(binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value.buffer));
        } else {
          this.pack_bin(value.buffer);
        }
      } else if (constructor == Object){
        this.pack_object(value);
      } else if (constructor == Date){
        this.pack_string(value.toString());
      } else if (typeof value.toBinaryPack == 'function'){
        this.bufferBuilder.append(value.toBinaryPack());
      } else {
        throw new Error('Type "' + constructor.toString() + '" not yet supported');
      }
    }
  } else {
    throw new Error('Type "' + type + '" not yet supported');
  }
  this.bufferBuilder.flush();
}


Packer.prototype.pack_bin = function(blob){
  var length = blob.length || blob.byteLength || blob.size;
  if (length <= 0x0f){
    this.pack_uint8(0xa0 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xda) ;
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdb);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
    return;
  }
  this.bufferBuilder.append(blob);
}

Packer.prototype.pack_string = function(str){
  var length = utf8Length(str);

  if (length <= 0x0f){
    this.pack_uint8(0xb0 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xd8) ;
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xd9);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
    return;
  }
  this.bufferBuilder.append(str);
}

Packer.prototype.pack_array = function(ary){
  var length = ary.length;
  if (length <= 0x0f){
    this.pack_uint8(0x90 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xdc)
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdd);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  for(var i = 0; i < length ; i++){
    this.pack(ary[i]);
  }
}

Packer.prototype.pack_integer = function(num){
  if ( -0x20 <= num && num <= 0x7f){
    this.bufferBuilder.append(num & 0xff);
  } else if (0x00 <= num && num <= 0xff){
    this.bufferBuilder.append(0xcc);
    this.pack_uint8(num);
  } else if (-0x80 <= num && num <= 0x7f){
    this.bufferBuilder.append(0xd0);
    this.pack_int8(num);
  } else if ( 0x0000 <= num && num <= 0xffff){
    this.bufferBuilder.append(0xcd);
    this.pack_uint16(num);
  } else if (-0x8000 <= num && num <= 0x7fff){
    this.bufferBuilder.append(0xd1);
    this.pack_int16(num);
  } else if ( 0x00000000 <= num && num <= 0xffffffff){
    this.bufferBuilder.append(0xce);
    this.pack_uint32(num);
  } else if (-0x80000000 <= num && num <= 0x7fffffff){
    this.bufferBuilder.append(0xd2);
    this.pack_int32(num);
  } else if (-0x8000000000000000 <= num && num <= 0x7FFFFFFFFFFFFFFF){
    this.bufferBuilder.append(0xd3);
    this.pack_int64(num);
  } else if (0x0000000000000000 <= num && num <= 0xFFFFFFFFFFFFFFFF){
    this.bufferBuilder.append(0xcf);
    this.pack_uint64(num);
  } else{
    throw new Error('Invalid integer');
  }
}

Packer.prototype.pack_double = function(num){
  var sign = 0;
  if (num < 0){
    sign = 1;
    num = -num;
  }
  var exp  = Math.floor(Math.log(num) / Math.LN2);
  var frac0 = num / Math.pow(2, exp) - 1;
  var frac1 = Math.floor(frac0 * Math.pow(2, 52));
  var b32   = Math.pow(2, 32);
  var h32 = (sign << 31) | ((exp+1023) << 20) |
      (frac1 / b32) & 0x0fffff;
  var l32 = frac1 % b32;
  this.bufferBuilder.append(0xcb);
  this.pack_int32(h32);
  this.pack_int32(l32);
}

Packer.prototype.pack_object = function(obj){
  var keys = Object.keys(obj);
  var length = keys.length;
  if (length <= 0x0f){
    this.pack_uint8(0x80 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xde);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdf);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  for(var prop in obj){
    if (obj.hasOwnProperty(prop)){
      this.pack(prop);
      this.pack(obj[prop]);
    }
  }
}

Packer.prototype.pack_uint8 = function(num){
  this.bufferBuilder.append(num);
}

Packer.prototype.pack_uint16 = function(num){
  this.bufferBuilder.append(num >> 8);
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_uint32 = function(num){
  var n = num & 0xffffffff;
  this.bufferBuilder.append((n & 0xff000000) >>> 24);
  this.bufferBuilder.append((n & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((n & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((n & 0x000000ff));
}

Packer.prototype.pack_uint64 = function(num){
  var high = num / Math.pow(2, 32);
  var low  = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low  & 0xff000000) >>> 24);
  this.bufferBuilder.append((low  & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low  & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((low  & 0x000000ff));
}

Packer.prototype.pack_int8 = function(num){
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_int16 = function(num){
  this.bufferBuilder.append((num & 0xff00) >> 8);
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_int32 = function(num){
  this.bufferBuilder.append((num >>> 24) & 0xff);
  this.bufferBuilder.append((num & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((num & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((num & 0x000000ff));
}

Packer.prototype.pack_int64 = function(num){
  var high = Math.floor(num / Math.pow(2, 32));
  var low  = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low  & 0xff000000) >>> 24);
  this.bufferBuilder.append((low  & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low  & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((low  & 0x000000ff));
}

function _utf8Replace(m){
  var code = m.charCodeAt(0);

  if(code <= 0x7ff) return '00';
  if(code <= 0xffff) return '000';
  if(code <= 0x1fffff) return '0000';
  if(code <= 0x3ffffff) return '00000';
  return '000000';
}

function utf8Length(str){
  if (str.length > 600) {
    // Blob method faster for large strings
    return (new Blob([str])).size;
  } else {
    return str.replace(/[^\u0000-\u007F]/g, _utf8Replace).length;
  }
}
/**
 * Light EventEmitter. Ported from Node.js/events.js
 * Eric Zhang
 */

/**
 * EventEmitter class
 * Creates an object with event registering and firing methods
 */
function EventEmitter() {
  // Initialise required storage variables
  this._events = {};
}

var isArray = Array.isArray;


EventEmitter.prototype.addListener = function(type, listener, scope, once) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }
  
  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, typeof listener.listener === 'function' ?
            listener.listener : listener);
            
  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // If we've already got an array, just append.
    this._events[type].push(listener);

  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }
  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener, scope) {
  if ('function' !== typeof listener) {
    throw new Error('.once only takes instances of Function');
  }

  var self = this;
  function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  };

  g.listener = listener;
  self.on(type, g);

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener, scope) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var position = -1;
    for (var i = 0, length = list.length; i < length; i++) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener))
      {
        position = i;
        break;
      }
    }

    if (position < 0) return this;
    list.splice(position, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (list === listener ||
             (list.listener && list.listener === listener))
  {
    delete this._events[type];
  }

  return this;
};


EventEmitter.prototype.off = EventEmitter.prototype.removeListener;


EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

EventEmitter.prototype.emit = function(type) {
  var type = arguments[0];
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var l = arguments.length;
        var args = new Array(l - 1);
        for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var l = arguments.length;
    var args = new Array(l - 1);
    for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;
  } else {
    return false;
  }
};




var util = {
  inherits: function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  },
  extend: function(dest, source) {
    for(var key in source) {
      if(source.hasOwnProperty(key)) {
        dest[key] = source[key];
      }
    }
    return dest;
  },
  pack: exports.BinaryPack.pack,
  unpack: exports.BinaryPack.unpack,
  setZeroTimeout: (function(global) {
    var timeouts = [];
    var messageName = 'zero-timeout-message';

    // Like setTimeout, but only takes a function argument.	 There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeoutPostMessage(fn) {
      timeouts.push(fn);
      global.postMessage(messageName, '*');
    }		

    function handleMessage(event) {
      if (event.source == global && event.data == messageName) {
        if (event.stopPropagation) {
          event.stopPropagation();
        }
        if (timeouts.length) {
          timeouts.shift()();
        }
      }
    }
    if (global.addEventListener) {
      global.addEventListener('message', handleMessage, true);
    } else if (global.attachEvent) {
      global.attachEvent('onmessage', handleMessage);
    }
    return setZeroTimeoutPostMessage;
  }(this))
};

exports.util = util;


function Stream() {
  EventEmitter.call(this);
}

util.inherits(Stream, EventEmitter);

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (this.listeners('error').length === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('end', cleanup);
    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('end', cleanup);
  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

exports.Stream = Stream;
function BlobReadStream(source, options){
  Stream.call(this);
  
  options = util.extend({
      readDelay: 0,
      paused: false
  }, options);
  
  this._source = source;
  this._start = 0;
  this._readChunkSize = options.chunkSize || source.size;
  this._readDelay = options.readDelay;
  
  this.readable = true;
  this.paused = options.paused;
  
  this._read();
}

util.inherits(BlobReadStream, Stream);


BlobReadStream.prototype.pause = function(){
  this.paused = true;
};

BlobReadStream.prototype.resume = function(){
  this.paused = false;
  this._read();
};

BlobReadStream.prototype.destroy = function(){
  this.readable = false;
  clearTimeout(this._timeoutId);
};

BlobReadStream.prototype._read = function(){
    
  var self = this;
  
  function emitReadChunk(){
    self._emitReadChunk();
  }
  
  var readDelay = this._readDelay;
  if (readDelay !== 0){
    this._timeoutId = setTimeout(emitReadChunk, readDelay);
  } else {
    util.setZeroTimeout(emitReadChunk);
  }
    
};

BlobReadStream.prototype._emitReadChunk = function(){
    
  if(this.paused || !this.readable) return;
  
  var chunkSize = Math.min(this._source.size - this._start, this._readChunkSize);
  
  if(chunkSize === 0){
      this.readable = false;
      this.emit("end");
      return;
  }
  
  var sourceEnd = this._start + chunkSize;
  var chunk = (this._source.slice || this._source.webkitSlice || this._source.mozSlice).call(this._source, this._start, sourceEnd);
  
  this._start = sourceEnd;
  this._read();
  
  this.emit("data", chunk);
  
};

/*




function BlobWriteStream(options){
    
    stream.Stream.call(this);
    
    options = _.extend({
        onFull: onFull,
        onEnd: function(){},
        minBlockAllocSize: 0,
        drainDelay:0
    }, options);
    
    this._onFull = options.onFull;
    this._onEnd = options.onEnd;
    this._onWrite = options.onWrite;
    
    this._minBlockAllocSize = options.minBlockAllocSize;
    this._maxBlockAllocSize = options.maxBlockAllocSize;
    this._drainDelay = options.drainDelay;
    
    this._buffer = new Buffer(options.minBlockAllocSize);
    this._destination = this._buffer;
    this._destinationPos = 0;
    
    this._writeQueue = [];
    this._pendingOnFull = false;
    this._pendingQueueDrain = false;
    
    this.writable = true;
    this.bytesWritten = 0;
}

util.inherits(BlobWriteStream, stream.Stream);

BlobWriteStream.prototype.getBuffer = function(){
    return this._buffer;
};

BlobWriteStream.prototype.write = function(data, encoding){
    
    if(!this.writable){
        throw new Error("stream is not writable");
    }
    
    if(!Buffer.isBuffer(data)){
        data = new Buffer(data, encoding);
    }
    
    if(data.length){
        this._writeQueue.push(data);
    }
    
    this._commit();
    
    return this._writeQueue.length === 0;
};

BlobWriteStream.prototype._commit = function(){
    
    var self = this;
    
    var destination = this._destination;
    var writeQueue = this._writeQueue;
    
    var startDestinationPos = this._destinationPos;
    
    while(writeQueue.length && destination.length){
        
        var head = writeQueue[0];
        
        var copySize = Math.min(destination.length, head.length);
        
        head.copy(destination, 0, 0, copySize);
        
        head = head.slice(copySize);
        destination = destination.slice(copySize);
        
        this.bytesWritten += copySize;
        this._destinationPos += copySize;
        
        if(head.length === 0){
            writeQueue.shift();
        }
        else{
            writeQueue[0] = head;
        }
    }
    
    this._destination = destination;
    
    bytesCommitted = this._destinationPos - startDestinationPos;
    if(bytesCommitted){
        if(this._onWrite){
            
            if(writeQueue.length){
                this._pendingQueueDrain = true;
            }
            
            // By locking destination the buffer is frozen and the onWrite
            // callback cannot miss any write commits
            this._destination = emptyBuffer;
            
            var consumer = this._onWrite;
            this._onWrite = null;
            
            consumer.call(this, function(nextCallback){
                util.setZeroTimeout(function(){
                    self._destination = destination;
                    self._onWrite = nextCallback;
                    self._commit();
                });
            }, consumer);
            
            return;
        }
    }
    
    if(writeQueue.length){
        
        this._pendingQueueDrain = true;
        this._growBuffer();
    }
    else if(this._pendingQueueDrain){
        
        this._pendingQueueDrain = false;
        
        if(this._drainDelay !== 0){
            setTimeout(function(){
                self.emit("drain");
            }, this._drainDelay);
        }
        else{
            util.setZeroTimeout(function(){
                self.emit("drain");
            });
        }
    }
};

BlobWriteStream.prototype._growBuffer = function(){
    
    var self = this;
    var writeQueue = this._writeQueue;
    
    var requestSize = this._minBlockAllocSize;
    
    var maxBlockAllocSize = this._maxBlockAllocSize;
    var add = (maxBlockAllocSize === undefined ? function(a, b){return a + b;} : function(a, b){return Math.min(a + b, maxBlockAllocSize);});
    
    for(var i = 0, queueLength = writeQueue.length; i < queueLength; i++){
        requestSize = add(requestSize, writeQueue[i].length);
    }
    
    // Prevent concurrent onFull callbacks
    if(this._pendingOnFull){
        return;
    }
    this._pendingOnFull = true;
    
    this._onFull(this._buffer, requestSize, function(buffer, destination){
        util.setZeroTimeout(function(){
            
            self._pendingOnFull = false;
            
            if(!destination){
                if(self.writable){
                    self.emit("error", new Error("buffer is full"));
                }
                self.destroy();
                return;
            }
            
            self._buffer = buffer;
            self._destination = destination;
            
            self._commit();
        });
    });
};

BlobWriteStream.prototype.end = function(data, encoding){
    
    var self = this;
    
    function _end(){
        self.writable = false;
        self._onEnd();
    }
    
    if(data){
        if(this.write(data, encoding)){
            _end();
        }else{
            self.writable = false;
            this.once("drain", _end);
        }
    }
    else{
        _end();
    }
};

BlobWriteStream.prototype.destroy = function(){
    this.writable = false;
    this._pendingQueueDrain = false;
    this._writeQueue = [];
};

BlobWriteStream.prototype.consume = function(consume){
    
    this._buffer = this._buffer.slice(consume);
    this._destinationPos -= consume;
};

BlobWriteStream.prototype.getCommittedSlice = function(){
    return this._buffer.slice(0, this._destinationPos);
};

function onFull(buffer, extraSize, callback){
    var newBuffer = new Buffer(buffer.length + extraSize);
    buffer.copy(newBuffer);
    callback(newBuffer, newBuffer.slice(buffer.length));
}
*/
exports.BlobReadStream = BlobReadStream;

function genGuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function BinaryStream(socket, id, create, meta) {
  if (!(this instanceof BinaryStream)) return new BinaryStream(options);
  
  var self = this;
  
  Stream.call(this);

  
  this.id = id;
  this.guid = genGuid();
  this._socket = socket;
    
  this.writable = true;
  this.readable = true;
  this.paused = false;
  
  this._closed = false;
  this._ended = false;
  
  if(create) {
    // This is a stream we are creating
    meta.guid = self.guid;
    this._write(1, meta, this.id);
  }
}

util.inherits(BinaryStream, Stream);

BinaryStream.prototype.guid = undefined;

BinaryStream.prototype._onDrain = function() {
  if(!this.paused) {
    this.emit('drain');
  }
};

BinaryStream.prototype._onClose = function() {
  // Emit close event
  if (this._closed) {
    return;
  }
  this.readable = false;
  this.writable = false;
  this._closed = true;
  this.emit('close');
};

BinaryStream.prototype._onError = function(error){
  this.readable = false;
  this.writable = false;
  this.emit('error', error);
};

BinaryStream.prototype._onMessage = function(event, msg){    
  this.emit(event, msg);
};

BinaryStream.prototype._onCreateClientConnection = function(connection){
  this.emit('createClientConnection', connection);
};

// Write stream

BinaryStream.prototype._onPause = function() {
  // Emit pause event
  this.paused = true;
  this.emit('pause');
};

BinaryStream.prototype._onResume = function() {
  // Emit resume event
  this.paused = false;
  this.emit('resume');
  this.emit('drain');
};

BinaryStream.prototype._write = function(code, data, bonus) {
  if (this._socket.readyState !== this._socket.constructor.OPEN) {
    return false;
  }
  var message = util.pack([code, data, bonus]);
  return this._socket.send(message) !== false;
};

BinaryStream.prototype.write = function(data) {
  if(this.writable) {
    var out = this._write(2, data, this.id);
    return !this.paused && out;
  } else {
    this.emit('error', new Error('Stream is not writable'));
    return false;
  }
};

BinaryStream.prototype.end = function() {
  this._ended = true;
  this.readable = false;
  this._write(5, null, this.id);
};

BinaryStream.prototype.error = function(error) {
  this._ended = true;
  this.readable = false;
  this._write(7, error, this.id);
};


BinaryStream.prototype.createClientConnection = function(connection) {
  this._write(8, connection, this.id);
};

BinaryStream.prototype.message = function(event, msg) {    
  this._write(9, [event, msg], this.id);
};

BinaryStream.prototype.destroy = BinaryStream.prototype.destroySoon = function() {
  this._onClose();
  this._write(6, null, this.id);
};


// Read stream

BinaryStream.prototype._onEnd = function() {
  if(this._ended) { 
    return;
  }
  this._ended = true;
  this.readable = false;
  this.emit('end');
};

BinaryStream.prototype._onData = function(data) {
  // Dispatch 
  this.emit('data', data);
};

BinaryStream.prototype.pause = function() {
  this._onPause();
  this._write(3, null, this.id);
};

BinaryStream.prototype.resume = function() {
  this._onResume();
  this._write(4, null, this.id);
};


function BinaryClient(socket, options) {
  if (!(this instanceof BinaryClient)) return new BinaryClient(socket, options);
  
  EventEmitter.call(this);
  
  var self = this;
  
  this._options = util.extend({
    chunkSize: 40960
  }, options);
  
  this.streams = {};
  
  if(typeof socket === 'string') {
    this._nextId = 0;
    this._socket = new WebSocket(socket);
  } else {
    // Use odd numbered ids for server originated streams
    this._nextId = 1;
    this._socket = socket;
  }
  
  this._socket.binaryType = 'arraybuffer';
  
  this._socket.addEventListener('open', function(){
    self.emit('open');
  });
  this._socket.addEventListener('error', function(error){
    var ids = Object.keys(self.streams);
    for (var i = 0, ii = ids.length; i < ii; i++) {
      self.streams[ids[i]]._onError(error);
    }
    self.emit('error', error);
  });
  this._socket.addEventListener('close', function(code, message){
    var ids = Object.keys(self.streams);
    for (var i = 0, ii = ids.length; i < ii; i++) {
      self.streams[ids[i]]._onClose();
    }
    self.emit('close', code, message);
  });
  this._socket.addEventListener('message', function(data, flags){
    util.setZeroTimeout(function(){
  
      // Message format
      // [type, payload, bonus ]
      //
      // Reserved
      // [ 0  , X , X ]
      // 
      //
      // New stream
      // [ 1  , Meta , new streamId ]
      // 
      //
      // Data
      // [ 2  , Data , streamId ]
      // 
      //
      // Pause
      // [ 3  , null , streamId ]
      // 
      //
      // Resume
      // [ 4  , null , streamId ]
      // 
      //
      // End
      // [ 5  , null , streamId ]
      // 
      //
      // Close
      // [ 6  , null , streamId ]
      // 
      
      data = data.data;
      
      try {
          data = util.unpack(data);
      } catch (ex) {
          return self.emit('error', new Error('Received unparsable message: ' + ex));
      }
      if (!(data instanceof Array))
          return self.emit('error', new Error('Received non-array message'));
      if (data.length != 3)
          return self.emit('error', new Error('Received message with wrong part count: ' + data.length));
      if ('number' != typeof data[0])
          return self.emit('error', new Error('Received message with non-number type: ' + data[0]));
      
      switch(data[0]) {
        case 0:
          // Reserved
          break;
        case 1:
          var meta = data[1];
          var streamId = data[2];
          var binaryStream = self._receiveStream(streamId, meta.guid);
          self.emit('stream', binaryStream, meta);
          break;
        case 2:
          var payload = data[1];
          var streamId = data[2];
          var binaryStream = self.streams[streamId];
          if(binaryStream) {
            binaryStream._onData(payload);
          } else {
            self.emit('error', new Error('Received `data` message for unknown stream: ' + streamId));
          }
          break;
        case 3:
          var streamId = data[2];
          var binaryStream = self.streams[streamId];
          if(binaryStream) {
            binaryStream._onPause();
          } else {
            self.emit('error', new Error('Received `pause` message for unknown stream: ' + streamId));
          }
          break;
        case 4:
          var streamId = data[2];
          var binaryStream = self.streams[streamId];
          if(binaryStream) {
            binaryStream._onResume();
          } else {
            self.emit('error', new Error('Received `resume` message for unknown stream: ' + streamId));
          }
          break;
        case 5:
          var streamId = data[2];
          var binaryStream = self.streams[streamId];
          if(binaryStream) {
            binaryStream._onEnd();
          } else {
            self.emit('error', new Error('Received `end` message for unknown stream: ' + streamId));
          }
          break;
        case 6:
          var streamId = data[2];
          var binaryStream = self.streams[streamId];
          if(binaryStream) {
            binaryStream._onClose();
          } else {
            self.emit('error', new Error('Received `close` message for unknown stream: ' + streamId));
          }
          break;
        case 7:
          var error = data[1];
          var streamId = data[2];
          var binaryStream = self.streams[streamId];
          if(binaryStream) {
            binaryStream._onError(error);
          } else {
            self.emit('error', new Error('Received `error` message for unknown stream: ' + streamId));
          }
          break;
        case 8:
          var connection = data[1];
          var streamId = data[2];          
          var binaryStream = self.streams[streamId];          
          if(binaryStream) {
            binaryStream._onCreateClientConnection(connection);
          } else {
            self.emit('error', new Error('Received `error` message for unknown stream: ' + streamId));
          }
          break; 
        case 9:          
          var event = data[1][0];
          var msg = data[1][1];
          var streamId = data[2];          
          var binaryStream = self.streams[streamId];          
          if(binaryStream) {            
            binaryStream._onMessage(event, msg);
          } else {
            self.emit('error', new Error('Received `error` message for unknown stream: ' + streamId));
          }
          break;                   
        default:
          self.emit('error', new Error('Unrecognized message type received: ' + data[0]));
      }
    });
  });
}

util.inherits(BinaryClient, EventEmitter);

BinaryClient.prototype.send = function(data, meta){
  var stream = this.createStream(meta);
  if(data instanceof Stream) {
    data.pipe(stream);
  } else if (util.isNode === true) {
    if(Buffer.isBuffer(data)) {
      (new BufferReadStream(data, {chunkSize: this._options.chunkSize})).pipe(stream);
    } else {
      stream.write(data);
    } 
  } else if (util.isNode !== true) {
    if(data.constructor == Blob || data.constructor == File) {
      (new BlobReadStream(data, {chunkSize: this._options.chunkSize})).pipe(stream);
    } else if (data.constructor == ArrayBuffer) {
      var blob;
      if(binaryFeatures.useArrayBufferView) {
        data = new Uint8Array(data);
      }
      if(binaryFeatures.useBlobBuilder) {
        var builder = new BlobBuilder();
        builder.append(data);
        blob = builder.getBlob()
      } else {
        blob = new Blob([data]);
      }
      (new BlobReadStream(blob, {chunkSize: this._options.chunkSize})).pipe(stream);
    } else if (typeof data === 'object' && 'BYTES_PER_ELEMENT' in data) {
      var blob;
      if(!binaryFeatures.useArrayBufferView) {
        // Warn
        data = data.buffer;
      }
      if(binaryFeatures.useBlobBuilder) {
        var builder = new BlobBuilder();
        builder.append(data);
        blob = builder.getBlob()
      } else {
        blob = new Blob([data]);
      }
      (new BlobReadStream(blob, {chunkSize: this._options.chunkSize})).pipe(stream);
    } else {
      stream.write(data);
    }
  }
  return stream;
};

BinaryClient.prototype._receiveStream = function(streamId, guid){
  var self = this;
  var binaryStream = new BinaryStream(this._socket, streamId, false);
  binaryStream.guid = guid;
  binaryStream.on('close', function(){
    delete self.streams[streamId];
  });
  this.streams[streamId] = binaryStream;
  return binaryStream;
};

BinaryClient.prototype.createStream = function(meta){
  if(this._socket.readyState !== WebSocket.OPEN) {
    throw new Error('Client is not yet connected or has closed');
    return;
  }
  var self = this;
  var streamId = this._nextId;
  this._nextId += 2;
  var binaryStream = new BinaryStream(this._socket, streamId, true, meta);
  binaryStream.on('close', function(){
    delete self.streams[streamId];
  });
  this.streams[streamId] = binaryStream;
  return binaryStream;
};

BinaryClient.prototype.close = BinaryClient.prototype.destroy = function() {
  this._socket.close();
};

exports.BinaryClient = BinaryClient;

})(this);

}).call(this,{"isBuffer":require("../node_modules/is-buffer/index.js")})

},{"../node_modules/is-buffer/index.js":5}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var defineProperty = Object.defineProperty;
var gOPD = Object.getOwnPropertyDescriptor;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	'use strict';

	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) { /**/ }

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

// If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
var setProperty = function setProperty(target, options) {
	if (defineProperty && options.name === '__proto__') {
		defineProperty(target, options.name, {
			enumerable: true,
			configurable: true,
			value: options.newValue,
			writable: true
		});
	} else {
		target[options.name] = options.newValue;
	}
};

// Return undefined instead of __proto__ if '__proto__' is not an own property
var getProperty = function getProperty(obj, name) {
	if (name === '__proto__') {
		if (!hasOwn.call(obj, name)) {
			return void 0;
		} else if (gOPD) {
			// In early versions of node, obj['__proto__'] is buggy when obj has
			// __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
			return gOPD(obj, name).value;
		}
	}

	return obj[name];
};

module.exports = function extend() {
	'use strict';

	var options, name, src, copy, copyIsArray, clone;
	var target = arguments[0];
	var i = 1;
	var length = arguments.length;
	var deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}
	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = getProperty(target, name);
				copy = getProperty(options, name);

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						setProperty(target, { name: name, newValue: extend(deep, clone, copy) });

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						setProperty(target, { name: name, newValue: copy });
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],4:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],5:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],6:[function(require,module,exports){
/**
 * Secure random string generator with custom alphabet.
 *
 * Alphabet must contain 256 symbols or less. Otherwise, the generator
 * will not be secure.
 *
 * @param {generator} random The random bytes generator.
 * @param {string} alphabet Symbols to be used in new random string.
 * @param {size} size The number of symbols in new random string.
 *
 * @return {string} Random string.
 *
 * @example
 * const format = require('nanoid/format')
 *
 * function random (size) {
 *   const result = []
 *   for (let i = 0; i < size; i++) {
 *     result.push(randomByte())
 *   }
 *   return result
 * }
 *
 * format(random, "abcdef", 5) //=> "fbaef"
 *
 * @name format
 * @function
 */
module.exports = function (random, alphabet, size) {
  var mask = (2 << Math.log(alphabet.length - 1) / Math.LN2) - 1
  var step = Math.ceil(1.6 * mask * size / alphabet.length)

  var id = ''
  while (true) {
    var bytes = random(step)
    for (var i = 0; i < step; i++) {
      var byte = bytes[i] & mask
      if (alphabet[byte]) {
        id += alphabet[byte]
        if (id.length === size) return id
      }
    }
  }
}

/**
 * @callback generator
 * @param {number} bytes The number of bytes to generate.
 * @return {number[]} Random bytes.
 */

},{}],7:[function(require,module,exports){
'use strict';
module.exports = require('./lib/index');

},{"./lib/index":11}],8:[function(require,module,exports){
'use strict';

var randomFromSeed = require('./random/random-from-seed');

var ORIGINAL = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
var alphabet;
var previousSeed;

var shuffled;

function reset() {
    shuffled = false;
}

function setCharacters(_alphabet_) {
    if (!_alphabet_) {
        if (alphabet !== ORIGINAL) {
            alphabet = ORIGINAL;
            reset();
        }
        return;
    }

    if (_alphabet_ === alphabet) {
        return;
    }

    if (_alphabet_.length !== ORIGINAL.length) {
        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. You submitted ' + _alphabet_.length + ' characters: ' + _alphabet_);
    }

    var unique = _alphabet_.split('').filter(function(item, ind, arr){
       return ind !== arr.lastIndexOf(item);
    });

    if (unique.length) {
        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. These characters were not unique: ' + unique.join(', '));
    }

    alphabet = _alphabet_;
    reset();
}

function characters(_alphabet_) {
    setCharacters(_alphabet_);
    return alphabet;
}

function setSeed(seed) {
    randomFromSeed.seed(seed);
    if (previousSeed !== seed) {
        reset();
        previousSeed = seed;
    }
}

function shuffle() {
    if (!alphabet) {
        setCharacters(ORIGINAL);
    }

    var sourceArray = alphabet.split('');
    var targetArray = [];
    var r = randomFromSeed.nextValue();
    var characterIndex;

    while (sourceArray.length > 0) {
        r = randomFromSeed.nextValue();
        characterIndex = Math.floor(r * sourceArray.length);
        targetArray.push(sourceArray.splice(characterIndex, 1)[0]);
    }
    return targetArray.join('');
}

function getShuffled() {
    if (shuffled) {
        return shuffled;
    }
    shuffled = shuffle();
    return shuffled;
}

/**
 * lookup shuffled letter
 * @param index
 * @returns {string}
 */
function lookup(index) {
    var alphabetShuffled = getShuffled();
    return alphabetShuffled[index];
}

function get () {
  return alphabet || ORIGINAL;
}

module.exports = {
    get: get,
    characters: characters,
    seed: setSeed,
    lookup: lookup,
    shuffled: getShuffled
};

},{"./random/random-from-seed":14}],9:[function(require,module,exports){
'use strict';

var generate = require('./generate');
var alphabet = require('./alphabet');

// Ignore all milliseconds before a certain time to reduce the size of the date entropy without sacrificing uniqueness.
// This number should be updated every year or so to keep the generated id short.
// To regenerate `new Date() - 0` and bump the version. Always bump the version!
var REDUCE_TIME = 1459707606518;

// don't change unless we change the algos or REDUCE_TIME
// must be an integer and less than 16
var version = 6;

// Counter is used when shortid is called multiple times in one second.
var counter;

// Remember the last time shortid was called in case counter is needed.
var previousSeconds;

/**
 * Generate unique id
 * Returns string id
 */
function build(clusterWorkerId) {
    var str = '';

    var seconds = Math.floor((Date.now() - REDUCE_TIME) * 0.001);

    if (seconds === previousSeconds) {
        counter++;
    } else {
        counter = 0;
        previousSeconds = seconds;
    }

    str = str + generate(version);
    str = str + generate(clusterWorkerId);
    if (counter > 0) {
        str = str + generate(counter);
    }
    str = str + generate(seconds);
    return str;
}

module.exports = build;

},{"./alphabet":8,"./generate":10}],10:[function(require,module,exports){
'use strict';

var alphabet = require('./alphabet');
var random = require('./random/random-byte');
var format = require('nanoid/format');

function generate(number) {
    var loopCounter = 0;
    var done;

    var str = '';

    while (!done) {
        str = str + format(random, alphabet.get(), 1);
        done = number < (Math.pow(16, loopCounter + 1 ) );
        loopCounter++;
    }
    return str;
}

module.exports = generate;

},{"./alphabet":8,"./random/random-byte":13,"nanoid/format":6}],11:[function(require,module,exports){
'use strict';

var alphabet = require('./alphabet');
var build = require('./build');
var isValid = require('./is-valid');

// if you are using cluster or multiple servers use this to make each instance
// has a unique value for worker
// Note: I don't know if this is automatically set when using third
// party cluster solutions such as pm2.
var clusterWorkerId = require('./util/cluster-worker-id') || 0;

/**
 * Set the seed.
 * Highly recommended if you don't want people to try to figure out your id schema.
 * exposed as shortid.seed(int)
 * @param seed Integer value to seed the random alphabet.  ALWAYS USE THE SAME SEED or you might get overlaps.
 */
function seed(seedValue) {
    alphabet.seed(seedValue);
    return module.exports;
}

/**
 * Set the cluster worker or machine id
 * exposed as shortid.worker(int)
 * @param workerId worker must be positive integer.  Number less than 16 is recommended.
 * returns shortid module so it can be chained.
 */
function worker(workerId) {
    clusterWorkerId = workerId;
    return module.exports;
}

/**
 *
 * sets new characters to use in the alphabet
 * returns the shuffled alphabet
 */
function characters(newCharacters) {
    if (newCharacters !== undefined) {
        alphabet.characters(newCharacters);
    }

    return alphabet.shuffled();
}

/**
 * Generate unique id
 * Returns string id
 */
function generate() {
  return build(clusterWorkerId);
}

// Export all other functions as properties of the generate function
module.exports = generate;
module.exports.generate = generate;
module.exports.seed = seed;
module.exports.worker = worker;
module.exports.characters = characters;
module.exports.isValid = isValid;

},{"./alphabet":8,"./build":9,"./is-valid":12,"./util/cluster-worker-id":15}],12:[function(require,module,exports){
'use strict';
var alphabet = require('./alphabet');

function isShortId(id) {
    if (!id || typeof id !== 'string' || id.length < 6 ) {
        return false;
    }

    var nonAlphabetic = new RegExp('[^' +
      alphabet.get().replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&') +
    ']');
    return !nonAlphabetic.test(id);
}

module.exports = isShortId;

},{"./alphabet":8}],13:[function(require,module,exports){
'use strict';

var crypto = typeof window === 'object' && (window.crypto || window.msCrypto); // IE 11 uses window.msCrypto

var randomByte;

if (!crypto || !crypto.getRandomValues) {
    randomByte = function(size) {
        var bytes = [];
        for (var i = 0; i < size; i++) {
            bytes.push(Math.floor(Math.random() * 256));
        }
        return bytes;
    };
} else {
    randomByte = function(size) {
        return crypto.getRandomValues(new Uint8Array(size));
    };
}

module.exports = randomByte;

},{}],14:[function(require,module,exports){
'use strict';

// Found this seed-based random generator somewhere
// Based on The Central Randomizer 1.3 (C) 1997 by Paul Houle (houle@msc.cornell.edu)

var seed = 1;

/**
 * return a random number based on a seed
 * @param seed
 * @returns {number}
 */
function getNextValue() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed/(233280.0);
}

function setSeed(_seed_) {
    seed = _seed_;
}

module.exports = {
    nextValue: getNextValue,
    seed: setSeed
};

},{}],15:[function(require,module,exports){
'use strict';

module.exports = 0;

},{}],16:[function(require,module,exports){
module.exports={
  "name": "iobio.js",
  "version": "1.1.1",
  "description": "Client side iobio javascript library for building and executing iobio commands",
  "browser": {
    "binaryjs": "./lib/binary.js"
  },
  "browserify-shim": {
    "external": "global:External"
  },
  "devDependencies": {
    "brfs": "^1.4.0",
    "browserify": "^10.2.0",
    "browserify-istanbul": "^0.2.1",
    "browserify-shim": "~3.8.0",
    "coveralls": "^2.11.2",
    "gulp": "^3.8.11",
    "gulp-sourcemaps": "^1.5.2",
    "gulp-uglify": "^1.2.0",
    "jasmine-core": "^2.4.1",
    "karma": "^0.12.31",
    "karma-browserify": "^4.1.2",
    "karma-chrome-launcher": "^0.1.7",
    "karma-coverage": "0.2.6",
    "karma-firefox-launcher": "^0.1.6",
    "karma-jasmine": "^0.3.5",
    "vinyl-buffer": "^1.0.0",
    "vinyl-source-stream": "^1.1.0"
  },
  "dependencies": {
    "extend": "^2.0.1",
    "inherits": "^2.0.1",
    "shortid": "^2.2.2"
  },
  "scripts": {
    "testServer": "node ./node_modules/karma/bin/karma start test/karma.conf.js",
    "test": "gulp testTravis"
  }
}

},{}],17:[function(require,module,exports){
(function (global){
// Creates and executes iobio commands

// Grab an existing iobio namespace object, or create a blank object
// if it doesn't exist
var iobio = global.iobio || {};
global.iobio = iobio;

iobio.version = require('../package.json').version;

// export if being used as a node module - needed for test framework
if ( typeof module === 'object' ) { module.exports = iobio;}

var EventEmitter = require('events').EventEmitter,
	inherits = require('inherits'),
	shortid = require('shortid'),
	extend = require('extend'),
	conn = require('./conn.js');


// Command function starts here
iobio.cmd = function(service, params, opts) {
	// Call EventEmitter constructor
	EventEmitter.call(this);

	var me = this;

	this.id = shortid.generate()
   	this.options = {
   		/* defaults */
   		id: me.id
   	};
   	extend(this.options, opts);
	this.protocol = this.options.ssl ? 'wss' : 'ws';
	this.service = service;
	this.params = params;
	this.pipedCommands = {};
	this.pipedCommands[ this.options.id ] = this;
	this.argCommands = {};

	// make sure params isn't undefined
	params = params || [];

	// handles the connection
	this.connection = new conn(this.protocol, service, params, this.options);

	// bind stream events
	require('./utils/bindStreamEvents')(this, this.connection);
}

// inherit eventEmitter
inherits(iobio.cmd, EventEmitter);

// functions

// Chain commands
iobio.cmd.prototype.pipe = function(service, params, opts) {

	// Default options
	var options = {
		urlparams : { stdin: this.url() }
	}
	// merge options
	extend(true, options, opts);

	// add current url to params
	params = params || [];
	// params.push( this.url() );

	// create new command
	var newCmd = new iobio.cmd(service, params, options);

	// transfer pipedCommands to new command;
	for (var id in this.pipedCommands ) {
		newCmd.pipedCommands[id] = this.pipedCommands[id];

		// transfer argCommands to new command;
		for (var id in this.connection.urlBuilder.argCommands ) {
			newCmd.connection.urlBuilder.argCommands[id] = this.connection.urlBuilder.argCommands[id];
		}
	}

	return newCmd;
}

// Create url
iobio.cmd.prototype.url = function() { return (this.options.ssl ? 'iobios://' : 'iobio://') + this.connection.uri; }
iobio.cmd.prototype.http = function() { return 'http://' + this.connection.uri; }
iobio.cmd.prototype.https = function() { return 'https://' + this.connection.uri; }
iobio.cmd.prototype.ws = function() { return 'ws://' + this.connection.uri; }
iobio.cmd.prototype.wss = function() { return 'wss://' + this.connection.uri; }
iobio.cmd.prototype.id = this.id


// getters/setters
iobio.cmd.prototype.protocol = function(_) {
	if (!arguments.length) return this.protocol;
	this.protocol = _;
	return this;
}

iobio.cmd.prototype.service = function(_) {
	if (!arguments.length) return this.service;
	this.service = _;
	return this;
}

iobio.cmd.prototype.arguments = function(_) {
	if (!arguments.length) return this.params;
	this.params = _;
	return this;
}

// Execute command
iobio.cmd.prototype.run = function() {

 	// run
	this.connection.run(this.pipedCommands);
	// send pipedCommands so that each command can properly handle the request comming back
	// e.g. if the second command of 3 that are piped together is sending file data then it
	// should handle the request for data coming from the server.
}

// Close client and let server handle cleanup
iobio.cmd.prototype.closeClient = function() {
	if (this.connection && this.connection.runner )
		this.connection.runner.closeClient();
}

// Kill running command instantly, leaving any data in the pipe
iobio.cmd.prototype.kill = function() {
	if (this.connection && this.connection.runner )
		this.connection.runner.kill();
}

// End command safely. This may take a second or two and still give more data
iobio.cmd.prototype.end = function() {
	if (this.connection && this.connection.runner )
		this.connection.runner.end();
}

iobio.cmd.prototype.toString = function() {
	return '[object iobio.cmd]'
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../package.json":16,"./conn.js":18,"./utils/bindStreamEvents":24,"events":2,"extend":3,"inherits":4,"shortid":7}],18:[function(require,module,exports){
// Create connection and handle the results

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var conn = function(protocol, service, params, opts) {
	// Call EventEmitter constructor
	EventEmitter.call(this);

	var me = this;
	this.opts = opts;
	this.service = service;
	this.protocol = protocol;
	this.params = params;

	// create url
	var UrlBuilder = require('./urlBuilder.js');
	var	urlBuilder = new UrlBuilder(service, params, opts);
	this.urlBuilder = urlBuilder;
	this.uri = urlBuilder.uri;

	if (protocol == 'ws' || protocol == 'wss')
		this.Runner  = require('./protocol/ws.js');
	else if (protocol == 'http' || protocol == 'https')
		this.Runner = require('./protocol/http.js');
}

// inherit eventEmitter
inherits(conn, EventEmitter);

// Functions

// Run command on connection
conn.prototype.run = function(pipedCommands) {
	// run
	this.runner = new this.Runner(this.urlBuilder, pipedCommands, this.opts);
	var me = this;

	// bind stream events
	require('./utils/bindStreamEvents')(this,this.runner);
}

module.exports = conn;
},{"./protocol/http.js":19,"./protocol/ws.js":20,"./urlBuilder.js":23,"./utils/bindStreamEvents":24,"events":2,"inherits":4}],19:[function(require,module,exports){

},{}],20:[function(require,module,exports){
// Websocket code for running iobio command and getting results

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var ws = function(urlBuilder, pipedCommands, opts) {
	// Call EventEmitter constructor
	EventEmitter.call(this);

	var protocol = opts.ssl ? 'wss' : 'ws',
		wsUrl = protocol + '://' + urlBuilder.uri,
		BinaryClient = require('binaryjs').BinaryClient,
		client = BinaryClient(wsUrl),
		me = this;

		this.client = client;
		this.stream;

		client.on('open', function(stream){
			var stream = client.createStream({event:'run', params : {'url':wsUrl}}),
				first = true,
				dataClients = [];
			me.stream = stream;

			stream.on('createClientConnection', function(connection) {
				// determine serverAddress
				var serverAddress;
				// grab first half of connection id which is the command id
				var cmdId = connection.id.split('&')[0];

				// get correct command
				var cmd;
				if (pipedCommands[cmdId]) {
					cmd = pipedCommands[cmdId];
					var cmdOpts = cmd.options;
					var cmdUrlBuilder = cmd.connection.urlBuilder;
				} else if (urlBuilder.argCommands[cmdId]) {
					cmd = urlBuilder.argCommands[cmdId];
					var cmdOpts =  cmd.options;
					var cmdUrlBuilder =  cmd.connection.urlBuilder;
				} else {
					var cmdOpts =  opts;
					var cmdUrlBuilder =  urlBuilder;
				}


				// go through by priority
				if (connection.serverAddress)  // defined by requesting iobio service
					serverAddress = connection.serverAddress;
				else if (cmdOpts && cmdOpts.writeStream && cmdOpts.writeStream.serverAddress) // defined by writestream on client
					serverAddress = cmdOpts.writeStream.serverAddress
				else  // defined by client
					serverAddress = cmdUrlBuilder.service;

				// connect to server
				var dataClient = BinaryClient(protocol + '://' + serverAddress);
				dataClients.push(dataClient);
				dataClient.on('open', function() {
					var dataStream = dataClient.createStream({event:'clientConnected', 'connectionID' : connection.id});
					var argPos = connection.argPos || 0;
					var file = cmdUrlBuilder.files[argPos];
					file.write(dataStream, cmdOpts);
					dataStream.on('softend', function() {
						file.end();
					})
				})
            })

			stream.on('data', function(data, options) {
				if(first) { first=false; me.emit('start'); }
				me.emit('data', data);
			});

			stream.on('end', function() {
				me.emit('end');
				me.closeClient();
				dataClients.forEach(function(dc) { dc.close(); })
			})

			stream.on('exit', function(code) {
				me.emit('exit', code);
			})

			stream.on('error', function(error) {
				me.emit('error', error);
			})

			stream.on('queue', function(queue) {
				me.emit('queue', queue)
			})
		});
}

// inherit eventEmitter
inherits(ws, EventEmitter);

ws.prototype.closeClient = function() {
	if (this.client)
		this.client.close();
}

ws.prototype.kill = function() {
	// end stream immediately
	if (this.stream)
		this.stream.end();
}

ws.prototype.end = function() {
	// send end event without ending stream
    // this lets upstream streams end first, which causes
    // downstream streams to end gracefully when the data runs out
	if (this.stream)
		this.stream.message('softend');
}

module.exports = ws;
},{"binaryjs":1,"events":2,"inherits":4}],21:[function(require,module,exports){
// Create iobio url for a file/function command and setup stream for reading the file/function to the iobio web service

var BlobReadStream = require('binaryjs').BlobReadStream;

var file = function(fileObj) {
    var me = this;
    me.fileObj = fileObj
    me.url = encodeURIComponent("http://client");
}

file.prototype.getType = function() { return 'file'; }

file.prototype.getFileObj = function() { return this.fileObj; }

file.prototype.getUrl = function( ) { return this.url; }

file.prototype.write = function(stream, options) {

    var me = this;
    this.stream = stream;
    var chunkSize = options.chunkSize || (500 * 1024);             ;
    // check if fileObj is a function and if so execute it
    if (Object.prototype.toString.call(this.fileObj) == '[object Function]')
        this.fileObj(stream, function() {stream.end()});
    else {
        (new BlobReadStream(this.fileObj, {'chunkSize': chunkSize})).pipe(stream);
    }
}

file.prototype.end = function() {
    if (this.stream) this.stream.end();
}

module.exports = file;
},{"binaryjs":1}],22:[function(require,module,exports){
// Create iobio url for a url command

var url = function(param) {	
	var p = 'http' + param.slice(5,param.length);
	this.url =  encodeURIComponent( p ); 
}

url.prototype.getType = function() { return 'url'; }

url.prototype.getUrl = function( ) { return this.url; }

module.exports = url;
},{}],23:[function(require,module,exports){
// Creates the command

var urlBuilder = function(service, params, opts) {
	var urlParams = require('./utils/hash2UrlParams.js'),
		eventEmitter = require('events').EventEmitter(),
		fileParameter = require('./source/file.js'),
		urlParameter = require('./source/url.js'),
		fileSource = false;

		opts = opts || {};

	this.uri = null;
	this.service = service;
	this.files = [];
	this.argCommands = {};
	var me = this;

	// handle iobio urls and files/functions
	for (var i=0; i< params.length; i++) {
		if (Object.prototype.toString.call(params[i]) == '[object File]' || Object.prototype.toString.call(params[i]) == '[object Blob]' || Object.prototype.toString.call(params[i]) == '[object Function]') {
			fileSource = true;
			var source = new fileParameter(params[i]);
			me.files.push( source );
			params[i] = source.getUrl();
		} else if(params[i].toString() == '[object iobio.cmd]') {
			me.argCommands[params[i].id] = params[i];
			var source = new urlParameter(params[i].url());
			params[i] = source.getUrl();
		} else if(params[i].toString().slice(0,8) == 'iobio://') {
			var source = new urlParameter(params[i]);
			params[i] = source.getUrl();
		}
	}

	// handle stdin special case
	if(opts && opts.urlparams && opts.urlparams.stdin) {
		var source = new urlParameter(opts.urlparams.stdin);
		opts.urlparams.stdin = source.getUrl();
	}

	// create source url
	this.uri =  encodeURI(service + '?cmd=' + params.join(' ') + urlParams(opts.urlparams) + urlParams({id:opts.id}));
	if (fileSource) this.uri += '&protocol=websocket';

	// add iobio version
	this.uri += '&iobiojsversion=' + iobio.version;
}

module.exports = urlBuilder;
},{"./source/file.js":21,"./source/url.js":22,"./utils/hash2UrlParams.js":25,"events":2}],24:[function(require,module,exports){
var bindStreamEvents = function(parent, child) {
	// handle events
	child.on('data', function(data) { parent.emit('data',data)});
	child.on('end',   function() { parent.emit('end')});
	child.on('start', function() { parent.emit('start')});
	child.on('exit', function(code) { parent.emit('exit',code)});
	child.on('error', function(error) { parent.emit('error',error)});
	child.on('queue', function(queue) { parent.emit('queue', queue)});
}

module.exports = bindStreamEvents;
},{}],25:[function(require,module,exports){
var urlParams = function(params) {
	var str = ''
	if (params)
		str = '&' + Object.keys(params).map(function(k) { return k+'='+params[k]}).join('&');		
	return str;
}

module.exports = urlParams;
},{}]},{},[17])

//# sourceMappingURL=iobio.js.map
