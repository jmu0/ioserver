/*jslint todo: true */
/*global ioserver */
var net = require('net');
var nodo, logic, sock;
var nodoname = 'nodo.muysers.nl';
var nodoport = 23;
var checkinterval;


function nodoData(data) {
    if (data[0] !== 10 && data[0]!==13&&data[0]!==33&&data[0]!==62) { //10=line feed,13=carriage return,33=!,62=>
        data = String(data); //data = array met ascii codes
        if (process.ioserver.debug) { console.log('nodo: '+data); }
        if (data.indexOf('Input') === 0 && data.indexOf('HTTP') === -1) {
            data=data.split('; ');
            data = data[2].split('=')[1];
            data = data.replace('NewKAKU', 'kaku').replace('kakuSend', 'kaku').replace(',','=');
            data = data.replace(/(\r\n|\n|\r)/gm,"").trim();
            console.log('NODO event: '+data);
            process.ioserver.publish('event', { iodevice: 'kaku', ioevent: data });
        }
        /* NODO via telnet een event aan nodo toevoegen:
         * EventlistShow = laat alle events zien
         * EventlistErase = leegmaken
         * EventlistWrite; WildCard ALL,ALL; EventSend HTTP
         * dan komen alle events hier binnen.
         * om ir signalen te ontvangen: RawSignalReceive On
         */
    }
}
function nodoError(error) {
    console.log("NODO ERROR: " + error);
}
function connectNodo() {
    nodo = new net.Socket();
    nodo.connect(nodoport, nodoname, function(){
        console.log("Connected to: " + nodoname + ":" + nodoport);
        nodo.write('\n');
        process.ioserver.publish('init', { device: "kaku", socket: this });//initialize kaku 
    });
    nodo.on('data', nodoData);
    nodo.on('error', nodoError);
    if (checkinterval !== undefined) {
        clearInterval(checkinterval);
    }
    checkinterval = setInterval(function(){
        if (nodo.writable === false) {
            console.log('nodo lost, reconnecting...');
            process.ioserver.publish('remove', { device: 'kaku' });
            connectNodo();
        }
    }, 2000);
}

var lastCommand = Date.now();
var interval = 800;
var time = 0;

var nodolib = {
    write: function(data) {
        console.log('WRITIIING!!');
        if (data.substr(data.length -1) !== "\n") { data += "\n"; }
        nodo.write(data);
    },
    kaku: function(cmd) {
        var command = "newkakusend " + cmd.iocontrol + "," + cmd.value;
        if (command.substr(command.length -1) !== "\n") { command += "\n"; }
        console.log('KAKU COMMAND: ' + command);
        time=(lastCommand+interval) - Date.now();
        if (time < 1) { time=1;}
        /* DEBUG: 
           console.log(lastCommand);
           console.log(lastCommand+interval);
           console.log(Date.now());
           console.log((lastCommand+interval) - Date.now());
           console.log('time: '+time);
           */
        lastCommand = Date.now() + time;
        //DEBUG: console.log(lastCommand);
        setTimeout(function(){
            //DEBUG: console.log('nodo write: ' + command);
            nodo.write(command);
            process.ioserver.publish('updatecontrol', { "iodevice": "kaku", "iocontrol": cmd.iocontrol, "value": cmd.value });
        }, time);
    }
};
connectNodo();

process.ioserver.on('setcontrol', function(data){
    //DEBUG:console.log('SETCONTROL in kaku lib'); console.log(data);
    if (data.iodevice === 'kaku') {
        nodolib.kaku(data);
    }
});
process.ioserver.on('nodo', function(data){
    nodolib.write(data.command);
});

module.exports = nodolib;
