/*jslint todo: true */

var net = require('net');

var vlclib = {
    port: 9876,
    user: 'jos',
    ignore: ['VLC', '>', 'Command'],
    start: function(data) {
        if (process.ioserver.debug) {
            console.log('lib.vlc: START VLC');
        }
        var c = "ssh " + this.user + "@" + data.hostname + " \"";
        c += data.vlcStartCommand + "\"";
        process.ioserver.pc.shell.cmd(c);
    },
    kill: function(data) {
        if (process.ioserver.debug) {
            console.log('lib.vlc: KILL VLC');
        }
        var c = "ssh " + this.user + "@" + data.hostname + " \"" + data.vlcKillCommand + "\"";
        process.ioserver.pc.shell.cmd(c);
    },
    play: function(data) {
        console.log("lib.vlc: VLC play " + data.file + " on " + data.hostname);
        var s = new net.Socket();
        s.connect(this.port, data.hostname, function() {
            s.write("add " + data.file + '\n');
            s.destroy();
        });
        s.on('error', function() {
            console.log('lib.vlc: ERROR vlc command: cannot connect to vlc on: ' + data.hostname);
        });
    },
    command: function(data) {
        var s = new net.Socket();
        s.connect(this.port, data.hostname, function() {
            s.write(data.vlc + '\n');
            s.destroy();
        });
        s.on('error', function() {
            console.log('lib.vlc: ERROR vlc command: cannot connect to vlc on: ' + data.hostname);
        });
    },
    time: function(data) {
        console.log("lib.vlc: VLC get time on: " + data.hostname);
        var s = new net.Socket();
        var that = this;
        s.connect(this.port, data.hostname, function() {
            s.write('get_time\n');
        });
        s.on('data', function(ret) {
            ret = String(ret);
            console.log('lib.vlc: vlc data:'); console.log(ret);
            ret = ret.split("\n");
            var isCommand = true;
            ret.forEach(function(cmd){
                cmd = cmd.replace('>', '').trim();
                isCommand = true;
                if (cmd.length > 0) {
                    that.ignore.forEach(function(ign) {
                        if (cmd.substr(0, ign.length) === ign) {
                            console.log('lib.vlc: false');
                            isCommand = false;
                        }
                    });
                    if (isCommand === true) {
                        console.log('lib.vlc: VLC TIME ['+cmd+']');
                        process.ioserver.publish('vlctime', {
                            time: cmd,
                            hostname: data.hostname
                        });
                        s.destroy();
                    }
                }
            });
        });
        s.on('error', function() {
            console.log('lib.vlc: ERROR get time: cannot connet to vlc on: ' + data.hostname);
        });

    },
    length: function(data) {
        var s = new net.Socket();
        var that = this;
        s.connect(this.port, data.hostname, function() {
            s.write('get_length\n');
        });
        s.on('data', function(ret) {
            ret = String(ret);
            ret = ret.split("\n");
            var isCommand = true;
            ret.forEach(function(cmd){
                cmd = cmd.replace('>', '').trim();
                isCommand = true;
                if (cmd.length > 0) {
                    that.ignore.forEach(function(ign) {
                        if (cmd.substr(0, ign.length) === ign) {
                            isCommand = false;
                        }
                    });
                    if (isCommand === true) {
                        process.ioserver.publish('vlclength', {
                            length: cmd,
                            hostname: data.hostname
                        });
                        s.destroy();
                    }
                }
            });
        });
        s.on('error', function() {
            console.log('lib.vlc: ERROR get length: cannot connetto vlc on: ' + data.hostname);
        });
    },
    playing: function(data) {
        var s = new net.Socket();
        var that = this;
        s.connect(this.port, data.hostname, function() {
            s.write('is_playing\n');
        });
        s.on('data', function(ret) {
            ret = String(ret);
            ret = ret.split("\n");
            var isCommand = true;
            ret.forEach(function(cmd){
                cmd = cmd.replace('>', '').trim();
                isCommand = true;
                if (cmd.length > 0) {
                    that.ignore.forEach(function(ign) {
                        if (cmd.substr(0, ign.length) === ign) {
                            isCommand = false;
                        }
                    });
                    if (isCommand === true) {
                        process.ioserver.publish('vlcplaying', {
                            playing: cmd,
                            hostname: data.hostname
                        });
                        s.destroy();
                    }
                }
            });
        });
        s.on('error', function() {
            console.log('lib.vlc: ERROR get length: cannot connetto vlc on: ' + data.hostname);
        });
    }
};

process.ioserver.on('vlc', function(data) {
    if (data.vlc === 'start') {
        vlclib.start(data);
    } else if (data.vlc === 'kill') {
        vlclib.kill(data);
    } else if (data.vlc === 'play') {
        vlclib.play(data);
    } else if (data.vlc === 'time') {
        vlclib.time(data);
    } else if (data.vlc === 'length') {
        vlclib.length(data);
    } else if (data.vlc === 'playing') {
        vlclib.playing(data);
    } else {
        vlclib.command(data);
    }
});
process.ioserver.on('ping', function(data) {
    if (data.vlcHost) {
        var timeout = 200;
        var s = new net.Socket();
        setTimeout(function() {
            if (s) { //s might be destroyed by error
                s.destroy();
                s = false;
                process.ioserver.publish('pong', {
                    "vlcHost": data.vlcHost,
                    "pong": "dead"
                });
            }
        }, timeout);
        s.connect(vlclib.port, data.vlcHost, function() {
            process.ioserver.publish('pong', {
                "vlcHost": data.vlcHost,
                "pong": "alive"
            });
            s.destroy();
            s = false;
        });
        s.on('error', function() {
            process.ioserver.publish('pong', {
                "vlcHost": data.vlcHost,
                "pong": "dead"
            });
            s.destroy();
            s = false;
        });
    }
});
