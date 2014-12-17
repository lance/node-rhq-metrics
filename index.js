// # rhq-metrics
//
// Provides a simple asynchronous API in a Node.js environment for fetching 
// and writing time-series data in RHQ-metrics.
//
// ## Usage
//
//     var RHQ = require('rhq-metrics');
//     var rhq = new RHQ({
//       host: 'servername.com',
//       port: 9000
//     });
//     
//     rhq.post({
//       id: 'server1',
//       value: 93.2,
//       timestamp: Date.now()}, function(e) {
//         rhq.get('server1', function(err, result) {
//           console.log(result);
//         });
//       });
//

// _**RHQ**_ Create a new RHQ object.
//
// **options** RHQ server options. Not required.
// * `options.host` - the server hostname. Defaults to `'localhost'`
// * `options.port` - the server port. Defaults to `8080`
// * `options.path` - the REST API path. Defaults to `'/rhq-metrics/metrics'`
function RHQ(options) {
  if (!(this instanceof RHQ)) return new RHQ(options);
  options = options || {};
  this.host = options.host || 'localhost';
  this.port = options.port || 8080;
  this.path = options.path || '/rhq-metrics/metrics';
}

// _**RHQ.prototype.get**_ Get a set of time series data for a given `id`.
//
// **id** a string identifier for the dataset. E.g. `'server1'`
//
// **options** an object specifying query options (optional)
// * `options.start` - the start date in msec since the epoch. Defaults to
//   now - 8 hours
// * `options.end` - the end date for the dataset in msec since the epoch.
//   Defaults to now.
// * `options.buckets` - number of intervals (buckets) to divide the time
//   range. Setting this to 60, for example, will return 60 equally spaced
//   intervals for the time period between start and end time, having min, avg,
//   and max calculated for each interval.
//
// **callback** an optional callback function. It will be called when all data
//   has been retrieved and buffered. Parameters for the callback function 
//   are a possible error, and response data as an Array.
//
RHQ.prototype.get = function(id, options, callback) {
  if (typeof id !== 'string') throw new TypeError('id must be a string');

  switch (typeof options) {
    case 'object':
      callback = callback || function(){};
      break;
    case 'undefined':
      options = {};
      callback = callback || function(){};
      break;
    case 'function':
      callback = options;
      options = {};
      break;
  }

  var path = [this.path, id].join('/') +
             '?start=' + (options.start || defaultStart()) +
             '&end=' + (options.end || defaultEnd());

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
        callback(null, JSON.parse(buffer.getContentsAsString('utf8'))); 
      });
    });
  });

  request.on('error', function(e) {
    callback(e);
  });
};

// _**RHQ.prototype.post**_ Get a set of time series data.
// 
// **data** Timeseries data to post to the rhq-metrics server. Can be either
//   an object or an array of objects. Data objects should have the 
//   following properties.
//   * _id_ - The string ID for the data point, e.g. `cpu1`
//   * _value_ The numeric value for the data point, e.g. `89.34`
//   * _timestamp_ Milliseconds since the epoch, e.g. `Date.now()`
RHQ.prototype.post = function(data, callback) {
  var httpOpts = {
    hostname: this.host,
    port: this.port,
    path: this.path,
    method: 'POST',
    agent: false,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (!(data instanceof Array)) data = [data];
  if (typeof callback !== 'function') callback = function() {};

  var request = http.request(httpOpts, function(res) {
    process.nextTick(callback);
  });

  if (!request) {
    callback(new Error());
    return false;
  }

  request.on('error', function(e) {
    callback(e);
  });

  request.write(JSON.stringify(data));
  request.end();
  return true;
};


// A dataset has a default start parameter of 8 hours ago.
function defaultStart() {
  return Date.now()-(8*60*60*1000);
}

// A dataset has a default end parameter of `Date.now()`
function defaultEnd() {
  return Date.now();
}

module.exports = RHQ;

var http = require('http');
var streamBuffers = require('stream-buffers');
