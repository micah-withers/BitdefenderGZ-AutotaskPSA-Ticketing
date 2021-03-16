// Require Fuse.js to perform fuzzy searches
const Fuse = require('fuse.js');
const psaRequest = require('psaRequest');

// Take a JSON (string) message from Bitdefender and identify
//   the parent company and configuration item in Autotask to
//   then create a ticket
async function createTicket (message) {
    let bdAlert = JSON.parse(message);
    let bdComputerName = bdAlert.computer_name.split('.')[0];  // Computer name without domain
    let bdComputerIp = bdAlert.computer_ip;  // This may be the local ip or external ip - must check both
    console.log(bdComputerName+':'+bdComputerIp);
    //  Request configuration items with name 'bdComputerName'
    let resConfigItems = await psaRequest.configItems(bdComputerName);
    //  Compare the local and external ip's to bdComputerIp
    let matches = 0;
    resConfigItems.data.items.forEach((item, i) => {
        if (item.rmmDeviceAuditIPAddress == ip || item.rmmDeviceAuditExternalIPAddress == ip) {
            computerID = item.id;
            companyID = item.companyID;
            matches += 1;
        }
    });


}

module.exports = async function (message) => {
    await createTicket(message);
}
