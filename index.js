
require('date-utils');
var http = require('http');
var streamBuffers = require('stream-buffers');

function RHQ(options) {
  if (!this instanceof RHQ) return new RHQ(options);
  options = options || {};
  this.host = options.host || 'localhost';
  this.port = options.port || '8080';
  this.path = options.path || '/rhq-metrics/metrics';
}

RHQ.prototype.get = function(id, options, callback) {
  if (!isString(id)) throw new TypeError('id must be a string');

  if (!options) {
    options = {};
    callback = function(b) { console.log(b); };
  } else if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var path = [this.path, id].join('/') +
             '?start=' + (options.start || new Date().removeHours(8).getTime()) +
             '&end=' + (options.end || Date.now());

  if (options.buckets) path += '&buckets=' + options.buckets;

  var httpOpts = {
    hostname: this.host,
    port: this.port,
    path: path,
  };

  var request = http.get(httpOpts, function(res) {
    var buffer = new streamBuffers.WritableStreamBuffer();

    res.on('data', function(chunk) {
      buffer.write(chunk);
    });

    res.on('end', function() {
      process.nextTick(function() { 
        callback(buffer.getContentsAsString('utf8')); 
      });
    });
  });

  request.on('error', function(e) {
    // TODO: handle error and bubble to client
    console.error('ERROR: ' + e);
  });
      
};


function isString(s) {
  return s && (typeof s === 'string');
}

module.exports = RHQ;

