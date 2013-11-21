"use strict"

var log = require('debug')('client')
var MuxDemux = require('mux-demux')
var combine = require('stream-combiner')
var ms = require('msgpack-stream')
var net = require('net')

/**
 * @param options.id
 * @param options.services
 *
 * @return MuxDemux Stream
 */

module.exports = function(options) {
  options = options || {}
  var id = options.id
  var services = options.services

  var mx = MuxDemux({
    wrapper: function (stream) {
      return combine(ms.createDecodeStream(), stream, ms.createEncodeStream())
    }
  })

  mx.on('connection', function(req) {
    log('new connection', req.meta)
    if (!req.meta.service && req.meta !== 'services') {
      log('no service specified')
      return req.end()
    }

    if (req.meta.service) return getService(req)
    if (req.meta === 'services') return getServices(req)
  })
  authenticate(id, mx)
  return mx

  function getServices(req) {
    req.write(Object.keys(services).join(','))
    req.end()
  }

  function getService(req) {
    var service = req.meta.service
    if(!services[req.meta.service]){
      log('unknown service', service)
      return req.end()
    }
    var port = services[req.meta.service]
    log('service request', service)    
    var socket = net.connect({port: port})
    socket.on('error', function(error) {
      log('socket error', service, port, error)
      return req.end()
    })

    return req.pipe(socket).pipe(req)
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


