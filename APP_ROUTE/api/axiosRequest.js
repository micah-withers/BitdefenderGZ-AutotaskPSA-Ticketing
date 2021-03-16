
// Require axios to request the id of the computer from autotask (or find the company in Bitdefender), then create a ticket
const axios = require('axios');

async function axiosRequest (url, method, data, headers){
    var options = {
        url: url,
        data: data,
        method: method,
        headers: headers
    };
    console.log("Sending %s request...", method);
    try {
        let result = await axios.request(options)
        console.log(`Request sent to ${options.url}`);
        console.log(`Status Code: ${res.status}`);
        return result;
    }
    catch (error) {
        console.log("An error occured with the request:", error);
    }
}

module.exports = async function (url, method, data, headers) => {
    return await axiosRequest(url, method, data, headers);
}
