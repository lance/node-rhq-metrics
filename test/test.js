var assert = require('assert');
var nock = require('nock');

describe('node-rhq-metrics module', function() {
  var RHQ = require('../');

  it('should export an RHQ constructor function', function() {
    assert(new RHQ() instanceof RHQ);
    assert(RHQ() instanceof RHQ);
  });

  it('should expect single options parameter to the constructor', function() {
    assert(RHQ.length === 1);
  });

  describe('RHQ objects', function() {

    it('should have sane defaults', function() {
      var sut = new RHQ();
      assert(sut.host === 'localhost');
      assert(sut.port === 8080);
      assert(sut.path === '/rhq-metrics/metrics');
    });

    it('should honor the options parameters', function() {
      var sut = new RHQ({port: 80, host: 'example.com', path: '/foobar'});
      assert(sut.host === 'example.com');
      assert(sut.port === 80);
      assert(sut.path === '/foobar');
    });

  });

  describe('RHQ.prototype.get', function() {
    it('should throw TypeError if the first param is not a string', function() {
      var sut = new RHQ();
      function assertThrowsWith(v) {
        try {
          sut.get(v);
          assert(false);
        } catch(e) {
          assert(e instanceof TypeError);
        }
      }
      assertThrowsWith(null);
      assertThrowsWith(undefined);
      assertThrowsWith(100);
      assertThrowsWith([]);
      assertThrowsWith({});
    });

    it('should callback with an exception if the server is not found', function() {
      var sut = new RHQ({host:'badservername'});
      sut.get('foo', function(err, result) {
        assert(err instanceof Error);
        assert(err.code === 'ENOTFOUND');
      });
    });

    it('should promise with an exception if the server is not found', function() {
      var sut = new RHQ({host:'badservername'});
      sut.get('foo')
        .then(function(err) {
          assert(err instanceof Error);
          assert(err.code === 'ENOTFOUND');
        });
    });

    it('should callback with an array of timeseries data', function(done) {
      var data = [{value:23, timestamp:100},
                  {value:94, timestamp:200},
                  {value:82, timestamp:300}];
      var rhqServer = nock('http://localhost:8080')
                        // filter the start/end timestamps
                        .filteringPath(/\?start=[0-9]+&end=[0-9]+/, '')
                        .get('/rhq-metrics/metrics/cpu1')
                        .reply(200, JSON.stringify(data));
      var sut = new RHQ();
      sut.get('cpu1', function(err, result) {
        assert(!err);
        assert(result instanceof Array);
        assert(result.length === 3);
        assert(result[0].value === data[0].value);
        assert(result[1].value === data[1].value);
        assert(result[2].value === data[2].value);
        done();
      });
    
    });

    it('should promise with an array of timeseries data', function(done) {
      var data = [{value:23, timestamp:100},
                  {value:94, timestamp:200},
                  {value:82, timestamp:300}];
      var rhqServer = nock('http://localhost:8080')
                        // filter the start/end timestamps
                        .filteringPath(/\?start=[0-9]+&end=[0-9]+/, '')
                        .get('/rhq-metrics/metrics/cpu1')
                        .reply(200, JSON.stringify(data));
      var sut = new RHQ();
      sut.get('cpu1')
        .then(function(result) {
          assert(result instanceof Array);
          assert(result.length === 3);
          assert(result[0].value === data[0].value);
          assert(result[1].value === data[1].value);
          assert(result[2].value === data[2].value);
          done();
        });
    });
    
  });

  describe('RHQ.prototype.post', function() {
    it('should throw a TypeError if data is not an array or object', function() {
      var sut = new RHQ();
      function assertThrowsWith(v) {
        try {
          sut.post(v);
          assert(false);
        } catch(e) {
          assert(e instanceof TypeError);
        }
      }
      assertThrowsWith(null);
      assertThrowsWith(undefined);
      assertThrowsWith(1);
    });

    it('should callback with an exception if the server is not found', function() {
      var sut = new RHQ({host:'badservername'});
      sut.post({}, function(err, result) {
        assert(err instanceof Error);
        assert(err.code === 'ENOTFOUND');
      });
    });

    it('should promise with an exception if the server is not found', function() {
      var sut = new RHQ({host:'badservername'});
      sut.post({})
        .then(function(err) {
          assert(err instanceof Error);
          assert(err.code === 'ENOTFOUND');
        });
    });

    it('should callback on success', function(done) {
      var data = [{id:'cpu1', value:23, timestamp:100},
                  {id:'cpu1', value:94, timestamp:200},
                  {id:'cpu1', value:82, timestamp:300}];
      var rhqServer = nock('http://localhost:8080')
                        .post('/rhq-metrics/metrics', data)
                        .reply(201, {ok:true});
      var sut = new RHQ();
      sut.post(data, function(err) {
        assert(!err);
        done();
      });
    });

    it('should promise on success', function(done) {
      var data = [{id:'cpu1', value:23, timestamp:100},
                  {id:'cpu1', value:94, timestamp:200},
                  {id:'cpu1', value:82, timestamp:300}];
      var rhqServer = nock('http://localhost:8080')
                        .post('/rhq-metrics/metrics', data)
                        .reply(201, {ok:true});
      var sut = new RHQ();
      sut.post(data)
        .then(function(err) {
          assert(!err);
          done();
        });
    });

  });

});
