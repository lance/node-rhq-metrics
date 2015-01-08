/**
 * # rhq-metrics
 *
 * Provides a simple asynchronous API in a Node.js environment for fetching 
 * and writing time-series data in RHQ-metrics.
 *
 * ## Usage
 *
 *     var RHQ = require('rhq-metrics');
 *     var rhq = new RHQ({
 *       host: 'servername.com',
 *       port: 9000
 *     });
 *     
 *     rhq.post({
 *       id: 'server1',
 *       value: 93.2,
 *       timestamp: Date.now()}, function(e) {
 *         rhq.get('server1', function(err, result) {
 *           console.log(result);
 *         });
 *       });
 */

/**
 * Create a new RHQ object instance. Options are: 
 * `options.host` - the server hostname. Defaults to `'localhost'` 
 * `options.port` - the server port. Defaults to `8080` 
 * `options.path` - the REST API path. Defaults to `'/rhq-metrics/metrics'` 
 *
 * @param {Object} options RHQ server options.
 * @return {Object} A new RHQ instance.
 */
function RHQ(options) {
  if (!(this instanceof RHQ)) return new RHQ(options);
  options = options || {};
  this.host = options.host || 'localhost';
  this.port = options.port || 8080;
  this.path = options.path || '/rhq-metrics/metrics';
}

/**
 * Get an array of time series data for a given `id`.
 *
 * The options parameter recognizes the following properties:
 *   `options.start` - the start date in msec since the epoch. Defaults to
 *   now - 8 hours
 *   `options.end` - the end date for the dataset in msec since the epoch.
 *   Defaults to now.
 *   `options.buckets` - number of intervals (buckets) to divide the time
 *   range. Setting this to 60, for example, will return 60 equally spaced
 *   intervals for the time period between start and end time, having min, avg,
 *   and max calculated for each interval.
 *
 * @param {String} id A string identifier for the dataset. E.g. `'server1'`
 *
 * @param {Object} options An object specifying query options (optional)
 *
 * @param {Function} callback An optional callback function. 
 *   It will be called when all data has been retrieved and buffered.
 *   Parameters for the callback function are a possible error, and response
 *   data as an Array.
 */
RHQ.prototype.get = function(id, options, callback) {
  if (typeof id !== 'string') throw new TypeError('id must be a string');
  var deferred = Q.defer();

  switch (typeof options) {
    case 'undefined':
      options = {};
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
        deferred.resolve(JSON.parse(buffer.getContentsAsString('utf8')));
      });
    });
  });

  request.on('error', function(e) {
    deferred.reject(e);
  });
  return deferred.promise.nodeify(callback);
};

/**
 * Post a set of time series data. The data can be either an object or an array
 * of objects. The data objects themselves should have the following properties:
 * 
 *   `data.id` - The string ID for the data point, e.g. `cpu1`
 *   `data.value` The numeric value for the data point, e.g. `89.34`
 *   `data.timestamp` Milliseconds since the epoch, e.g. `Date.now()`
 *
 * @param {Object|Array} data Time series data for the rhq-metrics server. 
 * @param {Function} callback An optional callback function
 */
RHQ.prototype.post = function(data, callback) {

  if (!data || (typeof data !== 'object')) 
    throw TypeError('Cannot post unknown type');
  if (!(data instanceof Array)) data = [data];

  var deferred = Q.defer();
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

  var request = http.request(httpOpts, function(res) {
    deferred.resolve();
  });

  if (!request) {
    return deferred.reject(new Error('Cannot request from ' + this.host));
  }

  request.on('error', function(e) {
    deferred.reject(e);
  });

  request.write(JSON.stringify(data));
  request.end();
  return deferred.promise.nodeify(callback);
};


/**
 * A dataset has a default start parameter of 8 hours ago.
 * @ignore
 */
function defaultStart() {
  return Date.now()-(8*60*60*1000);
}

/**
 * A dataset has a default end parameter of `Date.now()`
 * @ignore
 */
function defaultEnd() {
  return Date.now();
}

// @ignore
module.exports = RHQ;

/** @ignore */
var http = require('http');
/** @ignore */
var streamBuffers = require('stream-buffers');
/** @ignore */
var Q = require('q');

