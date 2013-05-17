var http = require('http');

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
server.listen(9000);

