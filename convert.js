const fs = require('fs');

const templPostmanFolder = {
  id: '',
  name: '',
  item: [
    // Array of templPostmanRequest
  ]
};

const templPostmanRequest = {
  id: '',
  name: '',
  request: '',
  response: '', // templPostmanRequestInfo
  event: ''
};

const templPostmanRequestInfo = {
  name: '',
  description: {
    content: '',
    type: 'text/plain'
  },
  url: {
    path: [],
    host: 'https://api.twilio.com/2010-04-01',
    query: [], // Array of templPostmanRequestQuery
    variable: [] // Array of templPostmanRequestQuery
  },
  header: {
    // Not needed for GET
    '0': {
      key: 'Content-Type',
      value: 'application/x-www-form-urlencoded'
    }
  },
  body: {
    // Not neede for get
    mode: 'urlencoded',
    urlencoded: [] // Array of templPostmanRequestQuery
  },
  method: ''
};

const templPostmanRequestQuery = {
  description: '',
  type: 'any',
  value: '',
  key: ''
};

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

function extractData(data) {
  return {
    item: { ...data.item[0].item[1].item },
    info: { ...data.info }
  };
}

function postProcess(exportResult) {
  let tmpResult = extractData(exportResult);
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

function createGetRequestInfo(apiRequest, path) {
  let tmpRequestInfo = {};
  let pathVariables= []
  let variableNameRegex = /{(.*)}/
  tmpRequestInfo.name = 'Fetch ' + pathsToFolders[path].resource;
  tmpRequestInfo.url = {};

  // Process Path
  tmpRequestInfo.url.path = path.split('/');
  tmpRequestInfo.url.path.forEach((item, index) => {
    if (variableNameRegex.test(item)) {
      let variableName = variableNameRegex.exec(item)[1]
      pathVariables.push(variableName) 
      // Workaround for Postman path variable limitation 
      variableName = item.slice(1).replace('}', '') 
      tmpRequestInfo.url.path[index] = ':' + variableName
      if (!tmpRequestInfo.url.variable) {
        tmpRequestInfo.url.variable = [];
      }
      tmpRequestInfo.url.variable.push({ key: variableName, value: '', description: ''});
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
      tmpRequestInfo.url.variable.forEach((variable, index) => {
        if (variable.key === parameter.name) {
          tmpRequestInfo.url.variable[index].description =
            parameter.description;
        }
      });
    }
  });
  // delete tmpRequestInfo.body;
  // delete tmpRequestInfo.header;
  return tmpRequestInfo;
}

function createRequests(apiRequests, path) {
  let tmpRequests = [];
  if (apiRequests.get) {
    // let tmpPostmanRequest = { ...templPostmanRequest };
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

var postmanOutput = {};
const apiSource = JSON.parse(fs.readFileSync('./src/twilio_api.json'));
const apiPaths = apiSource.paths;
const pathsToFolders = JSON.parse(fs.readFileSync('./paths.json'));

postmanOutput.info = {
  name: 'Twilio REST API',
  version: {},
  schema:
    'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  description:
    'This is the public Twilio REST API.\n\nContact Support:\n Name: Twilio Support\n Email: support@twilio.com'
};
postmanOutput.items = [];
// tmp = {}
for (path in apiPaths) {
  console.log(`Processing ${path}`);
  // tmp[path] = {
  //   name: "",
  //   resource: "",
  //   description: apiPaths[path].description
  // }
  // let tmpFolder = { ...templPostmanFolder };
  let tmpFolder = {};
  tmpFolder.name = pathsToFolders[path].name;
  if (tmpFolder.name) {
    tmpFolder.item = createRequests(apiPaths[path], path);
    postmanOutput.items.push(tmpFolder);
  }
}
fs.writeFileSync('./exported.json', JSON.stringify(postmanOutput));
