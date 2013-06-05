# MuxDemux Tunnel

## Expose network services behind a NAT via a public interface

mdm-tunnel is a very simple (read: naive) way to get around the fact that the devices
on the Internet cannot create *incoming* connections to devices behind a
NAT i.e. if you boot a webserver on your home computer, the internet
cannot access this server unless you forward ports to it on your home router. 

mdm-tunnel gets around the blocked incoming connections by simply opening an *outgoing*, persistent, duplex connection to a
webserver,
which is accessible to the Internet. The webserver then accepts the incoming requests from the internet,
and figures out which connection a request should be piped
to.

![mdm-tunnel-flow](https://f.cloud.github.com/assets/43438/610762/8d1922a8-cdbe-11e2-9447-6117044fd0b1.png)

There are probably better ways to do this, this is my first foray in
this space.

----

## Example Configuration

Expose services running on local port 9000/9001 on domains
hello-world.username.example.com & websockets.username.example.com.

$HOME/.tunnel-services.json:

```json
{
  "hello-world": 9000,
  "websockets": 9001
}
```

## Client Usage

```
Usage: mdm-tunnel-client [options]

Options:

  -h, --help           output usage information
  -V, --version        output the version number
  -c, --config [file]  Config file to load [file]
  -u, --user [user]    username to log in to server with
  -p, --port [port]    port on host server
  -h, --host [host]    address of host server
  -v, --verbose        verbose output
```

## Server Usage
```
Usage: mdm-tunnel-server [options]

Options:

  -h, --help                  output usage information
  -V, --version               output the version number
  -p, --port [port]           Port to listen for external connections on [port]
  -c, --client-port [client]  Port to listen for client connections on [client]
  -v, --verbose               verbose output
```

Without -v, mdm-tunnel runs totally silent.

### Examples


#### Create a .tunnel-services.json file.

By default the client searches for `.tunnel-services.json` in your
`$HOME` directory. Keys are service names (can be anything), values are
local port numbers for those services.

```json
{
  "hello-world": 9000,
  "websockets": 9001
}
````
#### Boot the mdm-tunnel server and client

Open these in separate terminals or background them.

Note: You'll need to set up wildcard subdomains to test the server on your local
machine. On OSX, I recommend
[dnsmasq](www.echoditto.com/blog/never-touch-your-local-etchosts-file-os-x-again).

```sh
# Boot the server
mdm-tunnel-server -v

# Boot the client on your machine
mdm-tunnel-client -u tim -v

# Boot some service
node examples/simple/server.js

# Connect with browser
open http://hello-world.tim.localhost.dev:8000
```

#### Websocket Example

```sh
# Boot up the service
node examples/websockets/server.js

# Connect with browser
open http://websockets.tim.localhost.dev:8000

```
To change the available services, edit your
`$HOME/.tunnel-services.json`.

## Authentication / Security

The default implementation does not enforce any security. You can implement simple security inside the
Router instance you run on the webserver.

```js
net.createServer(function(socket) {
  socket.pipe(Router(config, socket, function(headers, done) {
     async.series([
       auth.bind(null, headers)),
       route.bind(null, headers)
    ], done)
  }))
}).listen(80)
```

This isn't very sophisticated and could be improved.
