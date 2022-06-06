const Router = require('express').Router();

// import required routes
const { get_all_coordinators, add_a_new_coordinator, get_a_specific_coordinator, delete_a_coordinator, update_coordinator_details } = require('../controllers/coordinator.controller');
const { } = require('../controllers/supervisor.controller');
const { } = require('../controllers/student.controller');
const { } = require('../controllers/general.controller');


// change the all to specific routes and use the appropraite functions this file will be like a description to the frontend guy,
// also the middleware for auth will be in this file

// Coordinator specific routes
Router.get('/coordinators', get_all_coordinators);

Router.get('/coordinators/:id', get_a_specific_coordinator);

Router.post('/coordinators', add_a_new_coordinator);

Router.delete('/coordinators/:id', delete_a_coordinator);

Router.patch('/coordinators/:id', update_coordinator_details);

// // Supervisor specific routes
// Router.all('/supervisor', supervisorController);

// // Student specific routes
// Router.all('/student', studentController);

// // General Routes
// Router.all('/', generalController);

module.exports = Router;