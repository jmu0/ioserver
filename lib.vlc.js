/*jslint todo: true */

var vlcport = 9876;
var net = require('net');

process.ioserver.on('ping', function(data){
    if (data.vlcHost) {
        //DEBUG: console.log('VLC PINGING: '+data.vlcHost);

        var timeout = 200;
        var s = new net.Socket();
        setTimeout(function() {
            if (s) { //s might be destroyed by error
                //DEBUG: console.log('VLC PING TIMEOUT: '+data.vlcHost);
                s.destroy();
                s = false;
                process.ioserver.publish('pong', {
                    "vlcHost": data.vlcHost,
                    "pong": "dead"
                });
            }
        }, timeout);
        s.connect(vlcport, data.vlcHost, function() {
            //DEBUG: console.log('VLC PING CONNECT: '+data.vlcHost);
            process.ioserver.publish('pong', {
                "vlcHost": data.vlcHost,
                "pong": "alive"
            });
            s.destroy();
            s = false;
        });
        s.on('error', function() {
            //DEBUG: console.log('VLC PING ERROR: '+data.vlcHost);
            process.ioserver.publish('pong', {
                "vlcHost": data.vlcHost,
                "pong": "dead"
            });
            s.destroy();
            s = false;
        });
    }
});

var vlclib = {
    start: function(host) {
        var c = "ssh " + this.user + "@" + host.hostname + " \"export DISPLAY=:0.0; ";
        c += host.vlcStartCommand + "\"";
        process.ioserver.pc.shell.cmd(c);

    },
    kill: function(host) {
        var c = "ssh " + this.user + "@" + host.host + " \"" + host.vlcKillCommand + "\"";
        process.ioserver.pc.shell.cmd(c);
    },
    command: function(host, command) {
        host.translate.forEach(function(item) {
            command = command.replace(item.from, item.to);
        });
        var s = new net.createConnection(vlcport, host, function() {
            s.write(command);
            s.end();
        });
        s.on('error', function() {
            console.log('error conneting to vlc on: ' + host);
        });
    },
};
/*
            case 'vlc':
                if (cmd.vlc === 'start') {
                this.vlc.start(cmd.host);
                console.log('start vlc on ' + cmd.host);
            } else if (cmd.vlc === 'ping') {
                this.vlc.ping(cmd.host);
            } else if (cmd.vlc === 'kill') {
                this.vlc.kill(cmd.host);
                console.log('kill vlc on ' + cmd.host);
            } else if (cmd.vlc === 'play') {
                if (cmd.file.length > 0) {
                    this.vlc.command(cmd.host, 'play ' + cmd.file);
                    console.log('vlc on ' + cmd.host + ': play ' + cmd.file);
                } else {
                    console.log('vlc on ' + cmd.host + ': no filename');
                }
            } else if (cmd.vlc === 'requeststatus') {
                //TODO: dit werkt niet goed
                this.vlc.requeststatus(cmd.host, function(status) {
                    console.log(status);
                });
            } else {
                if (cmd.vlc !== undefined) {
                    this.vlc.command(cmd.host, cmd.vlc);
                    console.log('vlc command on ' + cmd.host + ': ');
                } else {
                    console.log('vlc on ' + cmd.host + ': command undefined');
                }
            }
            case 'vlc':
                if (cmd.vlc === 'start') {
                this.vlc.start(cmd.host);
                console.log('start vlc on ' + cmd.host);
            } else if (cmd.vlc === 'ping') {
                this.vlc.ping(cmd.host);
            } else if (cmd.vlc === 'kill') {
                this.vlc.kill(cmd.host);
                console.log('kill vlc on ' + cmd.host);
            } else if (cmd.vlc === 'play') {
                if (cmd.file.length > 0) {
                    this.vlc.command(cmd.host, 'play ' + cmd.file);
                    console.log('vlc on ' + cmd.host + ': play ' + cmd.file);
                } else {
                    console.log('vlc on ' + cmd.host + ': no filename');
                }
            } else if (cmd.vlc === 'requeststatus') {
                //TODO: dit werkt niet goed
                this.vlc.requeststatus(cmd.host, function(status) {
                    console.log(status);
                });
            } else {
                if (cmd.vlc !== undefined) {
                    this.vlc.command(cmd.host, cmd.vlc);
                    console.log('vlc command on ' + cmd.host + ': ');
                } else {
                    console.log('vlc on ' + cmd.host + ': command undefined');
                }
            }
*/
