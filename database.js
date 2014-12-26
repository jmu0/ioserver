/*jslint todo: true */
module.exports = {
    getHostNameByIP: function(ip, callback) {
        //TODO: waarom staat dit in database.js?
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
        //TODO: waarom staat dit in database.js?
        var dns = require('dns');
        dns.resolve(hostname, function(err, address, family){
            if (callback !== undefined){
                callback(address,err,family);
            }
        });
    },
    pc: {//TODO: naar logic
        "htpc": {
            "description": "pc jos boven",
            "vlcStartCommand": "/usr/bin/vlc --aspect-ratio 16:9 --fullscreen --extraintf rc --rc-host htpc:9876",
            "vlcKillCommand": "killall vlc",
            "shutdown": "sudo shutdown -hP now",
            "mac": "50:e5:49:be:e8:9e",
            "translate": []
        },
        "htpc1": {
            "description": "pc woonkamer jos",
            "vlcStartCommand": "/usr/bin/vlc --aspect-ratio 16:9 --fullscreen --extraintf oldrc --rc-host htpc1:9876",
            "vlcKillCommand": "killall vlc",
            "shutdown": "sudo shutdown -hP now",
            "mac": "c0:3f:d5:6b:3f:e0",
            "translate": []
        },
        "htpc2": {
            "description": "pc slaapkamer jos",
            "vlcStartCommand": "/usr/bin/vlc --aspect-ratio 16:9 --fullscreen --extraintf rc --rc-host htpc2:9876",
            "vlcKillCommand": "killall vlc",
            "shutdown": "sudo shutdown -hP now",
            "mac": "c8:60:00:84:f5:e2",
            "translate": []
        },
        "josmac": {
            "discription":"macbook air van jos",
            "vlcStartCommand": "/Applications/VLC.app/Contents/MacOS/VLC --aspect-ratio=16:9 --fullscreen --extraintf=rc --rc-host=josmac:9876",
            "vlcKillCommand": "killall -9 VLC",
            "shutdown": "sudo shutdown -h now",
            "mac": "98:fe:94:43:e5:a6",
            "translate": [
                {"from": "/home/jos", "to": "/Users/jos/mediaserver"}
            ]
        }
    }
};
