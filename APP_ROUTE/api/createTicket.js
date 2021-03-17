const fs = require('fs');
const psaRequest = require('psaRequest.js');
const bdRequest = require('bdRequest.js');
// Require Fuse.js to perform fuzzy searches
const Fuse = require('fuse.js');

//  Performs fuzzy search for phrase (string) in each field (array of keys to
//    search in, e.g. ["field1","field2"]) in the list (Object or array)
function search (phrase, fields, list) {
    let options = {
        includeScore: true,
        //  Keys in JSON/array whose values will be compared
        keys: fields
    }
    let fuse = new Fuse(list, options);
    return fuse.search(phrase);
}

//  Capitalizes each word separated by a delimitor (e.g. '_' for file_name)
//    and replaces them with spaces
function formatString(string, delimit) {
    let array = string.split(delimit);
    array.forEach((word, index) => {
        if (word) {
            array[index] = word[0].toUpperCase() + word.substring(1);
        }
    });
    return array.join(' ');
}

//  Transforms data in key:value format to formatted key: value list with
//    each pair on their own line
function unwrapData(data, key_delimit) {
    let string = "";
    Object.keys(data).forEach((key, i) => {
        let line = formatString(key, key_delimit)+': ';
        switch (typeof(data[key])) {
            case 'string':
                line += data[key]+'\n';
                break;
            default:
                line += unwrapData(data[key], key_delimit);
                break;
        }
        string += line;
    });
    return string;
}

function sort(string, order, delimit) {
    let array = string.split(delimit);
    order.forEach((orderLabel, orderIndex) => {
        array.forEach((label, index) => {
            if (label.includes(orderLabel) && index != orderIndex) {
                let temp = array[orderIndex];
                array[orderIndex] = array[index];
                array[index] = temp;
                return;
            }
        });
    });
    return array.join(delimit);
}

// Take a JSON (string) message from Bitdefender and identify
//   the parent company and configuration item in Autotask to
//   then create a ticket
//  TICKET REQUIRED FIELDS: id (0 for new tickets), status, priority, title,
//    companyID, dueDateTime
async function createTicket (message) {
    //  Object to contain all ticket information. Default values for each category
    //    must be set in config/ticketDefaults.json
    let ticket = JSON.parse(fs.readFileSync('json/ticketDefaults.json'));

    let bdMsg = JSON.parse(message);
    let bdComputerName = bdMsg.computer_name.split('.')[0];  // Computer name without domain
    let bdComputerIp = bdMsg.computer_ip;  // This may be the local ip or external ip - must check both
    console.log(bdComputerName+':'+bdComputerIp);
    try {
        //  Request configuration items with name 'bdComputerName'
        let resConfigItems = await psaRequest.configItems(bdComputerName);
        let items = resConfigItems.data.items;
    } catch (e) {
        console.log(e);
        return {};
    }
    //  Get the PSA computerID and companyID if only one configuration item
    //    with bdComputerName is found. Else check each item's ip addresses
    let matches = 0;
    if (items.length == 1) {
        let computerID = items[0].id;
        let companyID = items[0].companyID;
        matches += 1;
    } else if (items.length > 1) {
        //  Compare the local and external ip's to bdComputerIp to find the company id in PSA
        items.forEach((item, i) => {
            if (item.rmmDeviceAuditIPAddress == ip || item.rmmDeviceAuditExternalIPAddress == ip) {
                let computerID = item.id;
                let companyID = item.companyID;
                matches += 1;
            }
        });
    }
    //  If there were 0 or more than 1 matches, query Bitdefender for computer info,
    //    else create a ticket because the computer was found in PSA
    if (matches != 1) {
        try {
            //  Get computer info then identify the company name in Bitdefender
            let resEndpoint = await bdRequest.endpoint(bdMsg.computer_id);
            let resBdCompany = await bdRequest.company(resEndpoint.data.result.name);
            //  Get all active companies in Autotask
            let resPsaCompanies = await psaRequest.companies();
            //  Perform fuzzy search comparing the company name in Bitdefender to
            //    all company names in PSA
            let search = search(resBdCompany.data.result.name, ["companyName"], resPsaCompanies.data.items);
        } catch (e) {
            console.log(e);
            return {};
        }
        if (search.length == 1) {
            console.log(psaCompany.companyName+':'+psaCompany.id);
            ticket["companyID"] = psaCompany.id;
            let itemMatches = 0;
            //  Check if computer name is in Autotask with the correct company ID
            items.forEach((item, i) => {
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
    let bdModules = JSON.parse(fs.readFileSync('json/bdModules.json'));
    let bdMod = bdModules[bdAlert.module];
    ticket["title"] = `${bdMod.label} event on ${bdComputerName}`
    //  Transform Bitdefender message (key:value pairs) into readable string
    //    also sorts if sort_order contains an array with values matching
    //    the key for each line of the unwrapped bdMsg (e.g. ["Final Status"]
    //    for the final_status field if you want that to be the first line of
    //    the ticket description. Each value after "Final Status" will be second,
    //    third, fourth, etc. Any fields not in the sort_order will still be in
    //    the description but will not be sorted)
    let description = unwrapData(bdMsg, '_');
    if (bdMod.hasOwnProperty("sort_order")) {
        description = sort(description, bdMod.sort_order, '\n');
    }
    ticket["description"] = description;
    //  Set due date -- REQUIRED
    let date = new Date();
    date.setDate(date.getDate() + 14);  //  Sets date for two weeks from now (14 days)
    ticket["dueDateTime"] = date.toISOString();
    let subIss = bdMod.subIssueType;
    if (subIss) {
        switch (typeof subIss) {
            case 'string':
                ticket["subIssueType"] = subIss;
                break;
            case 'object':
                let field = subIss.field;
                if (subIss.list.hasOwnProperty(bdMsg[field])) {
                    ticket["subIssueType"] = subIss[bdMsg[subIss.field]];
                } else if (subIss.hasOwnProperty("default")){
                    ticket["subIssueType"] = subIss.default;
                }
                break;
            default:
            //  subIssueType will remain the default value
        }
    }
    //  Create ticket -- ID MUST BE 0 FOR NEW TICKETS
    return await psaRequest.tickets(ticket);
}

module.exports = async (message) => {
    return await createTicket(message);
}
