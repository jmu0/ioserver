var socketlib = {
    sockets: [],
    devices: [],
    setControl: function(device, command, socket) {
        var dev = this.getDeviceByName(device);
        dev.socket = this.getSocketByName(dev.socketname);
        var line;
        if(dev) {
            if (dev.socket !== undefined) {
                dev.socket.write("setcontrol " + device + " " +command + "\n");
                command = command.split('=');
                process.ioserver.publish('update', { "iodevice": device, "iocontrol": command[0], "value": command[1] });
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
    requestStatus: function(to, from) {
        var dev = this.getDeviceByName(to);
        dev.socket = this.getSocketByName(dev.socketname);
        //DEBUG: console.log(dev);
        var line;
        if(dev) {
            dev.socket.write("requeststatus " + to + " " + from + "\n");
            line = "Status request sent to: " + dev.name + ", from: " + from + "\n";
            console.log(line);
        }
        else {
            line = "ERROR: device '" + to + "' not found.\n";
            console.log(line);
            var fromdev = this.getDeviceByName(from);
            if (fromdev) {
                fromdev.socket = this.getSocketByName(fromdev.socketname);
                fromdev.socket.write(line);
            }
        }
    },
    returnStatus: function(to, socket, status) {
        var dev = this.getDeviceByName(to);
        dev.socket = this.getSocketByName(dev.socketname);
        var ret = this.getSocketBySocket(socket);
        var line;
        if (dev) {
            dev.socket.write("returnstatus " + status);
            //DEBUG: console.log(status);
        } else {
            if (to === "this" || to === "server") {
                line = '{"name":"'+ret.name+'","status":'+status+'}';
                //DEBUG: console.log(line);
            }
            else {
                line = "ERROR: device '"+ to +"' not found.\n";
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
            if (socket) { socket.write(line); }
        }
    },
    event: function(event, devicename) {
        //send event to logicserver
        var dev = this.getDeviceByName(devicename);
        var sock;
        if (dev) {
            var logic = this.getDeviceByName('logic');
            if (logic) {
                sock = this.getSocketByName(logic.socketname);
                sock.write('event {"iodevice":"' + dev.name + '","event":"' + event + '"}\n');
            }
            console.log("Event: " + event + " on " + dev.name);
        }
        else {
            console.log("ERROR (event): device '"+dev.name+"' not found.\n");
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
process.ioserver.on('init', function(data){
    socketlib.initDevice(data.device, data.socket);
});
process.ioserver.on('remove', function(data){
    socketlib.removeDevice(data.device);
});
process.ioserver.on('sockets', function(data) {
    socketlib.printSocketList(data.socket);
});
process.ioserver.on('devices', function(data) {
    socketlib.printDeviceList(data.socket);
});
process.ioserver.on('setcontrol', function(data) {
    if (data.type==='socket'){
        socketlib.setControl(data.device, data.command, data.socket);
    }
});
process.ioserver.on('requeststatus', function(data){
    socketlib.requestStatus(data.to, data.from);
});
process.ioserver.on('returnstatus', function(data){
    socketlib.returnStatus(data.to, data.socket, data.status);
});
process.ioserver.on('setevent', function(data){
    socketlib.setEvent(data.device, data.event, data.socket);
});
process.ioserver.on('resetevent', function(data){
    socketlib.resetEvent(data.device, data.event, data.socket);
});
process.ioserver.on('event', function(data){
    socketlib.resetEvent(data.event, data.device);
});
process.ioserver.on('broadcast', function(data){ 
    socketlib.broadcast(data.message);
});



process.ioserver.on('update', function(data){
    //send update command to logicserver
    var logic = socketlib.getDeviceByName('logic');
    if (logic) {
        var sock = socketlib.getSocketByName(logic.socketname);
        if (sock) { sock.write('update '+ JSON.stringify(data) + '\n'); }
    }
});
process.ioserver.on('pong', function(data){
    //send update command to logicserver
    var logic = socketlib.getDeviceByName('logic');
    if (logic) {
        var sock = socketlib.getSocketByName(logic.socketname);
        if (sock) { sock.write('pong {"host":"'+data.host+'","pong":"' + data.pong +'"}\n'); }
    }
});
module.exports = socketlib;
