"use strict"

var http = require('http');
var shoe = require('shoe')

var ecstatic = require('ecstatic')({
  root       : __dirname,
  baseDir    : '/',
  cache      : 3600,
  showDir    :true,
  autoIndex  :true,
  defaultExt : 'html', 
  gzip       : false
});

var server = http.createServer(ecstatic);
server.on('request', function(req) {
  console.log(req.url)
})
server.listen(9001);

var sock = shoe(function (stream) {
    var iv = setInterval(function () {
        stream.write(Math.floor(Math.random() * 2));
    }, 250);

    stream.on('end', function () {
        clearInterval(iv);
    });

    stream.pipe(process.stdout, { end : false });
});
sock.install(server, '/invert');
