"use strict"

var log = require('debug')('client')
var through = require('through')
var MuxDemux = require('mux-demux')
var combine = require('stream-combiner')
var ms = require('msgpack-stream')
var net = require('net')

module.exports = function(program) {
  var services = program.services
  log('sending auth', program.user)
  var mx = MuxDemux({
    wrapper: function (stream) {
      return combine(ms.createDecodeStream(), stream, ms.createEncodeStream())
    }
  })
  // Authorize
  var authStream = mx.createStream({
    auth: { id: program.user }
  })
  authStream.write({ id: program.user })
  authStream.end()

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
}


