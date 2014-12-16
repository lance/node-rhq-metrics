var assert = require('assert');

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


    // TODO - figure out how to deal with rhq-metrics server during tests
  });

});
