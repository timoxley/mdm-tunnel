var net = require('net')
var MuxDemux = require('mux-demux')
var combine = require('stream-combiner')
var ms = require('msgpack-stream')
var httppp = require('httppp')
var responseStream = require('response-stream')
var through = require('through')
var log = require('debug')('router')

module.exports = function(program, socket, findId, findService) {

  findId = findId || subdomainToId
  findService = findService || subdomainToService

  var clients = program.clients
  log('new connection')
  var parser = httppp(function(info) {
    var id = findId(info)
    var service = findService(info)
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
  return parser
}

function subdomainToId(headers) {
  var host = (headers[2].host && headers[2].host.length) ? headers[2].host[0] : null
  if (!host) {
    log('could not parse host', headers[2]);
    socket.end()
    return
  }
  var hostname = host.split(":").shift() // remove port from host header
  var subdomain = hostname.split('.')
  var id = subdomain[1]
  if (subdomain.length === 3) {
    id =  subdomain[0]
    service = false
  }
  return id
}

function subdomainToService(headers) {
  var host = (headers[2].host && headers[2].host.length) ? headers[2].host[0] : null
  if (!host) {
    log('could not parse host', headers[2]);
    socket.end()
    return
  }
  var hostname = host.split(":").shift() // remove port from host header
  var subdomain = hostname.split('.')
  var service = subdomain[0]
  if (subdomain.length === 3) {
    service = false
  }
  return service
}

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

