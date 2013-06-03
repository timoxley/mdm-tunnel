// Defer loading rest of deps until after setting DEBUG env var.
var net = require('net')
var Router = require('../router')
var Server = require('../server')
var Client = require('../client')
var request = require('supertest')
var http = require('http')

describe('routing', function() {
  var appServer, testService
  it('routes correctly', function(done) {
    var program = {}
    program.clients = {}
    program.port = 6897

    appServer = net.createServer(function(socket) {
      socket.pipe(Router(program, socket, findId, findService))
    })

    appServer.listen(program.port)

    var client = Client({
      id: 'tim',
      services: {
        'test': 9788
      }
    })

    testService = http.createServer(function(req, res) {
      res.writeHead(303)
      res.end()
    })

    testService.listen(9788, function() {
      request('http://localhost:6897')
      .get('/')
      .set({
        id: 'tim',
        service: 'test'
      })
      .expect(303, done)
    })

    var server = Server(program)

    client.pipe(server).pipe(client)

    function findId(headers, fn) {
      fn(null, headers.headers.id)
    }
    function findService(headers, fn) {
      fn(null, headers.headers.service)
    }
  })

  afterEach(function() {
    appServer.close()
    testService.close()
  })
})
