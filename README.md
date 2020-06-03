# Twilio APIs Postman Collection

Currently this is still in Beta. Only `GET` and `POST` methods are impemented. Use it with caution. 

* [Installation](#Installation) 
* [Usage](#Usage)

# Installation 

* Download [Twilio.postman_collection.json](https://github.com/vernig/twilio-postman-collection/raw/master/Twilio.postman_collection.json) from this repo
* In postman click on [Import] and choose the json file (this can take a while since there are 800+ requests)

The Twilio Collection is set to use the following two variables for authentication:
* `{{twilio_account_sid}}`: Account SID
* `{{twilio_auth_token}}`: Auth Token

You can add all your accounts using the Postman Environment: 

* Click on the gear on the top right of the postman window: 

![image](https://user-images.githubusercontent.com/54728384/71095280-383b8780-21a4-11ea-9168-4e77481e2235.png)

* Click the [Add] button and add the two variables mentioned above: 


![image](https://user-images.githubusercontent.com/54728384/71095378-65883580-21a4-11ea-95f3-4d9d8e145833.png)

* Save

Now everytime you need to use this credential, use the dropdown list in the top right of Postman Window: 

![image](https://user-images.githubusercontent.com/54728384/71095523-aaac6780-21a4-11ea-84eb-ebb19cec6294.png)

# Usage

Let's say you want to send a new SMS. This is how you can do it: 

* Opent the `Twilio REST API` collection
* Open the `api` subfolder
* Open the (first) `Messages` subfolder 
* Click on the `POST Send a message from the account used to make the request` request. The request will open on the main Postman window
* Click on the `Body` tab and then fill up the values for `Body`, `From` and `To`. Also make sure that the checkboxes next to these three keys are enabled
* Click on `Send`

# Contributing

This repo is using the script `convert.js` to convert the API definitions defined in [this repo](https://github.com/twilio/twilio-cli-core/tree/master/src/services/twilio-api). Since these files are in Open API format, they could be directly imported in Postman; the problem is that postman create folders based on URL folder, which is not an effective way with Twilio APIs. 

The script is: 
* Processing each file in `src` folder. It uses the file name to create the name of the folder in Postman 
* Each `path` in the source file is used to create a subfolder of request 
* Each request is named using: `<method> + <resource>`. So for example a `GET` to an `account` is named as `Fetch account`

To generate a new output file use: 
```
node convert.js
```
