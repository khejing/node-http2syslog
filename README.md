= node-http2syslog

node-http2syslog is a HTTP to syslog proxy written in Node.js.

node-http2syslog allows you to log to your syslog server by doing web POSTs from various HTTP enabled clients.  Here's a quick example of logging to Lodge from curl:

   curl -d "127.0.0.1 - there's no place like home" https://localhost:8080/inputs/d00dadc0ffee

To run node-http2syslog, make sure you have Node.js installed and have checked out the node-http2syslog project to your syslog box.  You start node-http2syslog like this:

   node lodge.js


By default, node-http2syslog will try to forward syslog data to the local machine via [modern-syslog](https://github.com/strongloop/modern-syslog).

Once you are done configuring your syslog server, use the curl line above and then the lodge.log logfile in /var/log/ to verify it's working correctly.
