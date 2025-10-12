const SUPERVISORS = require("./../models/supervisor.model");
const COORDINATORS = require("./../models/coordinator.model");
const STUDENTS = require("./../models/student.model");
const handleError = require("./../utils/handleError");

const get_all_supervisors = async function (req, res) {
    try {
        const supervisor = await SUPERVISORS.findOne(
            { _id: id },
            { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
        );

        if (supervisor === null) {
            res.status(404).json({ message: "Supervisor not found" });
            return;
        }
    } catch (error) {
        handleError(error, res);
    }
}

module.exports = {
    get_all_supervisors,
}