const request = require('axiosRequest.js');
let bdApiPath = "config/bdApi.json";
const psaApi = JSON.parse(fs.readFileSync(psaApiPath, 'utf8'));
async function psaRequest (region, apiPath, method, data){
    let url = "https://webservices"+config.region+".autotask.net/atservicesrest/v1.0/"+apiPath;
    let headers = {
        "Authorization": bdApi.authentication_string,  // API tracking identifier
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
