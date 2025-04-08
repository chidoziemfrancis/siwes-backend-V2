const SUPERVISORS = require("./../models/supervisor.model");
const DEFENSE_LIST = require("../models/defense_list.model");
const INSPECTION_LIST = require("../models/inspection_list.model");
const FORMS = require("./../models/form.model");
const GRADES = require("./../models/grade.model");
const { handleError } = require("../utils/handleError");
const mongoose = require("mongoose");
const { request, response } = require("express");
const bcrypt = require("bcrypt");
const { existsSync } = require("fs");
const jsonToCsvString = require("../utils/jsonToCsvString");

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
      res.status(401).json({
        message:
          "Something went wrong while authenticating your request, re-authenticate and try again",
      });
      return;
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
                  $concat: [
                    "$firstName",
                    " ",
                    { $ifNull: [{ $concat: ["$middleName", " "] }, ""] },
                    "$lastName",
                  ],
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
      {
        $lookup: {
          from: "grades",
          localField: "studentDetails._id",
          foreignField: "studentId",
          as: "grade",
        },
      },
      {
        $addFields: {
          grade: {
            $arrayElemAt: ["$grade", 0],
          },
        },
      },
    ];

    const defenseList = await DEFENSE_LIST.aggregate(pipeline);

    if (defenseList.length === 0) {
      res
        .status(404)
        .json({ message: "You have not been assigned to any student" });
      return;
    }

    res.status(200).json(defenseList);
    return;
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
      res.status(401).json({
        message:
          "Something went wrong while authenticating your request, re-authenticate and try again",
      });
      return;
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
                  $concat: [
                    "$firstName",
                    " ",
                    { $ifNull: [{ $concat: ["$middleName", " "] }, ""] },
                    "$lastName",
                  ],
                },
                matricNo: 1,
                studentCode: 1,
                course: 1,
                email: 1,
                phone: 1,
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
                address: 1,
                phone: 1,
                state: 1,
                LGA: 1,
                email: 1,
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
      {
        $lookup: {
          from: "grades",
          localField: "studentDetails._id",
          foreignField: "studentId",
          as: "grade",
        },
      },
      {
        $addFields: {
          grade: {
            $arrayElemAt: ["$grade", 0],
          },
        },
      },
    ];

    const inspectionList = await INSPECTION_LIST.aggregate(pipeline);

    if (inspectionList.length === 0) {
      res
        .status(404)
        .json({ message: "You have not been assigned to any student" });
      return;
    }

    res.status(200).json(inspectionList);
    return;
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
      res
        .status(404)
        .json({ message: "There are currently no forms available" });
      return;
    }

    res.status(200).json(forms);
    return;
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
      res.status(401).json({
        message:
          "Something unusual happened to your authentication status while trying to chaneg your password, so we couldn't process your request",
      });
      return;
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
      res.status(400).json({ message: "Invalid update request" });
      return;
    }

    // you can't directly update the password field
    let allowedFields = ["firstName", "lastName", "phone", "office"];
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

    const supervisor = await SUPERVISORS.updateOne({ _id: id }, update);

    if (supervisor.acknowledged === false) {
      res.status(404).json({ message: "Supervisor not found" });
      return;
    }

    res.status(200).json({ message: "Supervisor updated successfully" });
    return;
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
    const { _id: supervisorId } = req.user;
    const { date, studentCode } = req.body;

    // checks if date is valid
    if (typeof date == "undefined") {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    if (new Date(date) < new Date(Date.now())) {
      res
        .status(400)
        .json({ message: "Inspection date must be in the future" });
      return;
    }

    // check if the supervisor is incharge of the student
    const isInCharge = await INSPECTION_LIST.findOne({
      supervisorId,
      studentCode,
    });

    if (isInCharge === null) {
      res.status(400).json({
        message:
          "Action failed, you are not the inspection supervisor of this student",
      });
      return;
    }

    const response = await INSPECTION_LIST.updateOne(
      { supervisorId, studentCode },
      { $set: { assignedDate: date } }
    );

    if (response.acknowledged == false) {
      res.status(500).json({ message: "Operation failed, please try again" });
      return;
    }

    res.status(200).json({ message: "Inspection date updated" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Allows the supervisor to update the date for defense
 * @param {request} req
 * @param {response} res
 */
const update_defense_time = async function (req, res) {
  try {
    const { _id: supervisorId } = req.user;
    const { date, studentCode } = req.body;

    // checks if date is valid
    if (typeof date == "undefined") {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    if (new Date(date) < new Date(Date.now())) {
      res.status(400).json({ message: "Defense date must be in the future" });
      return;
    }

    // check if the supervisor is incharge of the student
    const isInCharge = await DEFENSE_LIST.findOne({
      supervisorId,
      studentCode,
    });

    if (isInCharge === null) {
      res.status(400).json({
        message:
          "Action failed, you are not the defense supervisor of this student",
      });
      return;
    }

    const response = await DEFENSE_LIST.updateOne(
      { supervisorId, studentCode },
      { $set: { assignedDate: date } }
    );

    if (response.acknowledged == false) {
      res.status(500).json({ message: "Operation failed, please try again" });
      return;
    }

    res.status(200).json({ message: "Defense date updated" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Updates the student grade collections with the grades for inspection, reports and defense
 * @param {request} req
 * @param {response} res
 */
const assign_grade = async function (req, res) {
  const { type, score, studentId } = req.body;
  const { _id: lastUpdatedBy } = req.user;

  try {
    if (mongoose.Types.ObjectId.isValid(lastUpdatedBy) == false) {
      res.status(401).json({ message: "Please re authenticate to proceed" });
      return;
    }

    if (mongoose.Types.ObjectId.isValid(studentId) == false) {
      res.status(400).json({ message: "Invalid student id" });
      return;
    }

    const validTypes = {
      inspection: "inspectionScore",
      defense: "defenseScore",
      reports: "weeklyReportsScore",
    };
    if (Object.keys(validTypes).includes(type) == false) {
      res.status(400).json({
        message: "Invalid type specified, specify a valid type and try again",
      });
      return;
    }

    if (score == null || typeof score == "undefined") {
      res.status(400).json({ message: "Please specify a score" });
      return;
    }

    if (
      (type == "inspection" || type == "reports") &&
      (score > 20 || score < 0)
    ) {
      res
        .status(400)
        .json({ message: `${type} score must be between 0 and 20` });
      return;
    }

    if (type == "defense" && (score > 60 || score < 0)) {
      res
        .status(400)
        .json({ message: `${type} score must be between 0 and 60` });
      return;
    }

    const studentGrade = await GRADES.findOne({ studentId });

    // grades have been collated previously
    if (studentGrade !== null && studentGrade.total !== null) {
      res.status(400).json({
        message: "Grades cannot be updated as they have been collated already",
      });
      return;
    }

    const response = await GRADES.updateOne(
      { studentId },
      { [validTypes[type]]: score, lastUpdatedBy },
      { upsert: true }
    );

    if (response.acknowledged == false) {
      res.status(500).json({
        message: "Action failed, please try again or contact support",
      });
      return;
    }

    res.status(200).json({ message: "Grades updated successfully" });
  } catch (error) {
    console.log(error);
    handleError(error, res);
  }
};

/**
 * This routes send a downloadable object of the file to the user
 * @param {request} req
 * @param {response} res
 */
const download_form = async function (req, res) {
  const { formId } = req.query;

  try {
    if (mongoose.Types.ObjectId.isValid(formId) == false) {
      res.status(400).json({ message: "Invalid form id" });
      return;
    }

    const form = await FORMS.findById(formId);

    if (form == null) {
      res.status(404).json({ message: "Form not found" });
      return;
    }

    const filePath = form.pathToFile;
    const fullPath = __dirname + "/../" + filePath;

    if (existsSync(fullPath) == false) {
      res
        .status(404)
        .json({ message: "Form doesn't exist, please refresh and try again" });
      return;
    }

    res.download(fullPath);
  } catch (error) {
    handleError(error, res);
  }
};


// Helper function to flatten nested objects
function flattenObject(obj, parentKey = '', acc = {}) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propName = parentKey ? `${parentKey}.${key}` : key;
      const value = obj[key];

      if (key.startsWith('_') || typeof value === 'function') {
        continue;
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, propName, acc);
      } else {
        acc[propName] = value;
      }
    }
  }
  return acc;
}

const download_assigned_defense_students = async function (req, res) {
  console.log(req.user)
  const { _id } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(401).json({
        message:
          "Invalid user ID. Re-authenticate and try again.",
      });
    }

    const pipeline = [
      {
        $match: {
          supervisorId: mongoose.Types.ObjectId(_id),
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
                  $concat: [
                    "$firstName",
                    " ",
                    { $ifNull: [{ $concat: ["$middleName", " "] }, ""] },
                    "$lastName",
                  ],
                },
                matricNo: 1,
                studentCode: 1,
                course: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$studentDetails" },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "companyDetails",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: { path: "$companyDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "supervisors",
          localField: "supervisorId",
          foreignField: "_id",
          as: "supervisorDetails",
          pipeline: [
            { $project: { name: { $concat: ["$firstName", " ", "$lastName"] } } },
          ],
        },
      },
      { $unwind: "$supervisorDetails" },
      {
        $lookup: {
          from: "grades",
          localField: "studentDetails._id",
          foreignField: "studentId",
          as: "grade",
        },
      },
      {
        $addFields: {
          grade: { $arrayElemAt: ["$grade", 0] },
        },
      },
    ];

    const defenseList = await INSPECTION_LIST.aggregate(pipeline);

    if (defenseList.length === 0) {
      return res.status(404).json({ message: "You have not been assigned to any student" });
    }

    const flattened = defenseList.map(item => flattenObject(item));
    const csvString = jsonToCsvString(flattened);

    res
      .status(200)
      .header("Content-Type", "text/csv")
      .header("Content-Disposition", "attachment; filename=assigned_defense_students.csv")
      .send(csvString);
  } catch (error) {
    console.error("CSV download error:", error);
    handleError(error, res);
  }
};



module.exports = {
  get_a_supervisor,
  get_assigned_students_for_defense,
  get_assigned_students_for_inspection,
  get_forms,
  change_password,
  update_supervisor_details,
  update_defense_time,
  update_inspection_time,
  assign_grade,
  download_form,
  download_assigned_defense_students,
};
