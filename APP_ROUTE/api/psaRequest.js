const request = require('axiosRequest.js');
let psaApiPath = "config/psaApi.json";
const psaApi = JSON.parse(fs.readFileSync(psaApiPath, 'utf8'));
async function psaRequest (region, apiPath, method, data){
    let url = "https://webservices"+config.region+".autotask.net/atservicesrest/v1.0/"+apiPath;
    let headers = {
        "ApiIntegrationcode": psaApi.api_integration_code,  // API tracking identifier
        "UserName": psaApi.username,  // API-only username
        "Secret": psaApi.secret,  // API-only password
        "Content-Type": "application/json"
    }
    console.log("Sending %s request...", method);
    let result = await request(url, method, data, headers);
    console.log(`Request sent to ${options.url} with status code ${res.status}`);
    return result;
}

module.exports = async function (region, apiPath, method, data) => {
    return await psaRequest(region, apiPath, method, data);
}
