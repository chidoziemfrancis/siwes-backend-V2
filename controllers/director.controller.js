const SUPERVISORS = require("./../models/supervisor.model");
const COORDINATORS = require("./../models/coordinator.model");
const STUDENTS = require("./../models/student.model");
const handleError = require("./../utils/handleError");

/**
 * gets all supervisors
 * @param {request} req
 * @param {response} res
 */
const get_all_supervisors = async function (req, res) {
    try {
    const supervisors = await SUPERVISORS.find(
      {},
      { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
    );

    if (supervisors.length === 0) {
      res.status(404).json({ message: "No supervisors found" });
      return;
    }

    res.status(200).json(supervisors);
    return;
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * gets a specific supervisor
 * @param {request} req
 * @param {response} res
 */
const get_a_specific_supervisor = async function (req, res) {
    try {
        const id = req.params.id;

        // check if the id is valid mongodb document id
        if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
        }

        const supervisor = await SUPERVISORS.findOne(
        { _id: id },
        { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
        );

        if (supervisor === null) {
        res.status(404).json({ message: "Supervisor not found" });
        return;
        }

        res.status(200).json(supervisor);
        return;
    } catch (error) {
        handleError(error, res);
    }
}

/**
 * gets all coordinators
 * @param {request} req
 * @param {response} res
 */
const get_all_coordinators = async function (req, res) {
  try {
    const coordinators = await COORDINATORS.find(
      {},
      { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
    );

    if (coordinators.length === 0) {
      res.status(404).json({ message: "No coordinators found" });
      return;
    }

    res.status(200).json(coordinators);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * gets a specific coordinator
 * @param {request} req
 * @param {response} res
 */
const get_a_specific_coordinator = async function (req, res) {
    try {
        const id = req.params.id;

        // check if the id is valid mongodb document id
        if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
        }

        const coordinator = await COORDINATORS.findOne(
        { _id: id },
        { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
        );

        if (coordinator === null) {
        res.status(404).json({ message: "Coordinator not found" });
        return;
        }

        res.status(200).json(coordinator);
        return;
    } catch (error) {
        handleError(error, res);
    }
}

/**
 * gets all students
 * @param {request} req
 * @param {response} res
 */
const get_all_students = async function (req, res) {
    try {
    const students = await STUDENTS.find(
      {},
      { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
    );

    if (students.length === 0) {
      res.status(404).json({ message: "No students found" });
      return;
    }

    res.status(200).json(students);
    return;
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * gets a specific student
 * @param {request} req
 * @param {response} res
 */
const get_a_specific_student = async function (req, res) {
    try {
        const id = req.params.id;

        // check if the id is valid mongodb document id
        if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
        }

        const student = await STUDENTS.findOne(
        { _id: id },
        { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
        );

        if (student === null) {
        res.status(404).json({ message: "Student not found" });
        return;
        }

        res.status(200).json(student);
        return;
    } catch (error) {
        handleError(error, res);
    }
}

module.exports = {
    get_all_supervisors,
    get_a_specific_supervisor,
    get_all_coordinators,
    get_a_specific_coordinator,
    get_all_students,
    get_a_specific_student
};