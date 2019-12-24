var Converter = require('openapi-to-postmanv2')

var fs = require('fs'),
Converter = require('openapi-to-postmanv2'),
openapiData = fs.readFileSync('./src/twilio-api-messages.json', {encoding: 'UTF8'});

const FolderNames = {
    "2010-04-01/Accounts/{Account Sid}/Messages.json": 'Programmable Messaging'
}

const ResourcesNames = {
    "/2010-04-01/Accounts/:AccountSid/Messages.json": "message"
}

const MethodNames = {
    "GET": "Fetch",
    "POST": "Create"
}

function createApiName(url, method) {
    return `${MethodNames[method]} ${ResourcesNames[url]} resource`
}

function postProcess(exportResult) {
    let tmpResult = exportResult
    tmpResult.item.forEach(item => {
        console.log(`Processing ${item.name}`)
        item.name = FolderNames[item.name]
        item.item.forEach(request => {
            console.log(request.request.name, request.request.method )
            request.name = createApiName(request.name, request.request.method)
        })
      })
    return tmpResult
}

Converter.convert({ type: 'string', data: openapiData },
  {}, (err, conversionResult) => {
    if (!conversionResult.result) {
      console.log('Could not convert', conversionResult.reason);
    }
    else {
        let exportedJson = postProcess(conversionResult.output[0].data)
    //   console.log('The collection object is: ', conversionResult.output[0].data);
        fs.writeFileSync('./exported.json', JSON.stringify(exportedJson))
    }
  }
);