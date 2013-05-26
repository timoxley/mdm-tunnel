var Client = require('../client')
var Server = require('../server')
var MuxDemux = require('mux-demux')
var combine = require('stream-combiner')
var ms = require('msgpack-stream')

it('will not connect if not supplied a user', function(done) {
  var clients = {}

  var client = Client({
    user: false
  })

  var server = MuxDemux({
    wrapper: function (stream) {
      return combine(ms.createDecodeStream(), stream, ms.createEncodeStream())
    }
  })

  server.on('connection', function() {
    done(new Error('Should not connect!'))
  })

  client.pipe(server).pipe(server)
  setTimeout(done, 100)
})
