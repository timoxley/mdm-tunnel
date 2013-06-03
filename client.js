"use strict"

var log = require('debug')('client')
var MuxDemux = require('mux-demux')
var combine = require('stream-combiner')
var ms = require('msgpack-stream')
var net = require('net')

/**
 * @param program.services
 * @param program.id
 *
 * @return MuxDemux Stream
 */

module.exports = function(program) {
  var services = program.services
  var mx = MuxDemux({
    wrapper: function (stream) {
      return combine(ms.createDecodeStream(), stream, ms.createEncodeStream())
    }
  })

  authenticate(program.id, mx)
  mx.on('connection', function(req) {
    log('new connection', req.meta)
    if (!req.meta.service && req.meta !== 'services') {
      log('no service specified')
      return req.end()
    }

    if (req.meta.service) return getService(req)
    if (req.meta === 'services') return getServices(req)
  })
  return mx

  function getServices(req) {
    req.write(Object.keys(services).join(','))
    req.end()
  }

  function getService(req) {
    var service = req.meta.service
    var port = services[req.meta.service]

    log('service request', service)
    var socket = net.connect({port: port})
    socket.on('error', function(error) {
      log('socket error', service, port, error)
      req.end()
    })

    req.pipe(socket).pipe(req)
  }

  function authenticate(id, mx) {
    // Authorize
    if (!id) {
      log('no auth supplied!', id)
      return
    }
    log('sending auth', id)
    var authStream = mx.createStream({
      auth: { id: id }
    })
    authStream.write({ id: id })
    authStream.end()
  }
}


