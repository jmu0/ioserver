module.exports = {
    sockets: [],
    devices: [],
    nodo: require('./nodo.lib.js'),
    pc: require('./pc.lib.js'),
    doCommand: function(data, socket) {
        var logic, sock;
        if ((data.length > 0) && (data !== "\r\n")){
            data = data.replace(/(\r\n|\n|\r)/gm,"");
            console.log("doCommand: " +data);
            var cmd = data.split(" ");
            switch (cmd[0]) {
                case 'init':
                    this.initDevice(cmd[1], socket);
                break;
                case 'remove':
                    this.removeDevice(cmd[1]);
                break;
                case 'sockets':
                    this.printSocketList(socket);
                break;
                case 'devices':
                    this.printDeviceList(socket);
                break;
                case 'setcontrol':
                    if (cmd[1] === 'kaku') {
                    this.nodo.kaku(cmd[2]);
                } else {
                    this.setControl(cmd[1],cmd[2],socket);
                }
                //update commando naar logicserver sturen
                logic = this.getDeviceByName('logic');
                if (logic) {
                    sock = this.getSocketByName(logic.socketname);
                    if (sock) { sock.write('update ' + cmd[1]+ " " + cmd[2] + "\n"); }
                }
                break;
                case 'requeststatus':
                    this.requestStatus(cmd[1],cmd[2]);
                break;
                case 'returnstatus':
                    this.returnStatus(cmd[1],socket,cmd[2]);
                break;
                case 'setevent':
                    this.setEvent(cmd[1],cmd[2] + " " + cmd[3],socket);
                break;
                case 'resetevent':
                    this.resetEvent(cmd[1],cmd[2] + " " + cmd[3],socket);
                break;
                case 'event':
                    this.event(cmd[2]+" "+cmd[3],cmd[1]);
                break;
                case 'broadcast':
                    this.broadcast(data.replace(cmd[0], ""));
                break;
                case 'nodo':
                    var i;
                var com="";
                for (i=1; i<cmd.length; i++){
                    com += cmd[i] + " ";
                }
                this.nodo.write(com);
                break;
                case 'pc':
                    var host = cmd[1];
                switch (cmd[2]){
                    case 'ping':
                        this.pc.ping(host,function(data) {
                        socket.write(host+" "+data + "\n");
                    });
                    break;
                    case 'wake':
                        this.pc.wake(host);
                    break;
                    case 'shutdown': 
                        this.pc.shutdown(host);
                    break;
                    default: 
                        break;
                }
                break;
                default:
                    console.log("ERROR: Unknown command: " + data);
                break;
            }
        }
    },
    getDeviceIDByName: function(name) {
        var i;
        for(i=0; i < this.devices.length; i++) {
            if (this.devices[i].name === name) {
                return i;
            }
        }
        return -1;
    },
    getDeviceByName: function(name) {
        var i;
        for(i=0; i < this.devices.length; i++) {
            if (this.devices[i].name === name) {
                return this.devices[i];
            }
        }
        return false;
    },
    getSocketByName: function(name) {
        var i;
        for(i=0; i<this.sockets.length;i++) {
            if (this.sockets[i].name === name){
                return this.sockets[i];
            }
        }
        return false;
    },
    getSocketBySocket: function(socket) {
        var d;
        for(d=0; d<this.sockets.length; d++) {
            if (this.sockets[d].socket === socket){
                return this.sockets[d];
            }
        }
        return false;
    },
    getSocketIDBySocket: function(socket) {
        var d;
        for(d=0; d<this.sockets.length; d++) {
            if (this.sockets[d].socket === socket){
                return d;
            }
        }
        return -1;
    },
    getSocketByIP: function(ip) {
        var d;
        for(d=0; d<this.sockets.length; d++) {
            if (this.sockets[d].ip === ip){
                return this.sockets[d];
            }
        }
        return false;
    },
    getSocketByID: function(id) {
        return this.sockets[id].socket;
    },
    printSocketList: function(socket) {
        var d,line;
        for(d=0; d < this.sockets.length; d++) {
            line = "socket name: " + this.sockets[d].name + ", ip: " + this.sockets[d].ip;
            line += ", port: " + this.sockets[d].port;
            console.log(line);
            socket.write(line + "\n");
        }
    },
    printDeviceList: function(socket) {
        var d,line;
        for(d=0; d < this.devices.length; d++) {
            line = "device name: " + this.devices[d].name + ", socketname: " + this.devices[d].socketname;
            console.log(line);
            socket.write(line + "\n");
        }
    },
    setControl: function(device, command, socket) {
        var dev = this.getDeviceByName(device);
        dev.socket = this.getSocketByName(dev.socketname);
        var line;
        if(dev) {
            if (dev.socket !== undefined) {
                dev.socket.write("setcontrol " + device + " " +command + "\n");
            } else { 
                console.log("SOCKET ERROR: " + dev.socketname);
            }
        }
        else {
            line = "ERROR: device '"+device+"' not found.\n";
            console.log(line);
            socket.write(line);
        }
    },
    requestStatus: function(device, from) {
        var dev = this.getDeviceByName(device);
        dev.socket = this.getSocketByName(dev.socketname);
        console.log(dev);
        var line;
        if(dev) {
            dev.socket.write("requeststatus " + device + " " + from + "\n");
            line = "Status request sent to: " + dev.name + ", from: " + from + "\n";
            console.log(line);
        }
        else {
            line = "ERROR: device '"+device+"' not found.\n";
            console.log(line);
            var fromdev = this.getDeviceByName(from);
            if (fromdev) {
                fromdev.socket = this.getSocketByName(fromdev.socketname);
                fromdev.socket.write(line);
            }
        }
    },
    returnStatus: function(device, socket, status) {
        var dev = this.getDeviceByName(device);
        dev.socket = this.getSocketByName(dev.socketname);
        var ret = this.getSocketBySocket(socket);
        var line;
        if (dev) {
            dev.socket.write(status);
            console.log(status);
        }
        else {
            if (device === "this" || device === "server") {
                line = '{"name":"'+ret.name+'","status":'+status+'}';
                console.log(line);
            }
            else {
                line = "ERROR: device '"+device+"' not found.\n";
                console.log(line);
                socket.write(line);
            }
        }
    },
    setEvent: function(device, event, socket) {
        var dev = this.getDeviceByName(device);
        dev.socket = this.getSocketByName(dev.socketname);
        var line;
        if(dev) {
            dev.socket.write("setevent " + device + " " + event + "\n");
            line = "Set event: '"+event+"' on: "+device+"\n";
            console.log(line);
            //socket.write(line);
        }
        else {
            line = "ERROR: device '"+device+"' not found.\n";
            console.log(line);
            socket.write(line);
        }
    },
    resetEvent: function(device, event, socket) {
        var dev = this.getDeviceByName(device);
        dev.socket = this.getSocketByName(dev.socketname);
        var line;
        if(dev) { 
            dev.socket.write("resetevent " + device + " " + event + "\n");
            line = "Reset event: '"+event+"' on: "+device+"\n";
            console.log(line);
            //socket.write(line);
        }
        else {
            line = "ERROR: device '"+device+"' not found.\n";
            console.log(line);
            socket.write(line);
        }
    },
    event: function(event, devicename) {
        var dev = this.getDeviceByName(devicename);
        var line, sock;
        if (dev) {
            line = "Event: " + event + " on " + dev.name;
            var logic = this.getDeviceByName('logic');
            if (logic) {
                sock = this.getSocketByName(logic.socketname);
                sock.write('event ' + dev.name + " " + event);
            }
            console.log(line);
        }
        else {
            line = "ERROR (event): device '"+dev.name+"' not found.\n";
            console.log(line);
        }
    },
    broadcast: function(data) {
        var s;
        for(s=0; s < this.sockets.length; s++) {
            console.log("broadcast: "+data+"\n");
            this.sockets[s].write("broadcast: "+data);
        }
    },
    initDevice: function(name, socket) {
        var logic, sock;
        var device = { 'name': name, 'socketname': this.getSocketBySocket(socket).name };
        var id = this.getDeviceIDByName(name);
        if (id === -1) {
            this.devices[this.devices.length] = device;
        } else {
            this.devices[id] = device;
        }
        if (name !== 'logic') {
            logic = this.getDeviceByName('logic');
            if (logic) {
                sock = this.getSocketByName(logic.socketname);
                sock.write('init ' + name + "\n");
            }
        } else {
            var i; 
            for (i = 0; i < this.devices.length; i++) {
                if (this.devices[i].name !== 'logic') {
                    socket.write('init ' + this.devices[i].name + "\n");
                }
            }
        }
        console.log("initialized " + name);
    },
    removeDevice: function(name) {
        var i;
        for (i = 0; i < this.devices.length; i++) {
            if (this.devices[i].name === name) {
                this.devices.splice(i,1);
                console.log("removed " + name);
                return 0;
            }
        }
        console.log("ERROR: remove device: " + name + " not found!");
        return 1;
    },
    addSocket: function(socket) {
        socket.setKeepAlive(true);
        var db = require('./database.js');
        var ip = socket._peername.address;
        var port = socket._peername.port;
        var dit = this;
        var d;
        var device = { 'ip':ip,'port':port,'name':ip+":"+port,'socket':socket, 'locked':false };
        db.getHostNameByIP(ip, function(name) {
            //gethostname heeft vertraging. bij connect > init is de socket nog niet toegevoegd. daarom hostname updaten:
            var oldname=ip+":"+port;
            var newname=name+":"+port;
            for (d = 0; d < dit.sockets.length; d++) {
                if (dit.sockets[d].name=== oldname) {
                    dit.sockets[d].name = newname;
                }
            }
            for (d = 0; d < dit.devices.length; d++) {
                if (dit.devices[d].socketname === oldname) {
                    dit.devices[d].socketname = newname;
                }
            }
        });
        device.write=function(data) {
            this.socket.write(data);
        };
        for (d = 0; d < dit.sockets.length; d++) {
            if ((dit.sockets[d].ip === ip) && (dit.sockets[d].port === port)) {
                dit.sockets.splice(d,1);
            }
        }
        dit.sockets[dit.sockets.length] = device;
        //console.log(this.sockets);
    },
    removeSocket: function(socket) {
        var ip = socket._peername.address;
        var port = socket._peername.port;
        var i, j;
        for(i=0; i < this.sockets.length; i++) {
            if ((this.sockets[i].ip === ip) && (this.sockets[i].port === port)){
                for (j = 0; j < this.devices.length; j++) {
                    if (this.devices[j].socketname === this.sockets[i].name) {
                        this.devices.splice(j,1);
                    }
                }
                this.sockets.splice(i,1);
            }
        }
    }
};
