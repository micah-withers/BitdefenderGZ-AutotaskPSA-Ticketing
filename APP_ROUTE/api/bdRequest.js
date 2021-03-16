const fs =require('fs');
const request = require('axiosRequest.js');
let bdApiPath = "config/bdApiHeaders.json";
const bdApiHeaders = JSON.parse(fs.readFileSync(bdApiPath, 'utf8'));

async function bdRequest (region, apiPath, method, data){
    let url = "https://cloud.gravityzone.bitdefender.com/api/v1.0/jsonrpc/"+apiPath;
    let headers = {
        "Authorization": bdApiHeaders.authentication_string,  // API tracking identifier
        "Content-Type": "application/json"
    }
    console.log("Sending %s request...", method);
    let result = await request(url, method, data, headers);
    console.log(`Request sent to ${options.url} with status code ${res.status}`);
    return result;
}

async function bdEndpoint (id) {
    let apiPath = "network";
    let method = "POST";
    let query =     //  POST data/body to query Bitdefender for the endpoint
    {
        "params": {
            "endpointId": id
        },
        "id": "1111"+id,
        "jsonrpc": "2.0",
        "method": "getManagedEndpointDetails"
    }
    return await bdRequest(apiPath, method, query);
}

async function bdCompany (id) {
    let apiPath = "companies";
    let method = "POST";
    let query =     //  POST data/body to query Bitdefender for the endpoint
    {
        "params": {
            "companyId": id
        },
        "id": "2222"+id,
        "jsonrpc": "2.0",
        "method": "getCompanyDetails"
    }
    return await bdRequest(apiPath, method, query);
}

module.exports = {
    endpoint: async (id) {
        return await bdEndpoint(id);
    },
    company: async (id) {
        return await bdCompany(id);
    }
}
