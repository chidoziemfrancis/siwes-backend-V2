# **Welcome to the SIWES API Docs**

I will be guiding you through the entire backend API for the proposed SIWES system.
There 4 sections to this API:

 1. Authentication
 2. Coordinator's API
 3. Supervisor's API
 4. Student's API

## Getting started with Authentication
The API uses token based authentication so it doesn't require the frontend application to manually send back any token to it at any point, as tokens will automatically always be attached the cookies sent along with each request.
Under the authetication there are 3 functions

 1. Registration
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
			"message": "Registration successful",
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
	 > POST - [https://www.domain.com/api/auth/login](https://www.domain.com/api/auth/login)
	 
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
	 > POST - [https://www.domain.com/api/auth/logout](https://www.domain.com/api/auth/logout)
	 
	 This route doesn't require any arguments to be sent along with it, It simply clears the cookies from the user's device.
	 
	**Possible responses**

	 - Successful request
		 - Response type - Success
		 - Status code -  200
		 - Response body
		 ```json
		  { "message": "Success" }
		 ```

## Working with the Student API

There are 4 endpoints under the students sections of the API.

1. Get dashboard details
	> GET - [http://localhost:3000/api/student/getDetails](http://localhost:3000/api/student/getDetails)

	This route doesn't require any payload passed to it, it will automatically use the tokens in the client's cookies to find and retrieve the student's information.

	**Possible responses**
	- Sucessful request
		- Reponse type - success
		- Status code - 200
		- Response body
		```json
		{
			"data": {
				"_id": "632b80178ef672fa87a03293",
				"course": "software engineering",
				"department": "software engineering",
				"email": "barry@student.babcock.edu.ng",
				"matricNo": "19/8731",
				"sex": "Male",
				"level": "400",
				"faculty": "computer science",
				"phone": "091314242112",
				"studentCode": "software-engineering-2022-8731",
				"__v": 0,
				"name": "barry james allen",
				"company": {
					"_id": "632c3d3e47d7c2e3ba462f4b",
					"name": "google llc",
					"address": "no 5 test address",
					"state": "akwa ibom",
					"LGA": "ikot epkene",
					"email": "recruiter@google.com",
					"phone": "01031391123",
					"studentCode": "software-engineering-2022-8731",
					"assignedDepartment": "cyber security",
					"jobDescription": "In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available.",
					"resumptionDate": "2022-09-22T10:29:23.012Z",
					"expectedEndDate": "2022-09-22T16:02:43.012Z",
					"createdAt": "2022-09-22T10:47:26.651Z",
					"updatedAt": "2022-09-22T10:47:26.651Z",
					"__v": 0
				}
			}
		}
		```
		
	- Failed request
		A request to get student detail may fail for one of two reasons
		- The token is invalid this returns an error like so
			```json
			{ "message":  "Invalid student id" }
			``` 

2. Add work details 
	This route allows students to upload work details at the start of the SIWES program, it expects a payload similar to this one
	```json
	{
		"name": "Google LLC",
		"address": "No 5 test address",
		"state": "Akwa Ibom",
		"LGA": "Ikot Epkene",
		"email": "recruiter@google.com",
		"phone": "01031391123",
		"assignedDepartment": "Cyber Security",
		"jobDescription": "In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available.",
		"resumptionDate": 1663842563012,
		"expectedEndDate": 1663862563012
	}
	```
	`Note:` The `resumptionDate` and `expectedEndDate` values will be converted using JavaScript to standard date representation.
	
	**Possible responses**
	- Sucessful request
		- Reponse type - success
		- Status code - 200
		- Response body
		```json
		{ "message":  "Work details was uploaded successfully" }
		```
	- Failed request
		This request may fail for multiple reasons with status code of `400`, below are some of them
		- If the request payload is incomplete missing some fields 
		```json
		{ "message":  "Please make sure you have filled all the required fields" }
		```
		- Attempting to upload work details multiple times
		```json
		{ "message": "You can not upload multiple work details, contact support if you have an issue" }
		```
3. Upload weekly reports
	This route allows students to upload weekly reports it has some constraints e.g reports cannot be uploaded after the due date, reports cannot be uploaded without uploading company details first etc.
	The route expects a payload like follow:
	```json
	{
		"monday": "In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available.",
		"tuesday": "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here',",
		"wednesday": "making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).",
		"thursday": "In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. Lorem ipsum may be used as a placeholder before final copy is available.",
		"friday": "making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)."
	}
	```
	**Possible responses**
	- Sucessful request
		- Reponse type - success
		- Status code - 200
		- Response body
		```json
		{ "message":  "Upload successful" }
		```
	- Failed request
	All route failures return a `400` status code
		- Incomplete payload
		```json
		{ "message":  "Please specify all the neccesary fields" }
		```
		- No company upload matches the student
		```json
		{ "message": "Unable to find a matching company attachement please add a company first" }
		```
		- Upload date has passed
		```json
		{ "message": "We appreciate your hardwork across the week, but submissions are now closed for this week" }
		```
		
4. Change password
This route allows students to change their passwords (most likely not going to happen) access to it can easily be redirected to the coordinators.
It accepts a payload like so:
	```json
	{
		"oldPassword": "newPasswordText",
		"newPassword": "passwordText"
	}
	```
	**Possible responses**
	- Sucessful request
		- Reponse type - success
		- Status code - 200
		- Response body
		```json
		{ "message":  "Password was changed successfully" }
		```
	- Failed request
		There are a lot of reasons why this request can failed they are listed below
		- Missing fields
		```json
		{ "message":  "Incomplete request, please specify all required parameters" }
		```
		- If the `oldPassword` is wrong
		```json
		{ "message":  "Incorrect password" }
		```
		- A weird case where the student gets deleted before his changes was processed or the token used for authetication was falsified.
		```json
		{ "message": "Something unusual happened to your authentication status while trying to chaneg your password, so we couldn't process your request" }
		```

## Working with the Coordinator API

There are 25 endpoints under the coordinator sections of the API.

1. Add a New Coordinator

> POST - [http://localhost:3000/api/coordinator/add](http://localhost:3000/api/coordinator/add)

#### Description

This endpoint allows the addition of a new coordinator to the system.

#### Request

- Method: `POST`
- URL: `/api/coordinator/add`
- Body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone1": "1234567890",
  "phone2": "1234567890",
  "email": "jondoe@gmail.com",
  "office": "Phase 1",
  "password": "passwordtest"
  // Other required fields
}
```

#### Responses

- **Success Response:**

  - Status Code: `201 Created`
  - Response Body:

  ```json
  {
    "message": "Coordinator added successfully",
    "coordinator": "632b80178ef672fa87a03293"
  }
  ```

- **Error Response:**

  - Status Code: `400 Bad Request`
  - Response Body:

  ```json
  {
    "message": "Invalid request payload"
  }
  ```

2. Get All Coordinators

> GET - [http://localhost:3000/api/coordinator/all/api/coordinator/getAll](http://localhost:3000/api/coordinator/getAll)


#### Description

This endpoint retrieves a list of all coordinators in the system.

#### Request

- Method: `GET`
- URL: `/api/coordinator/all`

#### Responses

- **Success Response:**

  - Status Code: `200 OK`
  - Response Body:

  ```json
  [
    {
    	"_id": "632b80178ef672fa87a03293",
      	"firstName": "John",
  	 	"lastName": "Doe",
  		"phone1": "1234567890",
  		"phone2": "1234567890",
  		"email": "jondoe@gmail.com",
  		"office": "Phase 1",
    },
    {
    	"_id": "632b80178ef672fa87a03293",
      	"firstName": "John",
  	 	"lastName": "Doe",
  		"phone1": "1234567890",
  		"phone2": "1234567890",
  		"email": "jondoe@gmail.com",
  		"office": "Phase 1",
    },
	{
    	"_id": "632b80178ef672fa87a03293",
      	"firstName": "John",
  	 	"lastName": "Doe",
  		"phone1": "1234567890",
  		"phone2": "1234567890",
  		"email": "jondoe@gmail.com",
  		"office": "Phase 1",
    },
	{
    	"_id": "632b80178ef672fa87a03293",
      	"firstName": "John",
  	 	"lastName": "Doe",
  		"phone1": "1234567890",
  		"phone2": "1234567890",
  		"email": "jondoe@gmail.com",
  		"office": "Phase 1",
    },
  ]
  ```

- **Error Response:**

  - Status Code: `404 Not Found`
  - Response Body:

  ```json
  {
    "message": "No coordinators found"
  }
  ```

3. Get a Specific Coordinator

> GET - [http://localhost:3000/api/coordinator/all/api/coordinator/get/:id](http://localhost:3000/api/coordinator/get/:id)

- **Description:**
  - Retrieves information about a specific coordinator.

- **Request Parameters:**
  - `id`: Coordinator's ID

- **Possible Responses:**
  - Successful Request:
    - Response Type: success
    - Status Code: 200
    - Response Body:
      ```json
      {
        "_id": "632b80178ef672fa87a03293",
        "firstName": "John",
        "lastName": "Doe",
        "phone1": "123456789",
        "phone2": "987654321",
		"email": "jondoe@gmail.com",
        "office": "A123"
      }
      ```
  - Failed Request:
    - Status Code: 400
    - Response Body:
      ```json
      { "message": "Invalid id" }
      ```

4. Delete a Coordinator

> DELETE - [http://localhost:3000/api/coordinator/all/api/coordinator//delete/:id](http://localhost:3000/api/coordinator//delete/:id)

- **Description:**
  - Deletes a specific coordinator.

- **Request Parameters:**
  - `id`: Coordinator's ID

- **Possible Responses:**
  - Successful Request:
    - Status Code: 200
    - Response Body:
      ```json
      { "message": "Coordinator deleted successfully" }
      ```
  - Failed Request:
    - Status Code: 400
    - Response Body:
      ```json
      { "message": "No coordinator with that id exists" }
      ```

5. Update Coordinator Details  
This route does not allow the coordinator update the password field directly, the alllowed fields are  firstName, lastName, phone1, phone2, office
> PATCH - [http://localhost:3000/api/coordinator/all/api/coordinator/update/:id](http://localhost:3000/api/coordinator/update/:id)

- **Description:**
  - Updates details of a specific coordinator.

- **Request Parameters:**
  - `id`: Coordinator's ID
  - `Request Body` : Update details

- **Possible Responses:**
  - Successful Request:
    - Status Code: 200
    - Response Body:
      ```json
      { "message": "Coordinator updated successfully" }
      ```
  - Failed Request:
    - Status Code: 404
    - Response Body:
      ```json
      { "message": "Coordinator not found" }
      ```

  - Invalid Fields:
    - Status Code: 400
    - Response Body:
      ```json
      { "message": "Your update failed as it contains certain invalid fields" }
      ```

6. Change Coordinator Password

> PATCH - [http://localhost:3000/api/coordinator/all/api/coordinator/changePassword](http://localhost:3000/api/coordinator/changePassword)

- **Description:**
  - Changes the password of a coordinator.

- **Request Body:**
  - `oldPassword`: Current password
  - `newPassword`: New password

- **Possible Responses:**
  - Successful Request:
    - Status Code: 200
    - Response Body:
      ```json
      { "message": "Password was changed successfully" }
      ```
  - Failed Request:
    - Status Code: 400
    - Response Body:
      ```json
      { "message": "Incorrect password" }
      ```
  - Failed Request:
    - Status Code: 401
    - Response Body:
      ```json
      { "message": "Something unusual happened to your authentication status while trying to change your password, so we couldn't process your request" }
      ```
  - Failed Request:
    - Status Code: 400
    - Response Body:
      ```json
      { "message": "Incomplete request, please specify all required parameters" }
      ```
  - Failed Request:
    - Status Code: 500
    - Response Body:
      ```json
      { "message": "Something went wrong, please try again" }
      ```

7. Upload Inspection Forms


> POST - [http://localhost:3000/api/coordinator/uploadInspectionForms](http://localhost:3000/api/coordinator/uploadInspectionForms)

**Description:**

This endpoint allows the upload of an inspection form after passing through the upload middleware.

**Request Payload:**

- Form information
```json
{
  "name": "Form name",
  "description": "Form description",
  "purpose": "Form purpose",
  "pathToFile": "Form path",
}
```

**Possible Responses:**

- Successful Request
  - Response type: success
  - Status code: 200
  - Response body
    ```json
    { "message": "Form was added successfully" }
    ```

- Failed Request
  - Incomplete payload
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Please fill all the fields" }
    ```

