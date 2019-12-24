var Converter = require('openapi-to-postmanv2');

var fs = require('fs'),
  Converter = require('openapi-to-postmanv2'),
  openapiData = fs.readFileSync('./src/twilio_api.json', {
    encoding: 'UTF8'
  });

const TwilioBaseUrl = 'https://api.twilio.com/2010-04-01';

const FolderNames = {
  '2010-04-01/Accounts/{Account Sid}/Messages.json': 'Programmable Messaging'
};

const ResourcesNames = {
  '/2010-04-01/Accounts/:AccountSid/Messages.json': 'message'
};

const MethodNames = {
  GET: 'Fetch',
  POST: 'Create'
};

const PostRequestHeader = [
  {
    key: 'Content-Type',
    value: 'application/x-www-form-urlencoded'
  }
];

function createApiName(url, method) {
  return `${MethodNames[method]} ${ResourcesNames[url]} resource`;
}

function fixUrlPath(path) {
  return path.slice(path.indexOf('2010-04-01') + 1);
}

function postProcess(exportResult) {
  let tmpResult = exportResult;
  tmpResult.item.forEach(folder => {
    // Set Folder Name
    folder.name = FolderNames[folder.name];
    folder.item.forEach(item => {
      // Set API name
      item.name = createApiName(item.name, item.request.method);
      // Set URL
      item.request.url.path = fixUrlPath(item.request.url.path);
      item.request.url.host = TwilioBaseUrl;
      // Set Body for POST
      if (item.request.method === 'POST') {
        item.request.header = { ...PostRequestHeader };
        item.request.body = {
          mode: 'urlencoded',
          urlencoded: [...item.request.url.query]
        };
        delete item.request.url.query;
      }
    });
  });
  return tmpResult;
}

Converter.convert(
  { type: 'string', data: openapiData },
  {},
  (err, conversionResult) => {
    if (!conversionResult.result) {
      console.log('Could not convert', conversionResult.reason);
    } else {
      let exportedJson = postProcess(conversionResult.output[0].data);
      //   console.log('The collection object is: ', conversionResult.output[0].data);
      fs.writeFileSync('./exported.json', JSON.stringify(exportedJson));
    }
  }
);
