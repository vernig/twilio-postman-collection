const fs = require('fs');

function getAPINameFromPath(path) {
  path = path.replace('.json', '');
  let pathElements = path.split('/');
  pathElements.splice(0, 2); // Remove first element (empty string) and API version ('2010-04-01')
  pathElements = pathElements.filter(element => element.indexOf('{') === -1); // Remove parameters
  return pathElements.join(' ').replace(/[A-Z]/g, element => ' ' + element);
}

function createGetRequestInfo(apiRequest, path) {
  let tmpRequestInfo = {};
  let pathVariables = [];
  let variableNameRegex = /{(.*)}/;
  tmpRequestInfo.name = 'Fetch ' + getAPINameFromPath(path).toLowerCase();
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
        value: '',
        description: ''
      });
    }
  });

  tmpRequestInfo.url.protocol = 'https';
  tmpRequestInfo.url.host = ['api', 'twilio', 'com'];
  tmpRequestInfo.url.query = [];
  apiRequest.parameters.forEach(parameter => {
    if (pathVariables.indexOf(parameter.name) == -1) {
      // Parameter is *not* a path variable
      tmpRequestInfo.url.query.push({
        description:
          (parameter.required ? '(Required) ' : '') + parameter.description,
        value: '<' + parameter.schema.type + '>',
        key: parameter.name,
        disabled: !parameter.required
      });
    } else {
      let pathVariableIndex = pathVariables.indexOf(parameter.name);
      tmpRequestInfo.url.variable[pathVariableIndex].description =
        parameter.description;
    }
  });
  // delete tmpRequestInfo.body;
  // delete tmpRequestInfo.header;
  return tmpRequestInfo;
}

function createRequests(apiRequests, path) {
  let tmpRequests = [];
  if (apiRequests.get) {
    let tmpPostmanRequest = {};
    tmpPostmanRequest.name = 'Fetch ' + getAPINameFromPath(path).toLowerCase();
    tmpPostmanRequest.request = createGetRequestInfo(apiRequests.get, path);
    tmpRequests.push(tmpPostmanRequest);
  }
  // TODO;
  // if (apiRequests.post) {
  //   let tmpPostmanRequest = { ...templPostmanRequest };
  //   tmpRequest.push(tmpPostmanRequest);
  // }
  return tmpRequests;
}

const postmanOutput = {
  info: {
    name: 'Twilio REST API',
    version: {},
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    description:
      'This is the public Twilio REST API.\n\nContact Support:\n Name: Twilio Support\n Email: support@twilio.com'
  },
  auth: {
    type: 'basic',
    basic: [
      {
        key: 'password',
        value: '{{twilio_auth_token}}',
        type: 'string'
      },
      {
        key: 'username',
        value: '{{twilio_account_sid}}',
        type: 'string'
      }
    ]
  },
  items: []
};

const apiFiles = fs.readdirSync('./src/');
apiFiles.forEach(apiFile => {
  let apiSource = JSON.parse(fs.readFileSync('./src/' + apiFile));
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
    let tmpFolder = {};
    tmpFolder.name = getAPINameFromPath(path);
    tmpFolder.item = createRequests(apiPaths[path], path);
    productFolder.items.push(tmpFolder);
  }

  postmanOutput.items.push(productFolder);
});

console.log('\nStoring result to Twilio.postman_collection.json');
fs.writeFileSync(
  './Twilio.postman_collection.json',
  JSON.stringify(postmanOutput)
);
