const router = require('express').Router();
const coordinatorsRoutes = require('./coordinators.routes');
const studentsRoutes = require('./students.routes');
const supervisorsRoutes = require('./supervisors.routes');

// Coordinator specific routes
router.use('/coordinators', coordinatorsRoutes)

// Supervisor specific routes
router.use('/supervisor', supervisorsRoutes);

// Student specific routes
router.use('/student', studentsRoutes);

module.exports = router;