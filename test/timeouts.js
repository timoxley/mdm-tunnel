var Client = require('../client')
var Server = require('../server')
var MuxDemux = require('mux-demux')

it('times out if not sent auth', function(done) {

var clients = {}

var client = MuxDemux() // will never send auth

var server = Server({
  timeout: 100,
  clients: clients
})

client.pipe(server).pipe(client)
  server.on('end', done)
})
