/*jslint todo: true */

var shell = { 
    exec: require('child_process').exec,
    callback: undefined,
    cmd: function(cmd, callback){
        var Callback=callback;
        console.log('pc shell: '+cmd);
        shell.exec(cmd,function(error,stdout,stderr){
            if (error) { error = 0; } //suppress jslint error
            if (stderr) { stderr = 0; } //suppress jslint error
            if (Callback !== undefined) {   
                Callback(stdout); 
            }   
        }); 
    },  
    puts: function(error, stdout, stderr){
        console.log("pc error: "+error);
        console.log('pc stdout: ' +stdout);
        console.log('pc stderro: '+stderr);
        return stdout;
    }   
};

var user = 'jos';
var db = require('./database.js');
var net = require('net');

module.exports = {
    command: function(cmd,callback){
        var host = cmd[1];
        switch (cmd[2]){
            case 'ping':
                this.ping(host,function(data) {
                    //DEBUG:console.log(host+' ping '+data);
                    callback(host+" "+data + "\n");
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
                this.vlc.ping(host, function(data){
                    //DEBUG: console.log(host+" vlc ping "+data);
                    callback(host+" vlc "+data + "\n");
                });
            } else if (cmd[3]==='kill'){
                this.vlc.kill(host);
                console.log('kill vlc on ' + host);
            } else if (cmd[3]==='play') {
                if (cmd[4] !== undefined) {
                    this.vlc.play(host, cmd[4]);
                    console.log('vlc on '+host+': play '+cmd[4]);
                } else {
                    console.log('vlc on '+host+': file unknown: '+cmd[4]);
                }
            } else if (cmd[3]==='queue') {
                if (cmd[4] !== undefined) {
                    this.vlc.queue(host, cmd[4]);
                    console.log('vlc on '+host+': queue '+cmd[4]);
                } else {
                    console.log('vlc on '+host+': file unknown: '+cmd[4]);
                }
            } else {
                if (cmd[3] !== undefined){
                    console.log('vlc command on '+ host + ': ');
                } else {
                    console.log('vlc on '+host+': command undefined');
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
        if (h.mac !== undefined){
            shell.cmd('wol ' + h.mac, function(data) {
                console.log('wol '+host+": "+String(data).trim());
            });
        } else {
            console.log("pc wakeonlan: geen mac adres gegeven");
        }
    },
    shutdown: function(host){
        var h = db.pc[host];
        var c = "ssh "+user+"@" + host + " \"" + h.shutdown + "\"";
        shell.cmd(c, function(data){
            console.log('shutdown '+host+": "+data);
        });
    },
    ping: function(host, callback) {
        //DEBUG:console.log('ping host '+host);
        db.getIP(host,function(address){
            //DEBUG:console.log('host:'+host+",ip:"+address);
            var c = "ping -c 1 -W 1 ";
            c += address;
            c += " &> /dev/null; echo $?";
            shell.cmd(c, function(data) {
                data = String(data).trim();
                if (data === '0') {
                    //DEBUG: console.log("PING: host " + host + ":" + address + " is alive");
                    if (callback !== undefined) { callback('alive'); }
                } else {
                    //DEBUG: console.log("PING: host " + host + ":" + address + " is not alive");
                    if (callback !== undefined) { callback('dead'); }
                }
            });
        });
    },
    vlc: { 
        ping: function(host, callback) {
            var port = 9876;
            var timeout = 200;
            var s = new net.Socket();
            var alive = false;
            s.setTimeout(timeout, function() { 
                s.destroy(); 
                if (callback !== undefined && alive===false) { 
                    callback('dead'); 
                }
            });
            s.connect(port, host, function() {
                alive=true;
                if (callback !== undefined) { callback('alive'); }
            });
            s.on('error', function(){
                alive=false;
                if (callback !== undefined) { callback('dead'); }
            });
        },
        start: function(host) {
            var c = "ssh "+user+"@" + host + " \"export DISPLAY=:0.0; ";
            var h = db.pc[host];
            c += h.vlcStartCommand + "\""; 
            shell.cmd(c);
        },
        kill: function(host) {
            var h = db.pc[host];
            var c = "ssh "+user+"@" + host + " \""+h.vlcKillCommand + "\"";
            shell.cmd(c);
        },
        play: function(host, file) {
            //TODO: vlc play file
            console.log(host+' play '+file);
        },
        queue: function(host, file) {
            //TODO: vlc queue file
            console.log(host+' queue '+file);
        },
        cmd: function(host, cmd) {
            //TODO: vlc command
            console.log(host+' cmd '+cmd);
        }
    }
};
