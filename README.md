# **Welcome to the SIWES API Docs**

I will be guiding you through the entire backend API for the proposed SIWES system.
There 4 sections to this API:

 1. Authentication
 2. Coordinator's API
 3. Supervisor's API
 4. Student's API

## Getting started with Authentication
The API uses token based authentication but doesn't the require the frontend application to manually send back any token to it at any point, as tokens will automatically always be attached the cookies sent along with each request.
Under the authetication there are 3 functions

 - Registration
	> POST - [https://www.domain.com/api/auth/register](https://www.domain.com/api/auth/register)

	This route should only be accessible to students, it requires an object like below passed to it via the body of the request
	```json
	{
		"firstName": "Samuel",
		"middleName": "",
		"lastName": "Derick",
		"course": "Accounting",
		"department": "Accounting",
		"email": "derick@student.babcock.edu.ng",
		"matricNo": "22/1101",
		"sex": "Male",
		"level": "500",
		"faculty": "Accounting faculty",
		"phone": "091314242112",
		"password": "passwordText"
	}
	```
	**Possible responses**
	 - Successful request
		 - Reponse type - success
		- Status code - 200
		- Response body
		```json
		{ 
			"message": "Login successful",
			"data": "631b4162deab9b9ec49dd014"
		}
		```
		where data represent's the user id as gotten from the database.
	- Failed request
		A registration request may fail for one of several reasons all of them will return a status code of `400`
		- If any of these fields are missing but not all the API will return a response like below
			```json
			{
				"message": "Bad Request",
				"errors": [
					"Level is required",
					"Matric number is required"
				]
			}
			```
		- If registration is closed the response will be like below
			```json
			{ "message": "Registration couldn't be completed as it is closed" }
			```
		- If registration deadline has not been set
			```json
			{ "message": "We couldn't find a registration deadline, this may be because it is not yet open Please contact your SIWES coordinator" }
			```
		- If the request body is empty
			```json
			{ "message":  "Please fill all the required fields" }
			```
		- If there is a duplicate email or matric number
			```json
			{ "message": "email already exists" }
			```

 2. Login
	 > POST - [https://www.domain.com/api/auth/login](https://www.domain.com/api/auth/register)
	 
	 This route requires an object like below passed to it via the body of the request.
	 ```json
	{
		"email": "kc@gmail.com",
		"password": "passwordText",
		"type": "supervisor"
	}
	```
	 email represents the user's email
	 password represents the user's password 
	 type represents a user type the valid types are 
	 ```javascript
	 ["student", "coordinator", "supervisor"]
	```

	**Possible responses**
	- Successful request
		- Reponse type - success
		- Status code - 200
		- Response body
		```json
		{ 
			"message": "Login successful",
			"data": "63390f91cf107934ffc24320"
		}
		```
		where the data field represents the user id as gotten from the database.
		
	- Failed request
		A login may fail for various reasons, and all of them will return an error code of `401` some of them are:
		
		- Failing to provide a valid user type, email or password will result in an error like below

			```json
			{ "message": "Invalid request" }
			```
		- Providing an email that is valid but isn't a registered user or providing an invalid password will result in an error like below
			```json
			{ "message": "Invalid request" }
			```

 3. Logout
	 > POST - [https://www.domain.com/api/auth/logout](https://www.domain.com/api/auth/register)
	 
	 This route doesn't require any arguments to be sent along with it, It simply clears the cookies from the user's device.
	 
	**Possible responses**

	 1. Successful request
		 - Response type - Success
		 - Status code -  200
		 - Response body
		 ```json
		  { "message": "Success" }
		 ```

## Working with the Coordinator API

## Working with the Supervisor API

## Working with the Student API
