var net = require('net')
var MuxDemux = require('mux-demux')
var combine = require('stream-combiner')
var ms = require('msgpack-stream')
var httppp = require('httppp')
var responseStream = require('response-stream')
var through = require('through')
var log = require('debug')('router')

/**
 * Routes incoming http requests to their respective tunnel clients.
 *
 * Use `findId` and `findService` to customise the routing mechanism.
 * These functions are passed the headers and a callback and should invoke the
 * callback with (err, result).
 *
 * The default implementation maps `service.id.example.com` to the client authenticated with id 'id'
 * and service 'service'.
 *
 * If supplied with `findId` but not `findService`, assumes `findId` will return
 * (err, id, service)
 *
 * @param {Object} program.clients store of clients.
 * @param {Socket} socket external socket connection (e.g. browser).
 * @param {Function} [findId] match http headers with connected clients.
 * @param {Function} [findService] match http headers with service names.
 * @return {Stream} httppp parser stream.
 * @api public
 */

module.exports = function(program, socket, findId, findService) {
  var lookup
  if (arguments.length === 3) {
    lookup = findId
  } else {
    findId = findId || subdomainToId
    findService = findService || subdomainToService
    lookup = function(headers, cb) {
      findId(headers, function(err, id) {
        findService(headers, function(err, service) {
          cb(err, id, service)
        })
      })
    }
  }

  var clients = program.clients
  log('new connection')
  var parser = httppp(parseHeaders(clients, lookup, socket))
  return parser
}

function parseHeaders(clients, lookup, socket) {
  return function(headers) {
    var self = this
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
      self.pipe(mx.createStream({
        service: service
      })).pipe(socket);
    })
  }
}

/**
 * Maps subdomains to client id like: user.example.com -> user
 * @api private
 */

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

/**
 * Maps subdomains to service names like: logs.user.example.com -> logs
 * @api private
 */

function subdomainToService(headers, fn) {
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

/**
 * @api private
 */
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

