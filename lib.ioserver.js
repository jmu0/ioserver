/*jslint todo: true */

module.exports = {
    handlers: {},
    on: function(message, callback) {
        if (this.handlers[message] === undefined) {
            this.handlers[message] = [];
        }
        this.handlers[message].push(callback);
    },
    publish: function(message, data){
        if (process.ioserver.debug) { 
            console.log('lib.ioserver: Publish message: ' + message); 
        }
        if (this.handlers[message] !== undefined){
            this.handlers[message].forEach(function(handler){
                handler(data);
            });
        }
    },
    nodo: undefined, //require('./nodo.lib.js'),
    pc: undefined, //require('./pc.lib.js'),
    socket: undefined, //require('./socekt.lib.js'),
    init: function(){
        this.dns= require('./lib.dns.js');
        this.nodo = require('./lib.nodo.js');
        this.pc = require('./lib.pc.js');
        this.vlc = require('./lib.vlc.js');
        this.socket = require('./lib.socket.js');
    },
    doCommand: function(data, socket) {
        var cmd = this.parseCmd(data);
        data = this.parseData(data,socket);
        if (cmd.length > 0) {
            this.publish(cmd, data);
        }
    },
    parseCmd: function(data){
        data = data.replace(/(\r\n|\n|\r)/gm,"").trim();
        var cmd = data.split(" ");
        cmd = cmd[0];
        return cmd;
    },
    parseData: function(data, socket) {
        //var logic, sock;
        var ret = {};
        if ((data.length > 0) && (data !== "\r\n")){
            data = data.replace(/(\r\n|\n|\r)/gm,"").trim();
            var firstspace = data.indexOf(' ');
            if (data.substr(firstspace + 1, 1) === "{") { //is json
                var json = data.substr(firstspace + 1);
                try {
                    ret = JSON.parse(json);
                } catch (error) {
                    console.log("lib.ioserver: ERROR ioserver parseDate: invalid json: "+json);
                }
            } else { //no json, make backwards compatible
                var cmd = data.split(" ");
                switch (cmd[0]) {
                    case 'init':
                    case 'remove':
                        ret.device = cmd[1];
                    break;
                    case 'setcontrol':
                        ret.iodevice=cmd[1];
                        ret.iocontrol=cmd[2].split('=')[0];
                        ret.value=cmd[2].split('=')[1];
                    break;
                    case 'requeststatus':
                        ret.to = cmd[1];
                        ret.from = cmd[2];
                    break;
                    case 'returnstatus':
                        ret.to = cmd[1];
                        ret.status = cmd[2];
                    break;
                    case 'setevent':
                    case 'resetevent':
                    case 'event':
                        ret.device = cmd[1];
                        ret.event = cmd[2] + " " + cmd[3];
                    break;
                    case 'broadcast':
                        ret.message = data.replace(cmd[0], "");
                    break;
                    case 'nodo':
                        var i;
                        ret.command = "";
                        for (i=1; i<cmd.length; i++){
                            ret.command += cmd[i] + " ";
                        }
                    break;
                    case 'pc':
                        ret.host = cmd[1];
                        ret.command = cmd[2];
                        if (ret.command === 'vlc') {
                            if (cmd[3]) {
                                ret.vlc = cmd[3];
                            }
                            if (cmd[4] && ret.vlc) {
                                ret.file = cmd[4];
                            }
                        }
                    break;
                    default:
                        console.log("lib.ioserver: ERROR ioserver Unknown command: (" + data + ")");
                    break;
                }
            } 
        }
        ret.socket=socket;
        return ret;
    }
};
