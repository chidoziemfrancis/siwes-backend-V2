const DIRECTORS = require("../models/director.model");
const COORDINATORS = require("../models/coordinator.model");
const SUPERVISORS = require("./../models/supervisor.model");
const STUDENTS = require("./../models/student.model");
const { handleError } = require("../utils/handleError");
const mongoose = require("mongoose");
const { request, response } = require("express");
const bcrypt = require("bcrypt");

/**
 * adds a new director
 * @param {request} req
 * @param {response} res
 */
const add_director = async function (req, res) {
  try {
    const director = await DIRECTORS.create(req.body);

    res.status(201).json({
      message: "Director added successfully",
      director: director._id,
    });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * gets all directors
 * @param {request} req
 * @param {response} res
 */
const get_all_directors = async function (req, res) {
  try {
    const directors = await DIRECTORS.find(
      {},
      { password: 0, validation_secret: 0 }
    );

    if (directors.length === 0) {
      res.status(404).json({ message: "No directors found" });
      return;
    }

    res.status(200).json(directors);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * gets the current logged-in director's details
 * @param {request} req
 * @param {response} res
 */
const get_current_director = async function (req, res) {
  try {
    const { _id } = req.user;

    const director = await DIRECTORS.findOne(
      { _id },
      { password: 0, validation_secret: 0 }
    );

    if (director === null) {
      res.status(404).json({ message: "Director not found" });
      return;
    }

    res.status(200).json(director);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * gets a specific director
 * @param {request} req
 * @param {response} res
 */
const get_a_specific_director = async function (req, res) {
  try {
    const id = req.params.id;

    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }

    const director = await DIRECTORS.findOne(
      { _id: id },
      { password: 0, validation_secret: 0 }
    );

    if (director === null) {
      res.status(404).json({ message: "Director not found" });
      return;
    }

    res.status(200).json(director);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Returns a list of all the supervisors
 * @param {request} req
 * @param {response} res
 */
const get_all_supervisors = async function (req, res) {
  try {
    const supervisors = await SUPERVISORS.find(
      {},
      { password: 0, validation_secret: 0 }
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
};

/**
 * Returns the details of a particular supervisor
 * @param {request} req
 * @param {response} res
 */
const get_a_specific_supervisor = async function (req, res) {
  const { id } = req.params;

  try {
    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }

    const supervisor = await SUPERVISORS.findOne(
      { _id: id },
      { password: 0, validation_secret: 0 }
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
};

/**
 * gets all coordinators
 * @param {request} req
 * @param {response} res
 */
const get_all_coordinators = async function (req, res) {
  try {
    const coordinators = await COORDINATORS.find(
      {},
      { password: 0, validation_secret: 0 }
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
      { password: 0, validation_secret: 0 }
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
};

/**
 * Returns a list containing all students
 * @param {request} req
 * @param {response} res
 */
const get_all_students = async function (req, res) {
  try {
    const students = await STUDENTS.find(
      {},
      { password: 0, validation_secret: 0 }
    );

    if (students.length === 0) {
      res.status(404).json({ message: "No students found" });
      return;
    }

    const totalStudents = await STUDENTS.countDocuments();

    res.status(200).json({
      students,
      totalStudents,
    });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Returns the details of a particular student
 * @param {request} req
 * @param {response} res
 */
const get_a_specific_student = async function (req, res) {
  const { id } = req.params;

  try {
    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }

    const student = await STUDENTS.findOne(
      { _id: id },
      { password: 0, validation_secret: 0 }
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
};

/**
 * update director details
 * @param {request} req
 * @param {response} res
 */
const update_director_details = async function (req, res) {
  try {
    const id = req.params.id;
    const update = req.body;

    if (Object.keys(update).length === 0) {
      res.status(400).json({ message: "Invalid update request" });
      return;
    }

    // you can't directly update the password field
    let allowedFields = ["firstName", "lastName", "phone", "office", "email"];
    let hasInvalidField = Object.keys(update).some(
      (field) => !allowedFields.includes(field)
    );

    if (hasInvalidField) {
      res.status(400).json({
        message: "Your update failed as it contains certain invalid fields",
      });
      return;
    }

    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }

    const director = await DIRECTORS.updateOne({ _id: id }, update);

    if (director.acknowledged === false) {
      res.status(404).json({ message: "Director not found" });
      return;
    }

    res.status(200).json({ message: "Director updated successfully" });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Changes director password
 * @param {request} req
 * @param {response} res
 */
const change_password = async function (req, res) {
  let { oldPassword, newPassword } = req.body;
  const { _id } = req.user;

  if (typeof oldPassword === "string") {
    oldPassword = oldPassword.trim();
  }

  if (typeof newPassword === "string") {
    newPassword = newPassword.trim();
  }

  if (!(oldPassword && newPassword)) {
    res.status(400).json({
      message: "Incomplete request, please specify all required parameters",
    });
    return;
  }

  try {
    const director = await DIRECTORS.findOne({ _id });

    if (director === null) {
      res.status(401).json({
        message:
          "Something unusual happened to your authentication status while trying to change your password, so we couldn't process your request",
      });
      return;
    }

    const passwordIsValid = await bcrypt.compare(
      oldPassword,
      director.password
    );

    if (!passwordIsValid) {
      res.status(400).json({ message: "Incorrect password" });
      return;
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { modifiedCount } = await DIRECTORS.updateOne(
      { _id },
      { password: hashedPassword }
    );

    if (!modifiedCount) {
      res
        .status(500)
        .json({ message: "Something went wrong, please try again" });
      return;
    }

    res.status(200).json({ message: "Password was changed successfully" });
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  add_director,
  get_all_directors,
  get_current_director,
  get_a_specific_director,
  get_all_supervisors,
  get_a_specific_supervisor,
  get_all_coordinators,
  get_a_specific_coordinator,
  get_all_students,
  get_a_specific_student,
  update_director_details,
  change_password,
};
