# node-rqh-metrics

[![Build Status](https://travis-ci.org/lance/node-rhq-metrics.svg?branch=master)](https://travis-ci.org/lance/node-rhq-metrics)

This is a Javascript API and NPM module package for the `rhq-metrics` server.

## Usage

    var RHQ = require('node-rhq-metrics');

    var rhq = new RHQ({
      host: 'metricserver.com', // defaults to 'localhost'
      port: 4567, // defaults to 8080
      path: '/rhq-metrics/metrics' // defaults to '/rhq-metrics/metrics'
    });
    
    // all configuration parameters are optional
    var options = {
      start: Date.now()-(4*60*60*1000), // defaults to 8 hours ago
      end: Date.now(), // defaults to now
      buckets: 20 // defaults to null - data is not bucketed
    };

    rhq.get('server1', options, function(er, result) {
        // result is an array of timeseries data
        // [{'timestamp': 1418672557728, 'value': 72.3}]
    });

## Development

First clone the project.

    $ git clone https://github.com/lance/node-rhq-metrics.git

Then change into the project directory, install the dev dependencies, and build it.

    $ cd node-rhq-metrics
    $ npm install
    $ grunt

This will run all tests and generate documentation.
