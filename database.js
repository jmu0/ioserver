module.exports = {
    getDeviceNameByIP: function(ip, callback)
    {
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
    }
};
