const fs = require('fs');

function createGetRequestInfo(apiRequest, path) {
  let tmpRequestInfo = {};
  let pathVariables = [];
  let variableNameRegex = /{(.*)}/;
  tmpRequestInfo.name = 'Fetch ' + pathsToFolders[path].resource;
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
    tmpPostmanRequest.name = 'Fetch ' + pathsToFolders[path].resource;
    tmpPostmanRequest.request = createGetRequestInfo(apiRequests.get, path);
    tmpRequests.push(tmpPostmanRequest);
  }
  // TODO
  // if (apiRequests.post) {
  //   let tmpPostmanRequest = {...templPostmanRequest}
  //   tmpRequest.push(tmpPostmanRequest)
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
  items: []
};

const apiFiles = fs.readdirSync('./src');
apiFiles.forEach(apiFile => {
  let apiSource = JSON.parse(fs.readFileSync('./src/' + apiFile));
  let apiPaths = apiSource.paths;
  let productName = apiFile
    .replace('twilio_', '')
    .replace('.json', '')
    .replace('twilio-', '');
  // const pathsToFolders = JSON.parse(fs.readFileSync('./paths.json'));

  
  for (path in apiPaths) {
    console.log(`Processing ${path}`);
    let tmpFolder = {};
    tmpFolder.name = pathsToFolders[path].name;
    if (tmpFolder.name) {
      tmpFolder.item = createRequests(apiPaths[path], path);
      postmanOutput.items.push(tmpFolder);
    }
  }
});

console.log('\nStoring result to Twilio.postman_collection.json');
fs.writeFileSync(
  './Twilio.postman_collection.json',
  JSON.stringify(postmanOutput)
);
