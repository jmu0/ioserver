/*jslint todo: true */

var shell = {
    exec: require('child_process').exec,
    callback: undefined,
    cmd: function(cmd, callback) {
        var Callback = callback;
        console.log('pc shell: ' + cmd);
        shell.exec(cmd, function(error, stdout, stderr) {
            if (error) {
                error = 0;
            } //suppress jslint error
            if (stderr) {
                stderr = 0;
            } //suppress jslint error
            if (Callback !== undefined) {
                Callback(stdout);
            }
        });
    },
    puts: function(error, stdout, stderr) {
        console.log("pc error: " + error);
        console.log('pc stdout: ' + stdout);
        console.log('pc stderro: ' + stderr);
        return stdout;
    }
};

process.ioserver.on('ping', function(data){
        //DEBUG:console.log('ping host '+host);
        db.getIP(host, function(address) {
            //DEBUG:console.log('host:'+host+",ip:"+address);
            var c = "ping -c 1 -W 1 ";
            c += address;
            c += " &> /dev/null; echo $?";
            shell.cmd(c, function(data) {
                data = String(data).trim();
                if (data === '0') {
                    process.ioserver.publish('pong', { "host": host, "pong": "alive" });
                } else {
                    process.ioserver.publish('pong', { "host": host, "pong": "dead" });
                }
            });
        });

});
var pclib = {
    user: 'jos',
    shell: shell,
    command: function(cmd) {
        switch (cmd.command) {
            case 'ping':
                this.ping(cmd.host);
            break;
            case 'wake':
                this.wake(cmd.host);
            break;
            case 'shutdown':
                this.shutdown(cmd.host);
            break;
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
                this.vlc.requeststatus(cmd.host, function(status){
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
            break;
            default:
                break;
        }

    },
    wake: function(host) {
        //LET OP: op arch linux moet het pakket wol geinstalleerd zijn
        var h = db.pc[host];
        if (h.mac !== undefined) {
            shell.cmd('wol ' + h.mac, function(data) {
                console.log('wol ' + host + ": " + String(data).trim());
            });
        } else {
            console.log("pc wakeonlan: geen mac adres gegeven");
        }
    },
    shutdown: function(host) {
        var h = db.pc[host];
        var c = "ssh " + this.user + "@" + host + " \"" + h.shutdown + "\"";
        shell.cmd(c, function(data) {
            console.log('shutdown ' + host + ": " + data);
        });
    },
    ping: function(host) {
    },
};

process.ioserver.on('pc', function(data) {
    pclib.command(data);
});

module.exports = pclib;
