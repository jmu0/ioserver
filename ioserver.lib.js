/*jslint todo: true */
/*TODO: een aparte 'socket-host' maken. dit werkt niet meer samen met pc/nodo libs.
 * de socket-host ontvangt/verstuurd berichten, ook van de logicserver
 * een protokol voor deze berichten bedenken.
 * een publish/subscribe patroon maken waar alle verschillende modules (arduino, pc, nodo, ....) mee communiceren.
 *
 */

module.exports = {
    handlers: {},
    on: function(message, callback) {
        if (this.handlers[message] === undefined) {
            this.handlers[message] = [];
        }
        this.handlers[message].push(callback);
    },
    publish: function(message, data){
        //DEBUG:  console.log('Publish message: ' + message); console.log(data);
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
        this.nodo = require('./nodo.lib.js');
        this.pc = require('./pc.lib.js');
        this.socket = require('./socket.lib.js');
    },
    doCommand: function(data, socket) {
        //DEBUG: console.log("doCommand: " +data);
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
            //DEBUG: console.log(data);
            var firstspace = data.indexOf(' ');
            //DEBUG console.log("firstspace: " + firstspace + " eerste:" + data.substr(firstspace + 1, 1));
            if (data.substr(firstspace + 1, 1) === "{") { //is json
                var json = data.substr(firstspace + 1);
                //DEBUG console.log("json: :" + json + ":");
                try {
                    ret = JSON.parse(json);
                } catch (error) {
                    console.log("ERROR: ongeldige json: "+json);
                }
            } else { //no json, make backwards compatible
                var cmd = data.split(" ");
                switch (cmd[0]) {
                    case 'init':
                    case 'remove':
                        ret.device = cmd[1];
                    break;
                    case 'setcontrol':
                        if (cmd[1] === 'kaku') {
                            ret.type='kaku';
                            ret.device = 'kaku';
                            ret.command=cmd[2];
                        } else {
                            ret.type='socket';
                            ret.device=cmd[1];
                            ret.command=cmd[2];
                        }
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
                        ret.command = cmd;
                    break;
                    default:
                        console.log("ERROR: Unknown command: " + data);
                    break;
                }
            } 
        }
        ret.socket=socket;
        return ret;
    }
};
