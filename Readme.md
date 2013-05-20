# MuxDemux Tunnel

## Expose network services behind a NAT via a public interface

----
## Client Usage
```
Usage: client [options]

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -c, --config [file]  Config file to load [file]
    -u, --user [user]    username to log in to server with
```

## Server Usage
```

  Usage: server [options]

  Options:

    -h, --help         output usage information
    -V, --version      output the version number
    -p, --port [port]  Port to listen for external connections on [port]

```
## Example Configuration

Expose services running on local port 9000/9001 on domains
hello-world.username.example.com & websockets.username.example.com.

```

{
  "hello-world": 9000,
  "websockets": 9001
}
```

### Getting started

Open these in separate terminals or background:

```sh
# Boot the server
DEBUG=* mdm-server

# Boot the client
DEBUG=* mdm-client -u tim

# Boot some service
node examples/simple/server.js

# Connect with browser
open http://hello-world.tim.localhost.dev:3000
```

### Websocket Example

# Boot up the service
node examples/websockets/server.js

# Connect with browser
open http://websockets.tim.localhost.dev:3000

```


#### A note on subdomains on OSX

A good solution for managing local subdomains on OSX is [dnsmasq](http://www.thekelleys.org.uk/dnsmasq/doc.html). [These
instructions](http://www.echoditto.com/blog/never-touch-your-local-etchosts-file-os-x-again)
seem to work fine.
