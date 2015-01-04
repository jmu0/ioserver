var vlcport = 9876;
var net = require('net');
var user = 'jos';
var db = require('./database.js');
var i;
var vlc = {
    ping: function(host) {
        var timeout = 200;
        var s = new net.Socket();
        s.setTimeout(function() {
            s.destroy();
            console.log('vlc ping timeout');
            process.ioserver.publish('pong', {
                "vlc": host,
                "pong": "dead"
            });
        }, timeout);
        s.connect(vlcport, host, function() {
            console.log('vlc pong ');
            process.ioserver.publish('pong', {
                "vlc": host,
                "pong": "alive"
            });
        });
        s.on('error', function() {
            console.log('vlc ping errror');
            process.ioserver.publish('pong', {
                "vlc": host,
                "pong": "dead"
            });
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
    requeststatus: function(host) {
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
                /*TODO: message
                  if (callback) {
                  callback(status);
                  }
                  */
            }
        });
        s.on('end', function(data) {
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
