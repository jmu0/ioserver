module.exports = {
    getHostNameByIP: function(ip, callback) {
        var dns = require('dns');
        dns.reverse(ip, function(err, adresses){
            if (!err){
                if (callback !== undefined){ 
                    var name = adresses[0];
                    name = name.replace('.muysers.nl', '');
                    callback(name);
                }
            }
            else{
                callback("unknown");
            }
        });
    },
    getIP: function(hostname, callback) {
        var dns = require('dns');
        dns.resolve(hostname, function(err, address, family){
            if (callback !== undefined){
                callback(address,err,family);
            }
        });
    },
    pc: {
        "htpc": {
            "desctiption": "pc jos boven",
            "vlcpad": "/usr/bin/vlc",
            "shutdown": "sudo shutdown -hP now",
            "mac": "50:e5:49:be:e8:9e"
        },
        "htpc2": {
            "description": "pc woonkamer jos",
            "vlcpad": "/usr/bin/vlc",
            "shutdown": "sudo shutdown -hP now",
            "mac": "c8:60:00:84:f5:e2"
        },
        "josmac": {
            "discription":"macbook air van jos",
            "vlcpad": "/Applications/VLC.app/Contents/MacOS/VLC",
            "shutdown": "sudo shutdown -h now",
            "mac": "98:fe:94:43:e5:a6"
        },
        "windows": {
            "description":"windows pc kantoor",
            "vlcpad":"vlc",
            "shutdown":"",
            "mac": "74:d4:35:ea:da:5a"
        }
    }
};
