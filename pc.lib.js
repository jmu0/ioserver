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

var user = 'jos';
var db = require('./database.js');
var net = require('net');
var vlcport = 9876;
var i;

var pclib = {
    /**
     * bijvoorbeeld: pc htpc2 vlc play <file>
     */
    //command: function(cmd, callback) {
    command: function(cmd) {
        var host = cmd[1];
        switch (cmd[2]) {
            case 'ping':
                this.ping(host, function(data) {
                console.log(data);
                //DEBUG:console.log(host+' ping '+data);
                //TODO: er is geen callback nodig maar een message: callback(host + " " + data + "\n");
            });
            break;
            case 'wake':
                this.wake(host);
            break;
            case 'shutdown':
                this.shutdown(host);
            break;
            case 'vlc':
                if (cmd[3] === 'start') {
                this.vlc.start(host);
                console.log('start vlc on ' + host);
            } else if (cmd[3] === 'ping') {
                this.vlc.ping(host, function(data) {
                    console.log(data);
                    //DEBUG: console.log(host+" vlc ping "+data);
                    //TODO: message: callback(host + " vlc " + data + "\n");
                });
            } else if (cmd[3] === 'kill') {
                this.vlc.kill(host);
                console.log('kill vlc on ' + host);
            } else if (cmd[3] === 'play') {
                var file = "";
                for (i = 4; i < cmd.length; i++) {
                    if (file.length > 0) {
                        file += " ";
                    }
                    file += cmd[i];
                }
                if (file.length > 0) {
                    this.vlc.command(host, 'play ' + file);
                    console.log('vlc on ' + host + ': play ' + file);
                } else {
                    console.log('vlc on ' + host + ': no filename');
                }
                /*
                   } else if (cmd[3]==='queue') { //TODO: weg hiermee
                   if (cmd[4] !== undefined) {
                   this.vlc.queue(host, cmd[4]);
                   console.log('vlc on '+host+': queue '+cmd[4]);
                   } else {
                   console.log('vlc on '+host+': file unknown: '+cmd[4]);
                   }
                   */
            } else if (cmd[3] === 'requeststatus') {
                this.vlc.requeststatus(host, function(status){
                    console.log(status);
                });
            } else {
                if (cmd[3] !== undefined) {
                    this.vlc.command(host, cmd[3]);
                    console.log('vlc command on ' + host + ': ');
                } else {
                    console.log('vlc on ' + host + ': command undefined');
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
        var c = "ssh " + user + "@" + host + " \"" + h.shutdown + "\"";
        shell.cmd(c, function(data) {
            console.log('shutdown ' + host + ": " + data);
        });
    },
    ping: function(host, callback) {
        //DEBUG:console.log('ping host '+host);
        db.getIP(host, function(address) {
            //DEBUG:console.log('host:'+host+",ip:"+address);
            var c = "ping -c 1 -W 1 ";
            c += address;
            c += " &> /dev/null; echo $?";
            shell.cmd(c, function(data) {
                data = String(data).trim();
                if (data === '0') {
                    //DEBUG: console.log("PING: host " + host + ":" + address + " is alive");
                    if (callback !== undefined) {
                        callback('alive');
                    }
                } else {
                    //DEBUG: console.log("PING: host " + host + ":" + address + " is not alive");
                    if (callback !== undefined) {
                        callback('dead');
                    }
                }
            });
        });
    },
    vlc: {
        ping: function(host, callback) {
            var timeout = 200;
            var s = new net.Socket();
            var alive = false;
            s.setTimeout(timeout, function() {
                s.destroy();
                if (callback !== undefined && alive === false) {
                    callback('dead');
                }
            });
            s.connect(vlcport, host, function() {
                alive = true;
                if (callback !== undefined) {
                    callback('alive');
                }
            });
            s.on('error', function() {
                alive = false;
                if (callback !== undefined) {
                    callback('dead');
                }
            });
        },
        start: function(host) {
            var c = "ssh " + user + "@" + host + " \"export DISPLAY=:0.0; ";
            var h = db.pc[host];
            c += h.vlcStartCommand + "\"";
            shell.cmd(c);
        },
        kill: function(host) {
            var h = db.pc[host];
            var c = "ssh " + user + "@" + host + " \"" + h.vlcKillCommand + "\"";
            shell.cmd(c);
        },
        command: function(host, command) {
            var h = db.pc[host];
            h.translate.forEach(function(item) {
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
        requeststatus: function(host, callback) {
            //TODO: dit wordt niks
            var buffer = [];
            var status = {
                length: 0,
                position: 0
            };
            /*
            shell.cmd('echo "status" | nc -q 1 '+host+' 9876', function(data){
                console.log('shell: ' + data);
            });
            */
            var s = new net.createConnection(vlcport, host, function() {
                s.write('get_length\nget_time\nstatus\n');
                //s.write('get_time\n');
                //s.write('status\n');
                //s.write('quit\n');
            });
            s.on('error', function() {
                console.log('error conneting to vlc on: ' + host);
            });
            //var dit = this;
            s.on('data', function(data) {
                //DEBUG:
                console.log('vlc data: ' + data);
                //DEBUG: buffer.push(dit.parseVlcOutput(data));
                if (buffer.length === 3) {
                    //DEBUG:
                    console.log(status);
                    s.end();
                    if (callback) {
                        callback(status);
                    }
                }
            });
            s.on('end', function(data){
                console.log("END " + data);
            });
        },
        parseVlcOutput: function(text) {
            text = String(text);
            if (!text || text.length === 0) {
                return false;
            }
            var pl = [];
            var ignore = [
                "VLC media player",
                "Command Line Interface initialized",
                "Playlist - Ongedefinieerd",
                "Playlist - Undefined",
                "2 - Afspeellijst",
                "2 - Playlist",
                "3 - Mediabibliotheek",
                "3 - Mediatheek",
                "3 - Media Library",
                "End of playlist",
                "Bye-bye!"
            ];
            console.log('parse: [' + text + ']');
            var lines = text.split(/((\r?\n)|(\r\n?))/);
            var i, j, k, ignline, line, add, pos, pos2, spl, item, it;
            console.log('parse ' + lines.length + ' lines');
            for (i = 0; i < lines.length; i++) {
                line = lines[i];
                if (line) {
                    add = true;
                    if (line.indexOf('Mediabibliotheek') > -1) {
                        break;
                    }
                    for (j = 0; j < ignore.length; j++) {
                        ignline = ignore[j];
                        if (line.indexOf(ignline) > -1) {
                            add = false;
                        }
                    }
                    item = line.substr(1).trim();
                    if (add && item.length > 0) {
                        pos = item.indexOf(' - ');
                        if (pos > -1 && pos < 5) {
                            spl = item.split(' - ');
                            item = [];
                            item.id = spl[0];
                            item.value = spl[1];
                            if (spl.length > 2) {
                                for (k = 2; k < spl.length; k++) {
                                    item.value += " - ".spl[k];
                                }
                            }
                            spl = item.value;
                            pos = spl.indexOf('[played');
                            if (pos > -1) {
                                pos2 = spl.substr(pos - 11, 1);
                                if (pos2 === "(") {
                                    item.info = spl.substr(pos - 11);
                                    item.title = spl.substr(0, pos - 12);
                                } else {
                                    item.info = spl.substr(pos);
                                    item.title = spl.substr(0, pos - 1);
                                }
                            } else {
                                item.title = item.value;
                                item.info = "";
                            }
                        } else {
                            if (item.indexOf('new input') > -1) {
                                it = [];
                                it.item = item;
                                it.key = item.substr(1, 10).trim();
                                it.value = item.substr(13, item.length - 13 - 2).trim();
                                item = it;
                            } else if (item.indexOf('audio volume') > -1) {
                                it = [];
                                it.item = item;
                                it.key = item.substr(5, 7).trim();
                                it.value = item.substr(13, item.length - 13 - 2).trim();
                                item = it;
                            } else if (item.indexOf('state') > -1) {
                                it = [];
                                it.item = item;
                                it.key = item.substr(0, 5).trim();
                                it.value = item.substr(5, item.length - 5 - 2).trim();
                                item = it;
                            }
                        }
                        pl.push(item);
                    }
                }
            }
            if (pl.length === 1) {
                pl = pl[0];
            }
            return pl;
        }
    }
};

process.ioserver.on('pc', function(data) {
    pclib.command(data.command);
});

module.exports = pclib;
