var assert = require('assert')
var net = require('net')
var http = require('http')
var exec = require('child_process').exec

var through = require('through')
var request = require('supertest')

var targetApp = http.createServer(function(req, res) {
  res.writeHead(200, {'Test-Passed': true})
  res.end()
})

targetApp.listen(4565)

var configPath = __dirname + '/fixtures/test.config.json'

var server, client

before(function(done) {
  server = exec(__dirname + '/../bin/server -p 9900 -v')
  server.on('error', done)
  client = exec(__dirname + '/../bin/client --user test --config ' + configPath)
  client.on('error', done)
  server.stderr.pipe(through(function(data) {
    this.push(data)
    if (data.match(/client\ identified/)) done()
  }))
})

after(function() {
  server && server.kill()
  client && client.kill()
})

describe('client', function() {
  it('works', function(done) {
    // NOTE: requires a local *.dev domain to be set up :/
    request('http://target.test.local.dev:9900')
    .get('/')
    .expect('Test-Passed', 'true')
    .expect(200, done)
  })
})
