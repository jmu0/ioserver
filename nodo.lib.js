/*jslint todo: true */
var net = require('net');
var nodo;
var nodoname = 'nodo.muysers.nl';
var nodoport = 23;
var checkinterval;


function nodoData(data) {
    //let op: data = array met ascii codes
    if (data[0] !== 10 && data[0]!==13&&data[0]!==33&&data[0]!==62) { //10=line feed,13=carriage return,33=!,62=>
        //DEBUG: console.log(JSON.stringify(data));
        console.log("nodo: "+data);
        //TODO: events van nodo verwerken??
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
    });
    nodo.on('data', nodoData);
    nodo.on('error', nodoError);
    if (checkinterval !== undefined) {
        clearInterval(checkinterval);
    }
    checkinterval = setInterval(function(){
        if (nodo.writable === false) {
            console.log('nodo lost, reconnecting...');
            connectNodo();
        }
    }, 2000);
}

var lastCommand = Date.now();
var interval = 800;
var time = 0;

module.exports = {
    write: function(data) {
        if (data.substr(data.length -1) !== "\n") { data += "\n"; }
        nodo.write(data);
    },
    kaku: function(command) {
        command=command.replace("=", ",");
        command = "newkakusend "+command;
        if (command.substr(command.length -1) !== "\n") { command += "\n"; }

        time=(lastCommand+interval) - Date.now();
        if (time < 1) { time=1;}
        /*
        console.log(lastCommand);
        console.log(lastCommand+interval);
        console.log(Date.now());
        console.log((lastCommand+interval) - Date.now());
        console.log('time: '+time);
        */
        lastCommand = Date.now() + time;
        //console.log(lastCommand);
        setTimeout(function(){
            //console.log('nodo write: ' + command);
            nodo.write(command);
        }, time);
    }
};
connectNodo();
/*KAKU codes:
 * 1 = een stopcontact
 * 11 = dimmer multi achter tv
 * 12 = dimmer staande lamp
 *
 * 15=lamp kamer 1
 * 16=lamp kamer 2
 *
 * 20=lamp keuken
 *
 */



