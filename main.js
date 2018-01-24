const Apify = require('apify');
const _ = require('underscore');
const request = require('request-promise');

function transform(record, schema, result){
    for(const key in schema){
        const column = schema[key];
        const value = record ? record[key] : '';
        if(typeof column === 'object'){
            if(column.$source){
                
            }
            else{transform(value, column, result);}
        }
        else if(value){result[column] = value;}
        else{result[column] = '';}
    }
}

const lookupTables = {};

async function getTable(connInfo, scene, view){
    const key = info.$schema + '_' + info.$view;
    if(lookupTables[key]){return lookupTables[key];}
    const table = (await loadFromKnack({
        "view": view,
        "scene": scene,
        "appId": connInfo.appId,
        "apiKey": connInfo.apiKey
    })).records;
    lookupTables[key] = table;
    return table;
}

async function lookupConnection(connInfo, connData){
    const table = getTable(connInfo, connData.$scene, connData.$view);
    for(const record of table){
        if(record[connData.$target] == isbn){
            return record.id;
        }
    }
    return null;
}

async function processResults(connInfo, results, schema){
    _.chain(results.items).pluck('pageFunctionResult').flatten().each((result) => {
        try{
            if(schema){
                const nRow = {};
                transform(result, schema, nRow);
                await sendToKnack(connInfo, nRow);
            }
            else{await sendToKnack(connInfo, result);}
        }
        catch(e){console.log(e);}
    });
}

async function loadFromKnack(connInfo){
    const options = {
        method: 'GET',
        uri: 'https://api.knack.com/v1/pages/' + connInfo.scene + '/views/' + connInfo.view + '/records',
        json: true,
        headers: {
            'X-Knack-Application-Id': connInfo.appId,
            'X-Knack-REST-API-KEY': connInfo.apiKey,
            'content-type': 'application/json'
        }
    };
    return await request(options);
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
    const state = (await Apify.getValue('STATE')) || {offset: 0};
    const data = input.data ? (isString(input.data) ? JSON.parse(input.data) : input.data) : null;
    if(!input._id){return console.log('missing "_id" attribute in INPUT');}
    if(!data){return console.log('missing "data" attribute in INPUT');}
    if(!data.view){return console.log('missing "view" attribute in INPUT.data');}
    if(!data.scene){return console.log('missing "scene" attribute in INPUT.data');}
    if(!data.appId){return console.log('missing "appId" attribute in INPUT.data');}
    if(!data.apiKey){return console.log('missing "apiKey" attribute in INPUT.data');}

    let total = -1;
    const limit = 50;
    while(total === -1 || state.offset < total){
        const lastResults = await Apify.client.crawlers.getExecutionResults({
            executionId: input._id, 
            offset: state.offset, 
            limit: limit
        });
        await processResults(lastResults, input, data ? data.schema : null);
        total = lastResults.total;
        state.offset += limit;
        Apify.setValue('STATE', state);
    }
    
    console.log('Knack upload finished');
});
