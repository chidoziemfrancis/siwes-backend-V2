const Router = require('express').Router();

// import required routes
const { } = require('../controllers/coordinator.controller');
const { } = require('../controllers/supervisor.controller');
const { } = require('../controllers/student.controller');
const { } = require('../controllers/general.controller');


// change the all to specific routes and use the appropraite functions this file will be like a description to the frontend guy

// Coordinator specific routes
// Router.all('/coordinator', coordinatorController);

// // Supervisor specific routes
// Router.all('/supervisor', supervisorController);

// // Student specific routes
// Router.all('/student', studentController);

// // General Routes
// Router.all('/', generalController);

module.exports = Router;