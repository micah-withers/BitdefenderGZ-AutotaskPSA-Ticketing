const fs = require('fs');
const psaRequest = require('psaRequest.js');
const bdRequest = require('bdRequest.js');
// Require Fuse.js to perform fuzzy searches
const Fuse = require('fuse.js');

function search (phrase, fields, list) {
    let options = {
        includeScore: true,
        //  Keys in JSON/array whose values to compare the word to
        keys: fields
    }
    let fuse = new Fuse(list, options);
    return fuse.search(phrase);
}

// Take a JSON (string) message from Bitdefender and identify
//   the parent company and configuration item in Autotask to
//   then create a ticket
async function createTicket (message) {
    //  Object to contain all ticket information. Default values for each category
    //    must be set in config/ticketDefaults.json
    let ticket = JSON.parse(fs.readFileSync('config/ticketDefaults.json'));
    //  Set due date
    let date = new Date();
    date.setDate(date.getDate() + 14);  //  Sets due date for two weeks (14 days)
    ticket["dueDateTime"] = date.toISOString();

    let bdAlert = JSON.parse(message);
    let bdComputerName = bdAlert.computer_name.split('.')[0];  // Computer name without domain
    let bdComputerIp = bdAlert.computer_ip;  // This may be the local ip or external ip - must check both
    console.log(bdComputerName+':'+bdComputerIp);
    //  Request configuration items with name 'bdComputerName'
    let resConfigItems = await psaRequest.configItems(bdComputerName);
    //  Compare the local and external ip's to bdComputerIp to find the company id in PSA
    let matches = 0;
    resConfigItems.data.items.forEach((item, i) => {
        if (item.rmmDeviceAuditIPAddress == ip || item.rmmDeviceAuditExternalIPAddress == ip) {
            let computerID = item.id;
            let companyID = item.companyID;
            matches += 1;
        }
    });
    //  If there were 0 or more than 1 matches, query Bitdefender for computer info,
    //    else create a ticket because the computer was found in PSA
    if (matches != 1) {
        //  Get computer info then identify the company name in Bitdefender
        let resEndpoint = await bdRequest.endpoint(bdAlert.computer_id);
        let resBdCompany = await bdRequest.company(resEndpoint.data.result.name);
        //  Get all active companies in Autotask
        let resPsaCompanies = await psaRequest.companies();
        //  Perform fuzzy search comparing the company name in Bitdefender to
        //    all company names in PSA
        let search = search(resBdCompany.data.result.name, ["companyName"], resPsaCompanies.data.items);
        if (search.length == 1) {
            console.log(psaCompany.companyName+':'+psaCompany.id);
            ticket["companyID"] = psaCompany.id;
            let itemMatches = 0;
            resConfigItems.data.items.forEach((item, i) => {
                if (item.companyID == psaCompany.id) {
                    let computerID = item.id;
                    itemMatches += 1;
                }
            });
            if (itemMatches == 1) {
                ticket["configurationItemID"] = computerID;
            } else {
                console.log("Computer could not be identified in Autotask PSA. \
                    A ticket will be created without a configuration item ID");
            }
        } else {
            console.log("Company and computer could not be identified in Autotask PSA. \
                A ticket will be created with the default company and without a configuration item ID");
        }
    } else {
        ticket["companyName"] = companyID;
        ticket["configurationItemID"] = computerID;
    }
    ticket["title"] = ``
    //  Create ticket -- ID MUST BE 0 FOR NEW TICKETS
    return await psaRequest.tickets(ticket);
}

module.exports = async (message) => {
    return await createTicket(message);
}
