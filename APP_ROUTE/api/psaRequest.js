const fs =require('fs');
const request = require('axiosRequest.js');
let psaApiPath = "config/psaApiHeaders.json";
const psaApiHeaders = JSON.parse(fs.readFileSync(psaApiPath, 'utf8'));

async function psaRequest (apiPath, method, data){
    let url = "https://webservices"+psaApiHeaders.region+".autotask.net/atservicesrest/v1.0/"+apiPath;
    let headers = {
        "ApiIntegrationcode": psaApiHeaders.api_integration_code,  // API tracking identifier
        "UserName": psaApiHeaders.username,  // API-only username
        "Secret": psaApiHeaders.secret,  // API-only password
        "Content-Type": "application/json"
    }
    console.log("Sending %s request to %s...", method, apiPath);
    let result = await request(url, method, data, headers);
    console.log("Status code %s", result.status);
    return result;
}

async function psaConfigItems (name) {
    let apiPath = "ConfigurationItems/query";
    let method = "POST";
    let query =     //  POST data/body to query Autotask for a configuration
    {               //    item with the supplied hostname
        "IncludeFields": ["id","companyID","rMMDeviceAuditHostname","rmmDeviceAuditExternalIPAddress","rmmDeviceAuditIPAddress"],
        "filter": [ {"op": "eq","field": "rmmDeviceAuditHostname", "value": ""} ]
    }
    query["filter"][0]["value"] = name;
    return await psaRequest(apiPath, method, query);
}

module.exports = {
    configItems: async (name) => {
        return await psaConfigItems(name);
    }
}
