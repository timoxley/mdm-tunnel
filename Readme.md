# MuxDemux Tunnel

## Expose network services behind a NAT via a public interface

----

## Example Configuration

Expose services running on local port 9000/9001 on domains
hello-world.username.example.com & websockets.username.example.com.

services.config.json:

```json
{
  "hello-world": 9000,
  "websockets": 9001
}
```

## Client Usage

```
  Usage: client [options]

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

  Usage: server [options]

  Options:

    -h, --help                  output usage information
    -V, --version               output the version number
    -p, --port [port]           Port to listen for external connections on [port]
    -c, --client-port [client]  Port to listen for client connections on [client]
    -v, --verbose               verbose output

```

Without -v, these apps are totally silent.

### Getting Started

Open these in separate terminals or background them:

```sh
# Boot the server
mdm-server -v

# Boot the client
mdm-client -u tim -v

# Boot some service
node examples/simple/server.js

# Connect with browser
open http://hello-world.tim.localhost.dev:8000
```

### Websocket Example

# Boot up the service
node examples/websockets/server.js

# Connect with browser
open http://websockets.tim.localhost.dev:8000

```


#### A note on subdomains on OSX

A good solution for managing local subdomains on OSX is [dnsmasq](http://www.thekelleys.org.uk/dnsmasq/doc.html). [These
instructions](http://www.echoditto.com/blog/never-touch-your-local-etchosts-file-os-x-again)
seem to work fine.
