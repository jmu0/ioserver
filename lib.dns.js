var dns = require('dns');
module.exports = {
    getHostNameByIP: function(ip, callback) {
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
        dns.resolve(hostname, function(err, address, family){
            if (callback !== undefined){
                callback(address,err,family);
            }
        });
    },
};
