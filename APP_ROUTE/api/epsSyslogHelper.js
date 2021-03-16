// Start the Client server based on the config file.
/**
* EventConverter class
*/
EpsSyslogHelper = function (config) {
    const os = require('os');
    var syslog = require('syslog-client');
    let hostName = os.hostname();
    if (!hostName) {
        hostName = 'localhost';
    }
    let dot = hostName.indexOf('.');
    if (dot > 0) {
        hostName = hostName.substring(0, dot);
    }
    console.log('Logging using host name %s', hostName);
    this._client = syslog.createClient(config.target, {
        syslogHostname: hostName,
        port: config.syslog_port,
        transport: syslog.Transport[config.transport]
    });
    this._client.on('error', function(err) {
        console.error('Error from syslog network: %s', err);
    });
};

// Parse the message and log the event.
EpsSyslogHelper.prototype.log = function _log(title, msg) {
    var syslog = require('syslog-client');
    let options = {
        facility: syslog.Facility.Local0,
        severity: syslog.Severity.Informational
    };
    let events;
    if(msg.hasOwnProperty('jsonrpc')){
        console.log("Message is JSONrpc");
        events = msg.params.events;
    }
    else {
        console.log("Message is not JSONrpc");
    }
    if(events){
        let msgArray = [];
        for(let eventKey in events) {
            let syslogMessage = events[eventKey];
            if(typeof syslogMessage !== 'string') {
                syslogMessage = JSON.stringify(syslogMessage);
            }
            console.log("Event key = " + eventKey + " is = " + syslogMessage);
            this._client.log(title + ":" + syslogMessage, options, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Sent to syslog')
                }
            });
            msgArray.push(syslogMessage);
        }
        return msgArray;
    }
};
