const router = require('express').Router();
const { isSupervisor } = require('./../middlewares/auth.middleware');

//TODO: complete this
router.get('/get/:id', isSupervisor);

router.get('/assignedStudentsForDefense', isSupervisor);

router.get('/assignedStudentsForInspection', isSupervisor);

router.get('/forms', isSupervisor);

router.patch('/changePassword', isSupervisor);

router.patch('/update', isSupervisor);

module.exports = router;