/*global ioserver */
var shell = { 
    exec: require('child_process').exec,
    callback: undefined,
    cmd: function(cmd, callback){
        shell.callback=callback;
        shell.exec(cmd,function(error,stdout,stderr){
            if (error) { error = 0; } //suppress jslint error
            if (stderr) { stderr = 0; } //suppress jslint error
            if (shell.callback !== undefined) {   
                shell.callback(stdout); 
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

var db = require('./database.js');

module.exports = {
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
        var c = "ssh jos@" + host + " \"" + h.shutdown + "\"";
        shell.cmd(c, function(data){
            console.log('shutdown '+host+": "+data);
        });
    },
    ping: function(host, callback) {
        db.getIP(host,function(address){
            var c = "ping -c 1 -W 1 ";
            c += address;
            c += " &> /dev/null; echo $?";
            shell.cmd(c, function(data) {
                data = String(data).trim();
                if (data === '0') {
                    //DEBUG: console.log("PING: host " + host + " is alive");
                    if (callback !== undefined) { callback('alive'); }
                } else {
                    //DEBUG: console.log("PING: host " + host + " is not alive");
                    if (callback !== undefined) { callback('dead'); }
                }
            });
        });
    },
    vlc: {
        start: function(host) {
            var c = "ssh jos@" + host + " \"export DISPLAY=:0.0; ";
            var h = db.pc[host];
            c += h.vlcpad; 
            c += " --aspect-ratio 16:9 --fullscreen --extraintf rc --rc-host " + host + ":9876\"";
            shell.cmd(c);
        },
        kill: function(host) {
            var c = "ssh jos@" + host + " \"killall vlc \"";
            shell.cmd(c);
        }
    }
};
