# node-http2syslog

node-http2syslog is a HTTP to syslog proxy written in Node.js.

node-http2syslog allows you to log to your syslog server by doing web POSTs from various HTTP enabled clients.  Here's a quick example of logging to Lodge from curl:

   curl -d "127.0.0.1 - there's no place like home" https://localhost:8080/inputs/d00dadc0ffee

To run node-http2syslog, make sure you have Node.js installed and have checked out the node-http2syslog project to your syslog box.  You start node-http2syslog like this:

   npm start


By default, node-http2syslog will try to forward syslog data to the local machine via TCP port 514.  Most syslog servers will not be configured to take TCP streams on port 514, so you'll probably need fiddle with your syslog server a bit to support inbound TCP connections.

If you are running Syslog-NG, your configuration will look a bit like this:

   source s_lodge {
        tcp(ip(0.0.0.0) port(514) max-connections(300));
   };
   destination df_lodge {
        file("/var/log/lodge.log");
   };
   log {
        source(s_lodge);
        destination(df_lodge);
   };

Note: Lodge will fall back to UDP port 514 if your syslog server isn't setup to accept logs on TCP port 514. Some data loss can occur due to UDP's non-reliable nature.

Once you are done configuring your syslog server, use the curl line above and then the lodge.log logfile in /var/log/ to verify it's working correctly.
