var net = require('net');

var host = '0.0.0.0';
var port = 9999;
process.ioserver = require('./ioserver.lib.js');
var linebuffer="";

//create server and listen on port
net.createServer(function(socket){
        console.log('connected: '+socket.remoteAddress+':'+socket.remotePort);
        process.ioserver.addSocket(socket);
        socket.on('data', function(data){
                var commands, i;
                linebuffer += data;
                if (linebuffer.indexOf("\n") > -1)
                {
                    commands = linebuffer.split("\n");
                    for (i = 0; i < commands.length; i++) {
                        process.ioserver.doCommand(commands[i], socket);
                    }
                    linebuffer = "";
                }
            });
        socket.on('close', function(data){
                process.ioserver.removeSocket(socket);
                var ip = socket._peername.address;
                console.log(ip + ': connection closed: ' + data);
            });
        socket.on('error', function(data){
                var ip = socket._peername.address;
                console.log("socket error: " + ip + " data: "+data);
                socket.destroy();
            });
    }).listen(port, host);
console.log('server listening on '+host+':'+port);
