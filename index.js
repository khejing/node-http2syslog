// includes
var http = require("http"),
    https = require("https"),
    net = require("net"),
    url = require("url");
    dgram = require('dgram');
    crypto = require('crypto');
    fs = require('fs'),
    logger = require('node-logger'),
    assign = require('lodash/assign.js');

// log to local console 
var log = function(content) {
    console.log(content);
};

var exception_count = 0;
// handle exceptions for great udp justice
process.addListener("uncaughtException", function (err) {
    log("error: caught an exception - " + err.stack);
    if(err.errno === process.ECONNREFUSED){
       log("Will fall back to utilize the udp socket");
       udp = true;
    }

    if (err.name === "AssertionError") throw err;
    if (++exception_count == 4) process.exit(0);
});

// write event to syslog server 
var forward_event = function(remoteip, content) {
    var obj;
    try{
        obj = JSON.parse(content);
    }catch(e){
        log("recv invalid JSON string: "+content);
        return -1;
    }
    var logs = obj.Log4js, i = 0;
    for(; i < logs.length; i++){
      // craft header
      var logItem = logs[i].LoggingEvent;
      logItem.appId = logItem.logger;
      delete logItem.logger;
      if(logger.log(logItem.level, assign(logItem, {host: remoteip})) === -1){
        return -1;
      }
    };
};

// key hash store
var hashes = {}
hashes['d00dadc0ffee'] = {'valid': 'true'};

// server object
var client_handler = function (request, response) {
    var content = "";
    var remoteip = request.connection.remoteAddress;

    // getting some data
    request.addListener("data", function(chunk) {
        content += chunk;
        if (content.length > 32768) {
            response.writeHead(413, {"Content-Type": "application/json"});
            response.write("{ 'response': 'false', 'message': 'error: oversized event' }\n");
            response.end();
            return;
        }
    });
    request.addListener("end", function() {
        var keyrequest;

        if(request.method === 'OPTIONS'){
            response.setHeader('Access-Control-Allow-Origin', request.headers.origin);
            response.setHeader('Access-Control-Allow-Methods', request.headers['access-control-request-method']);
            response.setHeader('Access-Control-Allow-Headers', request.headers['access-control-request-headers']);
            response.statusCode = 200;
            response.end();
            return;
        }
        // check path
        pathname = url.parse(request.url, true).pathname; 
        if (pathname.match('/inputs/[a-zA-Z0-9-]+/?') === null) {
            response.writeHead(404, {"Content-Type": "application/json"});
            response.write("{ 'response': 'false', 'message': 'error: method not found' }\n");
            response.end();
            return;
        }
        // check for key
        key = pathname.split('/')[2]; 
        if (key === undefined || key === null || key == '') { 
            response.writeHead(400, {"Content-Type": "application/json"});
            response.write("{ 'response': 'false', 'message': 'error: no input key provided' }\n");
            response.end();
            return;
        } else {
            // check cache for key
            var cachekey = false;
            var valid = false;

            if (hashes[key] === undefined) {
                cachekey = false;
            } else {
                cachekey = true;
            }

            if (cachekey == false) {
                // key not valid 
                if (valid === null || valid === false) {
                    response.writeHead(400, {"Content-Type": "application/json"});
                    response.write("{ 'response': 'false', 'message': 'error: key not validated' }\n");
                    response.end();
		    return;
                } 
            } else {
                fc = forward_event(remoteip, content);

                // if event wasn't forwarded, warn
                if (fc == -1) {
                  response.writeHead(500, {"Content-Type": "application/json"});
                  response.write("{ 'response': 'false', 'message': 'error: try again later' }\n");
                  response.end();
                  return;
                 }
                // notify user
                response.setHeader('Access-Control-Allow-Origin', request.headers.origin);
                response.writeHead(201, {"Content-Type": "application/json"});
                response.write("{ 'response': 'true', 'message': 'info: event received' }\n");
                response.end();
                return;
            }
        }
    });
}

// Start listening as HTTP server
http.createServer(client_handler).listen(8082);

// Start listening as HTTPS server
https.createServer({key: fs.readFileSync('/root/cert/formal.key'), cert: fs.readFileSync('/root/cert/formal.crt')}, client_handler).listen(8081);
