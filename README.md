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

8. Create Supervisor

> POST - [http://localhost:3000/api/coordinator/createSupervisor](http://localhost:3000/api/coordinator/createSupervisor)

**Description:**

This endpoint allows a coordinator to create a supervisor.

**Request Payload:**

```json
      {
        "firstName": "John",
        "lastName": "Doe",
        "phone": "123456789",
		"email": "jondoe@gmail.com",
        "office": "A123",
		"password": "abel123"
      }
```

**Possible Responses:**

- Successful Request
  - Response type: success
  - Status code: 201
  - Response body
    ```json
    { 
		"message": "Supervisor added successfully", 
		"supervisor": "631b4162deab9b9ec49dd0525"
	}
    ```

- Failed Request
  - Error details

9. Get All Supervisors

**Endpoint:**

> GET - [http://localhost:3000/api/coordinator/supervisors](http://localhost:3000/api/coordinator/supervisors)

**Description:**

This endpoint returns a list of all supervisors.

**Possible Responses:**

- Successful Request
  - Status code: 200
  - Response body:
      ```json
	[
    	{ 
			"firstName": "John",
        	"lastName": "Doe",
        	"phone": "123456789",
			"email": "jondoe@gmail.com",
        	"office": "A123",
		},
		{ 
			"firstName": "John",
        	"lastName": "Doe",
        	"phone": "123456789",
			"email": "jondoe@gmail.com",
        	"office": "A123",
		},
		{ 
			"firstName": "John",
        	"lastName": "Doe",
        	"phone": "123456789",
			"email": "jondoe@gmail.com",
        	"office": "A123",
		},
		// more supervisors 
	]
    ```

- Failed Request
  - No supervisor
  - Response type: failed
  - Status code: 4004
    ```json
    { "message": "No supervisors found" }
    ```

10. Assign Defense Supervisor

**Endpoint:**

>POST - [http://localhost:3000/api/coordinator/assignDefenseSupervisor](http://localhost:3000/api/coordinator/assignDefenseSupervisor)

**Description:**

This endpoint assigns a student to a supervisor for defense. It can also be used to overwrite a previous assignment.

**Request Payload:**
```json
	{
		"studentCode": "1234",
		"supervisorID": "631b4162deab9b9ec34567"
	}
```

**Possible Responses:**

- Successful Request
  - Response type: success
  - Status code: 200
  - Response body
    ```json
    { "message": "Defense supervisor was successfully assigned" }
    ```

- Failed Request
  - Invalid supervisor id
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Invalid supervisor id"}
    ```

  - Wrong Student code
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Invalid student code"}
    ```

  - Wrong Supervisor Id
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "No supervisor was found with that id"}
    ```

10. Assign Inspection Supervisor

**Endpoint:**

> POST - [http://localhost:3000/api/coordinator/assignInspectionSupervisor](http://localhost:3000/api/coordinator/assignInspectionSupervisor)

**Description:**

This endpoint assigns a student to a supervisor for inspection. It can also be used to overwrite a previous assignment.

**Request Payload:**

```json
	{
		"studentCode": "1234",
		"supervisorID": "631b4162deab9b9ec34567"
	}
```

**Possible Responses:**

- Successful Request
  - Response type: success
  - Status code: 200
  - Response body
    ```json
    { "message": "Inspection supervisor was successfully assigned" }
    ```

- Failed Request
  - Invalid supervisor id
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Invalid supervisor id"}
    ```

  - Wrong Student code
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Invalid student code"}
    ```

  - Wrong Supervisor Id
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "No supervisor was found with that id"}
    ```

11. Assign Inspection Supervisor

**Endpoint:**

> POST - [http://localhost:3000/api/coordinator/assignInspectionSupervisor](http://localhost:3000/api/coordinator/assignInspectionSupervisor)

**Description:**

This endpoint assigns a student to a supervisor for inspection. It can also be used to overwrite a previous assignment.

**Request Payload:**

```json
{
	"studentCode": "1234",
	"supervisorID": "631b4162deab9b9ec34567"
}
```

**Possible Responses:**

- Successful Request
  - Response type: success
  - Status code: 200
  - Response body
    ```json
    { "message": "Inspection supervisor was successfully assigned" }
    ```

- Failed Request
  - Invalid supervisor id
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Invalid supervisor id"}
    ```

  - Wrong Student code
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Invalid student code"}
    ```

  - Wrong Supervisor Id
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "No supervisor was found with that id"}
    ```

12. Get All Students

**Endpoint:**

> GET - [http://localhost:3000/api/students](http://localhost:3000/api/students)

**Description:**

This endpoint retrieves a list of students with optional pagination parameters.

**Request Parameters:**

- `page` (optional): The page number to retrieve. Defaults to 1.
- `limit` (optional): The number of students to retrieve per page. Defaults to 10. Maximum allowed limit is 50.

**Possible Responses:**

- Successful Request
  - Response type: success
  - Status code: 200
  - Response body
    ```json
    {
      "students": [
        {
          "_id": "1234",
          "name": "John Doe",
          "age": 20,
          "grade": "A"
        },
        {
          "_id": "5678",
          "name": "Jane Smith",
          "age": 22,
          "grade": "B"
        }
      ],
      "totalStudents": 25,
      "currentPage": 1,
      "currentLimit": 10
    }
    ```

- Failed Request
  - Invalid page number
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Invalid page number"}
    ```

  - Invalid limit
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Invalid limit"}
    ```

  - Limit too large
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Limit too large, maximum allowed limit is 50"}
    ```

  - No students found
  - Response type: failed
  - Status code: 404
    ```json
    { "message": "No students found"}
    ```

- Internal Server Error
  - Response type: error
  - Status code: 500
    ```json
    { "message": "Internal Server Error"}
    ```
13. Get a Student

**Endpoint:**

> GET - [http://localhost:3000/api/student/:id](http://localhost:3000/api/student/:id)

**Description:**

This endpoint retrieves the details of a particular student based on the provided ID.

**Request Parameters:**

- `id` (string, required): The ID of the student to retrieve.

**Possible Responses:**

- Successful Request
  - Status code: 200
  - Response body:
    ```json
    {
      "_id": "12345",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "grades": {
        "grade": "A",
        "lastUpdatedBy": "Coordinator John"
      },
      "company": {
        "_id": "67890",
        "name": "Acme Corporation"
      },
      "supervisor": {
        "_id": "abcde",
        "name": "Supervisor Jane"
      }
    }
    ```

- Failed Request
  - Invalid ID
    - Status code: 400
    - Response body:
      ```json
      { "message": "Invalid id" }
      ```

  - Student Not Found
    - Status code: 404
    - Response body:
      ```json
      { "message": "Student not found" }
      ```

14. Get Defense List

**Endpoint:**

> GET - [http://localhost:3000/api/defense/list](http://localhost:3000/api/defense/list)

**Description:**

This endpoint returns a list containing all students and their assigned supervisors for defense.

**Possible Responses:**

- Successful Request
  - Status code: 200
  - Response body: List of students and their assigned supervisors for defense.

- Failed Request
  - Status code: 404
  - Response body: `{ "message": "Defense list is empty" }`

---

15. Get Inspection List

**Endpoint:**

> GET - [http://localhost:3000/api/inspection/list](http://localhost:3000/api/inspection/list)

**Description:**

This endpoint returns a list of all students and their assigned supervisors for inspection.

**Possible Responses:**

- Successful Request
  - Status code: 200
  - Response body: List of students and their assigned supervisors for inspection.

- Failed Request
  - Status code: 404
  - Response body: `{ "message": "Inspection list is empty" }`

---

16. Set Registration Deadline

**Endpoint:**

> POST - [http://localhost:3000/api/registration/deadline](http://localhost:3000/api/registration/deadline)

**Description:**

This endpoint accepts the deadline date and updates the deadline document.

**Request Payload:**

```json
{
    "time": "2023-02-28T08:00:00.000Z"
}
```

**Possible Responses:**

- Successful Request
  - Status code: 200
  - Response body: `{ "message": "Registration deadline has been assigned" }`

- Failed Request
  - Status code: 400
  - Response body: `{ "message": "You cannot set a deadline into the past" }`
  - Status code: 401
  - Response body: `{ "message": "Something went wrong while authenticating your request, re-authenticate and try again" }`

---

17. Get Weekly Reports

**Endpoint:**

> GET - [http://localhost:3000/api/weekly-reports/:studentCode](http://localhost:3000/api/weekly-reports/:studentCode)

**Description:**

This endpoint returns a list of all the weekly reports for the specified student.

**Possible Responses:**

- Successful Request
  - Status code: 200
  - Response body: List of weekly reports for the specified student.

- Failed Request
  - Status code: 404
  - Response body: `{ "message": "No weekly reports submission found for the specified student" }`

---

18. Assign Grade

**Endpoint:**

> POST - [http://localhost:3000/api/grades/assignGrade](http://localhost:3000/api/assignGrade)

**Description:**

This endpoint updates the student grade collections with the grades for inspection, reports, and defense.

**Request Payload:**

```json
{
  "type": "inspection",
  "score": 18,
  "studentId": "60d52ebc2e0b7617c433df0a"
}
```

**Possible Responses:**

- Successful Request
  - Response type: success
  - Status code: 200
  - Response body
    ```json
    { "message": "Grades updated successfully" }
    ```

- Failed Request
  - Invalid form id
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Invalid form id"}
    ```

19. Collate Grades

**Endpoint:**

> POST - [http://localhost:3000/api/collateGrades/:studentId](http://localhost:3000/api/collateGrades/:studentId)

**Description:**

This endpoint collates the grades and locks the document for a specific student.

**Request Parameters:**

- `studentId`: The ID of the student whose grades need to be collated.

**Possible Responses:**

- Successful Request
  - Response type: success
  - Status code: 200
  - Response body
    ```json
    { "message": "Grades have been collated successfully" }
    ```

- Failed Request
  - Invalid student id
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Invalid student id"}
    ```

20. Collate All Grades

**Endpoint:**

> POST - [http://localhost:3000/api/collateAllGrades](http://localhost:3000/api/collateAllGrades)

**Description:**

This endpoint collates the grades of all students and locks the document.

**Possible Responses:**

- Successful Request
  - Response type: success
  - Status code: 200
  - Response body
    ```json
    { "message": "Grades have been collated successfully for all students" }
    ```

- Failed Request
  - Action failed
  - Response type: failed
  - Status code: 500
    ```json
    { "message": "Action failed, please try again or contact support" }
    ```

21. Get Forms

**Endpoint:**

> GET - [http://localhost:3000/api/forms](http://localhost:3000/api/forms)

**Description:**

This endpoint retrieves information about forms and their download URLs.

**Possible Responses:**

- Successful Request
  - Response type: success
  - Status code: 200
  - Response body: Array of form objects
    ```json
    [
      {
        "formId": "60d52ebc2e0b7617c433df0a",
        "formName": "Form 1",
        "downloadUrl": "http://localhost:3000/api/forms/downloadForm?formId=60d52ebc2e0b7617c433df0a"
      },
      ...
    ]
    ```

- Failed Request
  - No forms available
  - Response type: failed
  - Status code: 404
    ```json
    { "message": "There are currently no forms available" }
    ```

22. Delete Form

**Endpoint:**

> DELETE - [http://localhost:3000/api/forms/deleteForm?formId=formId](http://localhost:3000/api/forms/deleteForm?formId=formId)

**Description:**

This endpoint deletes a specific form.

**Request Query Parameters:**

- `formId`: The ID of the form to be deleted.

**Possible Responses:**

- Successful Request
  - Response type: success
  - Status code: 201
  - Response body
    ```json
    { "message": "Form has been deleted" }
    ```

- Failed Request
  - Invalid form id
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Invalid form id" }
    ```

  - Form not found
  - Response type: failed
  - Status code: 404
    ```json
    { "message": "Form not found" }
    ```

23. Search for Students

**Endpoint:**

> GET - [http://localhost:3000/api/search/students?q=searchQuery](http://localhost:3000/api/search/students?q=searchQuery)

**Description:**

This endpoint searches for students based on a search query.

**Request Query Parameters:**

- `q`: The search query.

**Possible Responses:**

- Successful Request
  - Response type: success
  - Status code: 200
  - Response body: Array of student objects
    ```json
    [
      {
        "studentId": "60d52ebc2e0b7617c433df0a",
        "firstName": "John",
        "lastName": "Doe",
        ...
      },
      ...
    ]
    ```

- Failed Request
  - Invalid search query
  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Please specify a search query" }
    ```

  - Search query too short


  - Response type: failed
  - Status code: 400
    ```json
    { "message": "Search query must be at least 3 characters long" }
    ```

- No students found
  - Response type: failed
  - Status code: 404
    ```json
    { "message": "No students found" }
    ```

24. Download All Student Data

This endpoint retrieves the data for all students and returns it as a CSV file ready for download.

#### Endpoint

> GET - [http://localhost:3000/api/students/download](http://localhost:3000/api/students/download)

#### Request Parameters

None

#### Response

- Success:
  - Status code: 200
  - Content-Type: text/csv
  - Content-Disposition: attachment; filename=students.csv
  - CSV file containing student data

- Error:
  - Status code: 404
  - Response body:
    ```json
    { "message": "No students found" }
    ```

---

25. Update Student Details

This endpoint allows coordinators to update the information for a particular student.

#### Endpoint

> PUT - [http://localhost:3000/api/students/:id](http://localhost:3000/api/students/:id)


#### Request Payload

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "course": "Computer Science",
  "level": "200",
  "phone": "1234567890",
  "accountNumber": "1234567890",
  "bankName": "Bank of Example",
  "sortCode": "123456"
}
```

#### Possible Responses

- Success:
  - Status code: 200
  - Response body:
    ```json
    { "message": "Student profile updated successfully" }
    ```

- Error:
  - Status code: 404
  - Response body:
    ```json
    { "message": "Student not found" }
    ```
