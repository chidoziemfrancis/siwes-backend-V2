const SUPERVISORS = require("./../models/supervisor.model");
const DEFENSE_LIST = require("../models/defense_list.model");
const INSPECTION_LIST = require("../models/inspection_list.model");
const FORMS = require("./../models/form.model");
const { handleError } = require("../utils/handleError");
const mongoose = require("mongoose");
const { request, response } = require("express");
const bcrypt = require("bcrypt");

/**
 * Gets the details of a specific supervisor
 * @param {request} req
 * @param {response} res
 */
const get_a_supervisor = async function (req, res) {
  try {
    const id = req.params.id;

    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const supervisor = await SUPERVISORS.findOne(
      { _id: id },
      { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
    );

    if (supervisor === null) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    return res.status(200).json(supervisor);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get the list of students assigned to you for defense
 * @param {request} req
 * @param {response} res
 */
const get_assigned_students_for_defense = async function (req, res) {
  const { _id } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(401).json({
        message:
          "Something went wrong while authenticating your request, re-authenticate and try again",
      });
    }

    const pipeline = [
      {
        $match: {
          supervisorId: mongoose.Types.ObjectId(`${_id}`),
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "studentDetails",
          pipeline: [
            {
              $project: {
                name: {
                  $concat: ["$firstName", " ", "$middleName", " ", "$lastName"],
                },
                matricNo: 1,
                studentCode: 1,
                course: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$studentDetails",
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "companyDetails",
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          studentCode: 0,
          updatedAt: 0,
          createdAt: 0,
        },
      },
      {
        $unwind: {
          path: "$companyDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "supervisorId",
          foreignField: "_id",
          as: "supervisorDetails",
          pipeline: [
            {
              $project: {
                name: {
                  $concat: ["$firstName", " ", "$lastName"],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$supervisorDetails",
        },
      },
      {
        $project: {
          supervisorId: 0,
        },
      },
    ];

    const defenseList = await DEFENSE_LIST.aggregate(pipeline);

    if (defenseList.length === 0) {
      return res
        .status(404)
        .json({ message: "You have not been assigned to any student" });
    }

    return res.status(200).json(defenseList);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get the list of students assigned to you for inspection
 * @param {request} req
 * @param {response} res
 */
const get_assigned_students_for_inspection = async function (req, res) {
  const { _id } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(401).json({
        message:
          "Something went wrong while authenticating your request, re-authenticate and try again",
      });
    }

    const pipeline = [
      {
        $match: {
          supervisorId: mongoose.Types.ObjectId(`${_id}`),
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "studentDetails",
          pipeline: [
            {
              $project: {
                name: {
                  $concat: ["$firstName", " ", "$middleName", " ", "$lastName"],
                },
                matricNo: 1,
                studentCode: 1,
                course: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$studentDetails",
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "companyDetails",
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          studentCode: 0,
          updatedAt: 0,
          createdAt: 0,
        },
      },
      {
        $unwind: {
          path: "$companyDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "supervisorId",
          foreignField: "_id",
          as: "supervisorDetails",
          pipeline: [
            {
              $project: {
                name: {
                  $concat: ["$firstName", " ", "$lastName"],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$supervisorDetails",
        },
      },
      {
        $project: {
          supervisorId: 0,
        },
      },
    ];

    const inspectionList = await INSPECTION_LIST.aggregate(pipeline);

    if (inspectionList.length === 0) {
      return res
        .status(404)
        .json({ message: "You have not been assigned to any student" });
    }

    return res.status(200).json(inspectionList);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get the information about forms and the download urls
 * @param {request} req
 * @param {response} res
 */
const get_forms = async function (req, res) {
  try {
    const forms = await FORMS.find({});

    if (forms.length === 0) {
      return res
        .status(404)
        .json({ message: "There are currently no forms available" });
    }

    return res.status(200).json(forms);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Allows the supervisor to change their password
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
    const supervisor = await SUPERVISORS.findOne({ _id });

    if (supervisor === null) {
      return res.status(401).json({
        message:
          "Something unusual happened to your authentication status while trying to chaneg your password, so we couldn't process your request",
      });
    }

    const passwordIsValid = await bcrypt.compare(
      oldPassword,
      supervisor.password
    );

    if (!passwordIsValid) {
      res.status(400).json({ message: "Incorrect password" });
      return;
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { modifiedCount } = await SUPERVISORS.updateOne(
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
    console.log(error);
    handleError(error, res);
  }
};

/**
 * Allows the supervisor to update their details
 * @param {request} req
 * @param {response} res
 */
const update_supervisor_details = async function (req, res) {
  try {
    const { _id: id } = req.user;
    const update = req.body;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "Invalid update request" });
    }

    // you can't directly update the password field
    let hasInvalidField = false;
    let allowedFields = ["firstName", "lastName", "phone", "office"];
    Object.keys(update).forEach((key) => {
      if (allowedFields.includes(key) === false) {
        hasInvalidField = true;
      }
    });

    if (hasInvalidField) {
      return res.status(400).json({
        message: "Your update failed as it contains certain invalid fields",
      });
    }

    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const supervisor = await SUPERVISORS.updateOne({ _id: id }, update);

    if (supervisor.acknowledged === false) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    return res.status(200).json({ message: "Supervisor updated successfully" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Allows the supervisor to update the date for inspection
 * @param {request} req
 * @param {response} res
 */
const update_inspection_time = async function (req, res) {
  try {
    const { _id:supervisorId } = req.user;
    const { date, studentCode } = req.body;

    // checks if date is valid
    if (typeof date == 'undefined') {
      res.status(400).json({ message: "Invalid request" })
      return;
    }

    if (new Date(date) < new Date(Date.now())) {
      res.status(400).json({ message: "Inspection date must be in the future" })
      return;
    }

    // check if the supervisor is incharge of the student
    const isInCharge = await INSPECTION_LIST.findOne({ supervisorId, studentCode });

    if (isInCharge === null) {
      res.status(400).json({ message: "Action failed, you are not the inspection supervisor of this student" });
      return;
    }

    const response = await INSPECTION_LIST.updateOne({ supervisorId, studentCode }, { $set: { assignedDate: date } });

    if (response.acknowledged == false) {
      res.status(500).json({ message: "Operation failed, please try again" })
      return;
    }

    res.status(200).json({ message: "Inspection date updated" })
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * Allows the supervisor to update the date for defense
 * @param {request} req
 * @param {response} res
 */
const update_defense_time = async function (req, res) {
  try {
    const { _id:supervisorId } = req.user;
    const { date, studentCode } = req.body;

    // checks if date is valid
    if (typeof date == 'undefined') {
      res.status(400).json({ message: "Invalid request" })
      return;
    }

    if (new Date(date) < new Date(Date.now())) {
      res.status(400).json({ message: "Defense date must be in the future" })
      return;
    }

    // check if the supervisor is incharge of the student
    const isInCharge = await DEFENSE_LIST.findOne({ supervisorId, studentCode });

    if (isInCharge === null) {
      res.status(400).json({ message: "Action failed, you are not the defense supervisor of this student" });
      return;
    }

    const response = await DEFENSE_LIST.updateOne({ supervisorId, studentCode }, { $set: { assignedDate: date } });

    if (response.acknowledged == false) {
      res.status(500).json({ message: "Operation failed, please try again" })
      return;
    }

    res.status(200).json({ message: "Defense date updated" })
  } catch (error) {
    handleError(error, res);
  }
}

module.exports = {
  get_a_supervisor,
  get_assigned_students_for_defense,
  get_assigned_students_for_inspection,
  get_forms,
  change_password,
  update_supervisor_details,
  update_defense_time,
  update_inspection_time
};
