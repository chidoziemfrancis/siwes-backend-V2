const COORDINATORS = require("../models/coordinator.model");
const SUPERVISORS = require("./../models/supervisor.model");
const STUDENTS = require("./../models/student.model");
const DEFENSE_LIST = require("./../models/defense_list.model");
const INSPECTION_LIST = require("./../models/inspection_list.model");
const DEADLINE = require("./../models/deadline.model");
const FORMS = require("./../models/form.model");
const GRADES = require("../models/grade.model");
const WEEKLYREPORTS = require("./../models/weekly_report.model");
const { handleError } = require("../utils/handleError");
const mongoose = require("mongoose");
const { request, response } = require("express");
const bcrypt = require("bcrypt");

/**
 * adds a new coordinator
 * @param {request} req
 * @param {response} res
 */
const add_a_new_coordinator = async function (req, res) {
  try {
    const coordinator = await COORDINATORS.create(req.body);

    return res.status(201).json({
      message: "Coordinator added successfully",
      coordinator: coordinator._id,
    });
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
      { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
    );

    if (coordinators.length === 0) {
      return res.status(404).json({ message: "No coordinators found" });
    }

    return res.status(200).json(coordinators);
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
      return res.status(400).json({ message: "Invalid id" });
    }

    const coordinator = await COORDINATORS.findOne(
      { _id: id },
      { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
    );

    if (coordinator === null) {
      return res.status(404).json({ message: "Coordinator not found" });
    }

    return res.status(200).json(coordinator);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * delete a coordinator
 * @param {request} req
 * @param {response} res
 */
const delete_a_coordinator = async function (req, res) {
  try {
    const id = req.params.id;

    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const deleteInfo = await COORDINATORS.deleteOne({ _id: id });

    if (deleteInfo.deletedCount === 0) {
      return res
        .status(400)
        .json({ message: "No coordinator with that id exists" });
    }

    return res
      .status(200)
      .json({ message: "Coordinator deleted successfully" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * update coordinator details
 * @param {request} req
 * @param {response} res
 */
const update_coordinator_details = async function (req, res) {
  try {
    const id = req.params.id;
    const update = req.body;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "Invalid update request" });
    }

    // you can't directly update the password field
    let hasInvalidField = false;
    let allowedFields = ["firstName", "lastName", "phone1", "phone2", "office"];
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

    const coordinator = await COORDINATORS.updateOne({ _id: id }, update);

    if (coordinator.acknowledged === false) {
      return res.status(404).json({ message: "Coordinator not found" });
    }

    return res
      .status(200)
      .json({ message: "Coordinator updated successfully" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Changes coordinators password
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
    const coordinator = await COORDINATORS.findOne({ _id });

    if (coordinator === null) {
      res.status(401).json({
        message:
          "Something unusual happened to your authentication status while trying to chaneg your password, so we couldn't process your request",
      });
      return;
    }

    const passwordIsValid = await bcrypt.compare(
      oldPassword,
      coordinator.password
    );

    if (!passwordIsValid) {
      res.status(400).json({ message: "Incorrect password" });
      return;
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { modifiedCount } = await COORDINATORS.updateOne(
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

/**
 * Allows the upload of an inspection form after passing through the upload middleware
 * @param {request} req
 * @param {response} res
 */
const upload_inspection_forms = async function (req, res) {
  const formInfo = req.body;
  const { _id } = req.user;

  try {
    if (typeof formInfo !== "object" || Object.keys(formInfo).length === 0) {
      res.status(400).json({ message: "Please fill all the fields" });
      return;
    }

    await FORMS.create({ ...formInfo, uploadedBy: _id });

    return res.status(200).json({ message: "Form was added successfully" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Allows a coordinator to create a supervisor
 * @param {request} req
 * @param {response} res
 */
const create_supervisor = async function (req, res) {
  try {
    const supervisor = await SUPERVISORS.create(req.body);

    return res.status(201).json({
      message: "Supervisor added successfully",
      supervisor: supervisor._id,
    });
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
      { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
    );

    if (supervisors.length === 0) {
      return res.status(404).json({ message: "No supervisors found" });
    }

    return res.status(200).json(supervisors);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Assigns a student to a supervisor for defense, can also be used to overwrite previous assignment
 * @param {request} req
 * @param {response} res
 */
const assign_defense_supervisor = async function (req, res) {
  const { studentCode, supervisorId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
      return res.status(400).json({ message: "Invalid supervisor id" });
    }

    if (/\w+\-\d+\-\d+/.test(studentCode) === false) {
      return res.status(400).json({ message: "Invalid student code" });
    }

    const supervisorExists = await SUPERVISORS.findOne({ _id: supervisorId });

    if (supervisorExists === null) {
      return res
        .status(400)
        .json({ message: "No supervisor was found with that id" });
    }

    const studentExists = await STUDENTS.findOne({ studentCode });

    if (studentExists === null) {
      return res
        .status(400)
        .json({ message: "No student was found with that student code" });
    }

    const studentSupervisionList = await INSPECTION_LIST.findOne({
      studentCode,
    });

    if (
      studentSupervisionList &&
      studentSupervisionList.supervisorId.equals(supervisorId)
    ) {
      return res.status(400).json({
        message:
          "The same supervisor can not inspect and be in charge of defense for the same student",
      });
    }

    await DEFENSE_LIST.updateOne(
      { studentCode },
      { supervisorId },
      { upsert: true }
    );

    return res
      .status(200)
      .json({ message: "Defense supervisor was successfully assigned" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 *  Assigns a student to a supervisor for inspection, can also be used to overwrite previous assignment
 * @param {request} req
 * @param {response} res
 */
const assign_inspection_supervisor = async function (req, res) {
  const { studentCode, supervisorId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
      return res.status(400).json({ message: "Invalid supervisor id" });
    }

    if (/\w+\-\d+\-\d+/.test(studentCode) === false) {
      return res.status(400).json({ message: "Invalid student code" });
    }

    const supervisorExists = await SUPERVISORS.findOne({ _id: supervisorId });

    if (supervisorExists === null) {
      return res
        .status(400)
        .json({ message: "No supervisor was found with that id" });
    }

    const studentExists = await STUDENTS.findOne({ studentCode });

    if (studentExists === null) {
      return res
        .status(400)
        .json({ message: "No studet was found with that student code" });
    }

    const studentSupervisionList = await DEFENSE_LIST.findOne({ studentCode });

    if (
      studentSupervisionList &&
      studentSupervisionList.supervisorId.equals(supervisorId)
    ) {
      return res.status(400).json({
        message:
          "The same supetvisor can not inspect and be in charge of defense for the same student",
      });
    }

    await INSPECTION_LIST.updateOne(
      { studentCode },
      { supervisorId },
      { upsert: true }
    );

    return res
      .status(200)
      .json({ message: "Inspection supervisor was successfully assigned" });
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
      { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
    );

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    return res.status(200).json(students);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Returns the details of a particular student
 * @param {request} req
 * @param {response} res
 */
const get_a_student = async function (req, res) {
  const { id } = req.params;

  try {
    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    // when a specific student is queried the coordinator needs to see all his info
    const student = await STUDENTS.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id),
        },
      },
      {
        $addFields: {
          name: {
            $concat: ["$firstName", " ", "$middleName", " ", "$lastName"],
          },
        },
      },
      {
        $project: {
          firstName: 0,
          lastName: 0,
          middleName: 0,
          updatedAt: 0,
          createdAt: 0,
          _v: 0,
          validation_secret: 0,
          password: 0,
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "company",
        },
      },
      {
        $lookup: {
          from: "supervision_lists",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "supervisor",
        },
      },
      {
        $addFields: {
          company: {
            $arrayElemAt: ["$company", 0],
          },
          supervisor: {
            $arrayElemAt: ["$supervisor", 0],
          },
        },
      },
      {
        $lookup: {
          from: "supervisor",
          localField: "supervisor._id",
          foreignField: "_id",
          as: "supervisor",
        },
      },
      {
        $addFields: {
          supervisor: {
            $arrayElemAt: ["$supervisor", 0],
          },
        },
      },
      {
        $lookup: {
          from: "grades",
          localField: "_id",
          foreignField: "studentId",
          as: "grades",
          pipeline: [
            {
              $project: {
                studentId: 0,
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          grades: {
            $arrayElemAt: ["$grades", 0],
          },
        },
      },
      {
        $lookup: {
          from: "coordinators",
          localField: "grades.lastUpdatedBy",
          foreignField: "_id",
          as: "lastUpdatedBy",
        },
      },
      {
        $addFields: {
          lastUpdatedBy: {
            $arrayElemAt: ["$lastUpdatedBy", 0],
          },
        },
      },
      {
        $set: {
          "grades.lastUpdatedBy": {
            $concat: [
              "$lastUpdatedBy.firstName",
              " ",
              "$lastUpdatedBy.lastName",
            ],
          },
        },
      },
      {
        $unset: "lastUpdatedBy",
      },
    ]);

    if (student === null) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json(student);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Returns a list containing all students and thier assigned supervisors for defense
 * @param {request} req
 * @param {response} res
 */
const get_defense_list = async function (req, res) {
  try {
    // TODO: remove extra space when there is no middlename
    const pipeline = [
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
      return res.status(404).json({ message: "Defense list is empty" });
    }

    return res.status(200).json(defenseList);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Returns a list of all students and thier assigned supervisors for inspection
 * @param {request} req
 * @param {response} res
 */
const get_inspection_list = async function (req, res) {
  try {
    // TODO: remove extra space when there is no middlename
    const pipeline = [
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
      return res.status(404).json({ message: "Inspection list is empty" });
    }

    return res.status(200).json(inspectionList);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Accepts the deadline date and updates the deadline document
 * @param {request} req
 * @param {response} res
 */
const set_registration_deadline = async function (req, res) {
  const { time } = req.body;
  const { _id: updatedBy } = req.user;

  try {
    let currentTime = Date.now();

    if (time < currentTime) {
      return res
        .status(400)
        .json({ message: "You cannot set a deadline into the past" });
    }

    if (!mongoose.Types.ObjectId.isValid(updatedBy)) {
      return res.status(401).json({
        message:
          "Something went wrong while authenticating your request, re-authenticate and try again",
      });
    }

    // clears the entire collection
    await DEADLINE.deleteMany({});

    await DEADLINE.create({ time, updatedBy });

    return res
      .status(200)
      .json({ message: "Registration deadline has been assigned" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Returns a list of all the weekly reports for the specified student
 * @param {request} req
 * @param {response} res
 */
const get_weekly_reports = async function (req, res) {
  const { studentCode } = req.params;

  try {
    // match the pattern of the student code - deptname-year-last 4 digits matric no
    if (/[A-Za-z]+\-\d{4}\-\d{4}/.test(studentCode) == false) {
      res.status(400).json({ message: "Invalid student code" });
      return;
    }

    const reports = await WEEKLYREPORTS.find({ studentCode });

    if (reports.length == 0) {
      res
        .status(404)
        .json({
          message:
            "No weekly reports submission found for the specified student",
        });
      return;
    }

    res.status(200).json({ reports });
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
      res
        .status(400)
        .json({
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
      res
        .status(400)
        .json({
          message:
            "Grades cannot be updated as they have been collated already",
        });
      return;
    }

    const response = await GRADES.updateOne(
      { studentId },
      { [validTypes[type]]: score, lastUpdatedBy },
      { upsert: true }
    );

    if (response.acknowledged == false) {
      res
        .status(500)
        .json({
          message: "Action failed, please try again or contact support",
        });
      return;
    }

    res.status(200).json({ message: "Grades updated successfully" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Collates the grades and *locks the document
 * @param {request} req
 * @param {response} res
 */
const collate_grades = async function (req, res) {
  const { studentId } = req.params;
  const { _id: lastUpdatedBy } = req.user;

  try {
    if (mongoose.Types.ObjectId.isValid(studentId) == false) {
      res.status(400).json({ message: "Invalid student id" });
      return;
    }

    const response = await GRADES.updateOne({ studentId }, [
      {
        $set: {
          total: {
            $sum: ["$inspectionScore", "$weeklyReportsScore", "$defenseScore"],
          },
          lastUpdatedBy: lastUpdatedBy,
        },
      },
    ]);

    if (response.acknowledged == false) {
      res
        .status(500)
        .json({
          message: "Action failed, please try again or contact support",
        });
      return;
    }

    res.status(200).json({ message: "Grades have been collated successfully" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Collates the grades of all students and *locks the document
 * @param {request} req
 * @param {response} res
 */
const collate_all_grades = async function (req, res) {
  const { _id: lastUpdatedBy } = req.user;

  try {
    const response = await GRADES.updateMany({}, [
      {
        $set: {
          total: {
            $sum: ["$inspectionScore", "$weeklyReportsScore", "$defenseScore"],
          },
          lastUpdatedBy: lastUpdatedBy,
        },
      },
    ]);

    if (response.acknowledged == false) {
      res
        .status(500)
        .json({
          message: "Action failed, please try again or contact support",
        });
      return;
    }

    res
      .status(200)
      .json({
        message: "Grades have been collated successfully for all students",
      });
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  add_a_new_coordinator,
  get_all_coordinators,
  delete_a_coordinator,
  update_coordinator_details,
  get_a_specific_coordinator,
  change_password,
  upload_inspection_forms,
  create_supervisor,
  get_all_supervisors,
  get_defense_list,
  get_inspection_list,
  assign_defense_supervisor,
  assign_inspection_supervisor,
  get_all_students,
  get_a_student,
  set_registration_deadline,
  get_weekly_reports,
  assign_grade,
  collate_grades,
  collate_all_grades,
};
