# 🚧🚧Twilio APIs Postman Collection

Unofficial / Incomplete collection of Twilio APIs for Postman. 

## Installation 

* Download [Twilio.postman_collection.json](https://github.com/vernig/twilio-postman-collection/raw/master/Twilio.postman_collection.json) from this repo
* In postman click on [Import] and choose the json file

## Usage

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
