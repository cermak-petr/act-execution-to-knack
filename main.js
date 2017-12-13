const Apify = require('apify');
const request = require('request-promise');

async function processResults(connInfo, lastResults){
    _.chain(lastResults.items).pluck('pageFunctionResult').flatten().each((result) => {
        try{sendToKnack(connInfo, result);}
        catch(e){console.log(e);}
    });
}

async function sendToKnack(connInfo, data){
    const options = {
        method: 'POST',
        uri: 'https://api.knack.com/v1/pages/' + connInfo.scene + '/views/' + connInfo.view + '/records',
        body: data,
        json: true,
        headers: {
            'X-Knack-Application-Id': connInfo.appId,
            'X-Knack-REST-API-KEY': connInfo.apiKey,
            'content-type': 'application/json'
        }
    };
    return await request(options);
}

Apify.main(async () => {
    
    const input = await Apify.getValue('INPUT');
    const data = input.data ? (isString(input.data) ? JSON.parse(input.data) : input.data) : null;
    if(!input._id){return console.log('missing "_id" attribute in INPUT');}
    if(!data){return console.log('missing "data" attribute in INPUT');}
    if(!data.view){return console.log('missing "view" attribute in INPUT.data');}
    if(!data.scene){return console.log('missing "scene" attribute in INPUT.data');}
    if(!data.appId){return console.log('missing "appId" attribute in INPUT.data');}
    if(!data.apiKey){return console.log('missing "apiKey" attribute in INPUT.data');}

    const limit = 200;
    let total = -1, offset = 0;
    while(total === -1 || offset + limit < total){
        const lastResults = await Apify.client.crawlers.getExecutionResults({
            executionId: input._id, 
            offset: offset, 
            limit: limit
        });
        await processResults(lastResults, input);
        total = lastResults.total;
        offset += limit;
    }
    
    console.log('Knack upload finished');
});
