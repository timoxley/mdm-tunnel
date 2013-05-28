var net = require('net')
var MuxDemux = require('mux-demux')
var combine = require('stream-combiner')
var ms = require('msgpack-stream')
var httppp = require('httppp')
var responseStream = require('response-stream')
var through = require('through')
var log = require('debug')('router')

module.exports = function(program, socket, lookup, auth) {

  lookup = lookup || defaultLookup
  auth = auth || defaultAuth

  var clients = program.clients
  log('new connection')
  var request = httppp(function (headers) {

    lookup(headers, function (err, data) {

      if(err) {
        log(err)
        return sock.end()
      }
      var id = data.id
      var host = data.host
      var service = data.service

      auth(headers, function (err) {

        if(err) {
          log(err)
          return sock.end()
        }
        var mx = clients[id]
        if (!mx) {

          log('client not connected', id)
          return socket.end()
        }

        log('requesting service', service || '*')
        if (!service) { // requesting service listing

          request.pipe(mx.createStream(
            'services'
          )).pipe(through(function(data) {
            var rs = responseStream(socket)
            rs.writeHead(200, {'Content-Type':'text/html'})
            rs.write(servicesList(data, host))
            rs.end()
          }))
          return
        }

        request.pipe(mx.createStream({
          service: service
        })).pipe(socket);
      })
    })
  })
  return request
}

function defaultLookup(headers, cb) {

  var host = (headers[2].host && headers[2].host.length)
    ? headers[2].host[0]
    : null
  ;
  if(!host) { // invalid headers

    var err = 'could not parse host'
    log(err, headers[2])
    return cb(new Error(err))
  }

  var hostname = host.split(':').shift()  // remove port from host header
  var subdomain = hostname.split('.')
  var service = subdomain[0]
  var id = subdomain[1]

  if(subdomain.length === 3) {

    id = subdomain[0]
    service = false
  }
  cb(null, {

    host : host
    , hostname : hostname // no port
    , subdomain : subdomain
    , service : service
    , id : id
  })
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

