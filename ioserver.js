var net = require('net');

var host = '0.0.0.0';
var port = 9999;
process.ioserver = require('./lib.ioserver.js');
process.ioserver.init();
var linebuffer="";

var arg = process.argv[2];
if (arg !== undefined && arg === 'debug'){
    process.ioserver.debug=true;
    console.log('ioserver: writing debug messages...');
}

//create server and listen on port
net.createServer(function(socket){
        console.log('ioserver: connected: '+socket.remoteAddress+':'+socket.remotePort);
        process.ioserver.socket.addSocket(socket);
        socket.on('data', function(data){
                var commands, i;
                linebuffer += data;
                if (linebuffer.indexOf("\n") > -1) {
                    commands = linebuffer.split("\n");
                    for (i = 0; i < commands.length; i++) {
                        if (commands[i].length > 0) {
                            if (process.ioserver.debug) { console.log("ioserver: incoming command: (" + commands[i] + ")"); }
                            process.ioserver.doCommand(commands[i], socket);
                        }
                    }
                    linebuffer = "";
                }
            });
        socket.on('close', function(data){
                process.ioserver.socket.removeSocket(socket);
                var ip = socket._peername.address;
                console.log("ioserver: " + ip + ': connection closed: ' + data);
            });
        socket.on('error', function(data){
                var ip = socket._peername.address;
                console.log("ioserver: socket error: " + ip + " data: "+data);
                socket.destroy();
            });
    }).listen(port, host);
console.log('ioserver: server listening on '+host+':'+port);
