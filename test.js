const fs = require('fs');
const assert = require('assert').strict;

function getRequest(folderName, requestName) {
  return exportedJson.items
    .find(folder => folder.name === folderName)
    .item.find(request => request.name === requestName);
}

const exportedJson = JSON.parse(fs.readFileSync('./exported.json'));

// Check decsription for path variable
let applicationFetchRequest = getRequest(
  'Application',
  'Fetch Application'
);
assert.deepEqual(
    applicationFetchRequest.request.url.variable[1].description,
  'The Twilio-provided string that uniquely identifies the Application resource to fetch.'
);

// If we get here all the asserts have passed
console.log("All test passed!")