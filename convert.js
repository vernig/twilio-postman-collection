const fs = require('fs');

function getAPINameFromPath(path) {
  path = path.replace('.json', '');
  let pathElements = path.split('/');
  pathElements.splice(0, 2); // Remove first element (empty string) and API version ('2010-04-01')
  pathElements = pathElements.filter((element) => element.indexOf('{') === -1); // Remove parameters
  if (pathElements[0] === 'Accounts' && pathElements.length > 1) {
    // Most of the main API are under `/Accounts` path. To make the API more readable
    // in Postman, we are removing the "Accounts" from the API name / description
    pathElements.splice(0, 1);
  }
  return pathElements.join(' ').replace(/[A-Z]+/g, (element) => ' ' + element);
}

function convertServerToHost(servers) {
  let server = servers[0].url;
  return server.split('//')[1].split('.');
}

function createPostRequestInfo(apiRequest, host, path) {
  let tmpRequestInfo = {};
  let pathVariables = [];
  let variableNameRegex = /{(.*)}/;
  tmpRequestInfo.url = {};

  tmpRequestInfo.method = 'POST';

  // Process Path
  tmpRequestInfo.url.path = path.split('/');
  tmpRequestInfo.url.path.forEach((item, index) => {
    if (variableNameRegex.test(item)) {
      let variableName = variableNameRegex.exec(item)[1];
      pathVariables.push(variableName);
      // Workaround for Postman path variable limitation
      variableName = item.slice(1).replace('}', '');
      tmpRequestInfo.url.path[index] = ':' + variableName;
      if (!tmpRequestInfo.url.variable) {
        tmpRequestInfo.url.variable = [];
      }
      tmpRequestInfo.url.variable.push({
        key: variableName,
        value: (variableName == "AccountSid" ? '{{twilio_account_sid}}': ''),
        description: '',
      });
    }
  });

  tmpRequestInfo.url.protocol = 'https';
  tmpRequestInfo.url.host = host;
  tmpRequestInfo.url.query = [];

  tmpRequestInfo.body = { mode: 'urlencoded', urlencoded: [] };
  let bodyProperties = apiRequest.requestBody.content[ "application/x-www-form-urlencoded"].schema.properties
  let bodyPropertiesRequired = apiRequest.requestBody.content[ "application/x-www-form-urlencoded"].schema.required
  if (bodyProperties) {
    for (property in bodyProperties) {
      tmpRequestInfo.body.urlencoded.push({
        key: property, 
        value: property, 
        description: bodyProperties[property].description, 
        disabled: !(bodyPropertiesRequired && bodyPropertiesRequired.indexOf(property) >= 0)
      })
    }
  } 
  // delete tmpRequestInfo.header;
  return tmpRequestInfo;
}

function createGetRequestInfo(apiRequest, host, path) {
  let tmpRequestInfo = {};
  let pathVariables = [];
  let variableNameRegex = /{(.*)}/;
  tmpRequestInfo.url = {};

  // Process Path
  tmpRequestInfo.url.path = path.split('/');
  tmpRequestInfo.url.path.forEach((item, index) => {
    if (variableNameRegex.test(item)) {
      let variableName = variableNameRegex.exec(item)[1];
      pathVariables.push(variableName);
      // Workaround for Postman path variable limitation
      variableName = item.slice(1).replace('}', '');
      tmpRequestInfo.url.path[index] = ':' + variableName;
      if (!tmpRequestInfo.url.variable) {
        tmpRequestInfo.url.variable = [];
      }
      tmpRequestInfo.url.variable.push({
        key: variableName,
        value: (variableName == "AccountSid" ? '{{twilio_account_sid}}': ''),
        description: '',
      });
    }
  });

  tmpRequestInfo.url.protocol = 'https';
  tmpRequestInfo.url.host = host;
  tmpRequestInfo.url.query = [];
  if (apiRequest.parameters && Array.isArray(apiRequest.parameters)) {
    apiRequest.parameters.forEach((parameter) => {
      if (pathVariables.indexOf(parameter.name) == -1) {
        // Parameter is *not* a path variable
        tmpRequestInfo.url.query.push({
          description:
            (parameter.required ? '(Required) ' : '') + parameter.description,
          value: '<' + parameter.schema.type + '>',
          key: parameter.name,
          disabled: !parameter.required,
        });
      } else {
        let pathVariableIndex = pathVariables.indexOf(parameter.name);
        tmpRequestInfo.url.variable[pathVariableIndex].description =
          parameter.description;
      }
    });
  }

  // delete tmpRequestInfo.body;
  // delete tmpRequestInfo.header;
  return tmpRequestInfo;
}

function createRequests(apiRequests, path) {
  let host = convertServerToHost(apiRequests.servers);
  let tmpRequests = [];
  if (apiRequests.get) {
    let tmpPostmanRequest = {};
    tmpPostmanRequest.name =
      apiRequests.get.description ||
      'Fetch ' + getAPINameFromPath(path).toLowerCase();
    tmpPostmanRequest.request = createGetRequestInfo(
      apiRequests.get,
      host,
      path
    );
    tmpRequests.push(tmpPostmanRequest);
  } 
  if (apiRequests.post) {
    let tmpPostmanRequest = {};
    tmpPostmanRequest.name =
      apiRequests.post.description ||
      'Create ' + getAPINameFromPath(path).toLowerCase();
    tmpPostmanRequest.request = createPostRequestInfo(
      apiRequests.post,
      host,
      path
    );
    tmpRequests.push(tmpPostmanRequest);
  }
  return tmpRequests;
}

const postmanOutput = {
  info: {
    name: 'Twilio REST API',
    version: {},
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    description:
      'This is the public Twilio REST API.\n\nContact Support:\n Name: Twilio Support\n Email: support@twilio.com',
  },
  auth: {
    type: 'basic',
    basic: [
      {
        key: 'password',
        value: '{{twilio_auth_token}}',
        type: 'string',
      },
      {
        key: 'username',
        value: '{{twilio_account_sid}}',
        type: 'string',
      },
    ],
  },
  items: [],
};

const specPattern = /twilio_(.+)\.json/;

fs.readdirSync('./twilio-api/')
  .filter((filename) => filename.match(specPattern))
  .map((apiFile) => {
    let apiSource = JSON.parse(fs.readFileSync('./twilio-api/' + apiFile));
    let apiPaths = apiSource.paths;
    let productName = apiFile
      .replace('twilio_', '')
      .replace('.json', '')
      .replace('twilio-', '');
    let productFolder = {};

    console.log(`Processing file ${apiFile}`);
    productFolder.name = productName;
    productFolder.items = [];

    for (path in apiPaths) {
      console.log(`  Processing ${path}`);
      subFolderName = getAPINameFromPath(path);
      subFolderRequests = createRequests(apiPaths[path], path);
      if (
        productFolder.items.length &&
        productFolder.items[productFolder.items.length - 1].name ===
          subFolderName
      ) {
        // Usually API that requests a specific resource (by SID) are following API that requests
        // all available resources (see for example /Credentials/AWS and Credentials/AWS/:Sid)
        // In this case we group them together in the same folder
        productFolder.items[productFolder.items.length - 1].item.push(
          ...subFolderRequests
        );
      } else {
        let subFolder = {
          name: subFolderName,
          item: subFolderRequests,
        };
        previousFolderIndex = productFolder.items.push(subFolder);
      }
    }

    postmanOutput.items.push(productFolder);
  });

console.log('\nStoring result to Twilio.postman_collection.json');
fs.writeFileSync(
  './Twilio.postman_collection.json',
  JSON.stringify(postmanOutput)
);
