// Required app dependencies:
// Require express and create an instance of it
const express = require('express');
const app = express();
// Require node File System module
const fs = require('fs');
// Require bodyParser and create an instance of a json textParser
const bodyParser = require('body-parser');
const textParser = bodyParser.json();
// Require epsSyslogHelper -> this part will be explained below
const epsSyslogHelper = require('./api/epsSyslogHelper');
// Require createTicket.js for ticket creation
const createTicket = require('.api/createTicket.js');

let configPath = "api/config/config.json";
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Check req.header.authorization
// If the authorization string is the same as the one from your config file, continue. Otherwise, enter not return to stop the execution.
// use basic HTTP auth to secure the api
app.use('/api', (req, res, next) => {
    console.log(req.headers.authorization);
    // check for basic auth header
    if (!req.headers.authorization) {
        return res.status(401).json({ message: 'Missing Authorization Header' });
    }
    // verify auth credentials
    const authorizationString = req.headers.authorization;
    if (config.authentication_string !== authorizationString) {
        return res.status(401).json({ message: 'Invalid Authentication Credentials' });
    }
    next();
});

// Add a route that answers to the request coming from Event Push Service API. Parse the body and log it using
// url: http://{server_url}:{port}/api/
app.post('/api', textParser, async function (request, response) => {
    const body = request.body;
    let syslogHelper = new EpsSyslogHelper(config);
    let messages = syslogHelper.log("BITDEFENDER ALERT", body);
    response.sendStatus(200);
    messages.forEach(async function (message, index) => {
        await createTicket(message);
    });
});

// Set the server to listen on the port configured in the config.json file:
app.listen(config.port, () => console.log(`Listening on port ${config.port}`));
