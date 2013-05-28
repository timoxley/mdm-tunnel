var net = require('net')
var MuxDemux = require('mux-demux')
var combine = require('stream-combiner')
var ms = require('msgpack-stream')
var httppp = require('httppp')
var responseStream = require('response-stream')
var through = require('through')
var log = require('debug')('router')

module.exports = function(program, socket, findId, findService) {
  var lookup
  if (arguments.length === 3) {
    lookup = findId
  } else {
    findId = findId || module.exports.subdomainToId
    findService = findService || module.exports.subdomainToService
    lookup = function(cb) {
      findId(function(err, id) {
        findService(function(err, service) {
          cb(err, id, service)
        })
      })
    }
  }

  lookup = lookup || defaultLookup

  var clients = program.clients
  log('new connection')
  var parser = httppp(parseHeaders(lookup))
  return parser
}

function parseHeaders = function(lookup) {
  return function(headers) {
    lookup(headers, function(err, id, service) {
      if (err) {
        log('lookup error', err)
        socket.end()
      }
      var host = (headers[2].host && headers[2].host.length) ? headers[2].host[0] : null
      var mx = clients[id]
      if (!mx) {
        log('client not connected', id)
        return socket.end()
      }
      log('requesting service', service || '*')
      if (!service) {
        parser.pipe(mx.createStream(
          'services'
        )).pipe(through(function(data) {
          var rs = responseStream(socket)
          rs.writeHead(200, {'Content-Type':'text/html'})
          rs.write(servicesList(data, host))
          rs.end()
        }))
        return
      }
      parser.pipe(mx.createStream({
        service: service
      })).pipe(socket);
    })
  }
}

function subdomainToId(headers, fn) {
  var host = (headers[2].host && headers[2].host.length) ? headers[2].host[0] : null
  if (!host) return cb(new Error('could not parse host' + headers[2]))

  var hostname = host.split(":").shift() // remove port from host header
  var subdomain = hostname.split('.')
  var service = subdomain[0]
  var id = subdomain[1]
  if (subdomain.length === 3) {
    id =  subdomain[0]
    service = false
  }
  fn(null, id)
}

function subdomainToService(headers, cb) {
  var host = (headers[2].host && headers[2].host.length) ? headers[2].host[0] : null
  if (!host) return cb(new Error('could not parse host' + headers[2]))
  var hostname = host.split(":").shift() // remove port from host header
  var subdomain = hostname.split('.')
  var service = subdomain[0]
  if (subdomain.length === 3) {
    service = false
  }
  fn(null, service)
}

function defaultAuth(headers, cb) { cb(null) }

function servicesList(data, host) {
  var a = [
'<!DOCTYPE html>',
'<html>',
  '<head>',
    '<title>Services</title>',
    '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
  '</head>',
  '<body>',
  '<ul>'
  ].concat(data.split(',').map(function(item) {
    return '<li><a href="http://'+item + '.' + host+'">'+item+'</a></li>'
  })).concat([
  '</ul>',
  '</body>',
  '</html>'
  ]).join('\n')
  return a
}

