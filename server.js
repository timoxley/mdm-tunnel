var MuxDemux = require('mux-demux')
var combine = require('stream-combiner')
var ms = require('msgpack-stream')
var log = require('debug')('server')

module.exports = function(program) {
  log('client connected')
  var clients = program.clients
  var mx = MuxDemux({
    wrapper: function (stream) {
      return combine(ms.createDecodeStream(), stream, ms.createEncodeStream())
    }
  })

  // auth
  var id
  mx.on('connection', function(stream) {
    log('connection established')
    if (!stream.meta.auth) return
    var auth = stream.meta.auth
    log('client identified', auth.id)
    clients[auth.id] = mx
    id = auth.id
    stream.end()
  })
  mx.on('end', function() {
    log('client disconnected', id)
    id && delete clients[id]
  })
  return mx
}
