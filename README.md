# node-rqh-metrics

[![Build Status](https://travis-ci.org/lance/rhq-metrics-js.svg?branch=master)](https://travis-ci.org/lance/rhq-metrics-js)

This is a Javascript API and NPM module package for the `rhq-metrics` server.

## Usage
First you need to require the `rhq-metrics` module.

    var RHQ = require('rhq-metrics');

The constructor function takes an options object where you can specify
values for the RHQ server hostname, the port, and the URL path. The
default URL for the server is http://localhost:8080/rhq-metrics/metrics.

    var rhq = new RHQ({
      host: 'metricserver.com', // defaults to 'localhost'
      port: 4567, // defaults to 8080
      path: '/rhq-metrics/metrics' // defaults to '/rhq-metrics/metrics'
    });

Timeseries data is posted as either a single JS object, or an array of objects.
In either case, the three fields are required: `id`, `value`, and `timestamp`.

    var data = [{id: 'server1', value: 44.1, timestamp: 1418672557728},
                {id: 'server1', value: 23.9, timestamp: 1418672557738},
                {id: 'server1', value: 34.7, timestamp: 1418672557748},
                {id: 'server1', value: 68.5, timestamp: 1418672557758}];


You can use a promises style API, or old school node-style callbacks.
Here is a promises usage.
    
    // all configuration parameters are optional
    var options = {
      start: Date.now()-(4*60*60*1000), // defaults to 8 hours ago
      end: Date.now(), // defaults to now
      buckets: 20 // defaults to null - data is not bucketed
    };

    rhq.post(data)
      .then(function() {
        rhq.get('server1', options)
          .then(function(data) {
            // data is an array of timeseries objects for 'server1'
            // [{'timestamp': 1418672557728, 'value': 72.3}]
           });
      });

And here is the old school, node style.

    rhq.post(data,
      function() {
        rhq.get('server1', options, function(er, result) {
            // result is an array of timeseries data
            // [{'timestamp': 1418672557728, 'value': 72.3}]
        });
      });

## Development

First clone the project.

    $ git clone https://github.com/lance/node-rhq-metrics.git

Then change into the project directory, install the dev dependencies, and build it.

    $ cd node-rhq-metrics
    $ npm install
    $ grunt

This will run all tests and generate documentation.
