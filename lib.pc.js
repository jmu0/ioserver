/*jslint todo: true */

var pclib = {
    user: 'jos',
    shell: {
        exec: require('child_process').exec,
        callback: undefined,
        cmd: function(cmd, callback) {
            var Callback = callback;
            if (process.ioserver.debug) { console.log('pc shell: ' + cmd); }
            process.ioserver.pc.shell.exec(cmd, function(error, stdout, stderr) {
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
    }
};

process.ioserver.on('ping', function(data) {
    if (data.hostname) {
        process.ioserver.dns.getIP(data.hostname, function(address) {
            var c = "ping -c 1 -W 1 ";
            c += address;
            c += " &> /dev/null; echo $?";
            process.ioserver.pc.shell.cmd(c, function(res) {
                res = String(res).trim();
                if (res === '0') {
                    process.ioserver.publish('pong', {
                        "hostname": data.hostname,
                        "pong": "alive"
                    });
                } else {
                    process.ioserver.publish('pong', {
                        "hostname": data.hostname,
                        "pong": "dead"
                    });
                }
            });
        });
    }
});

process.ioserver.on('wake', function(data) {
    //NOTE: install 'wol' on server
    if (process.ioserver.debug) { console.log('PC WAKE: '); console.log(data); }
    if (data.mac !== undefined) {
        process.ioserver.pc.shell.cmd('wol ' + data.mac, function(ret) {
            console.log('wol ' + data.hostname + ": " + String(ret).trim());
        });
    } else {
        console.log("pc wakeonlan: no mac adres");
    }
});

process.ioserver.on('shutdown', function(data) {
    var c = "ssh " + pclib.user + "@" + data.hostname + " \"" + data.shutdownCommand + "\"";
    process.ioserver.pc.shell.cmd(c, function(ret) {
        console.log('shutdown ' + data.hostname + ": " + ret);
    });
});

module.exports = pclib;
