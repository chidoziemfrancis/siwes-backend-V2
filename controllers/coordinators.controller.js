const COORDINATORS = require("../models/coordinator.model");
const SUPERVISORS = require("./../models/supervisor.model");
const STUDENTS = require("./../models/student.model");
const DEFENSE_LIST = require("./../models/defense_list.model");
const INSPECTION_LIST = require("./../models/inspection_list.model");
const DEADLINE = require("./../models/deadline.model");
const FORMS = require("./../models/form.model");
const GRADES = require("../models/grade.model");
const WEEKLYREPORTS = require("./../models/weekly_report.model");
const COMPANIES = require("./../models/company.model");
const { handleError } = require("../utils/handleError");
const mongoose = require("mongoose");
const { request, response } = require("express");
const bcrypt = require("bcrypt");
const { existsSync, unlinkSync } = require("fs");
const path = require("path");
const jsonToCsvString = require("../utils/jsonToCsvString");
const { ObjectId } = require("mongoose").Types;
const { sendMailToSupervisorEmail } = require("./mail.controller");
const cloudinary = require("cloudinary").v2;

/**
 * adds a new coordinator
 * @param {request} req
 * @param {response} res
 */
const add_a_new_coordinator = async function (req, res) {
  try {
    const coordinator = await COORDINATORS.create(req.body);

    res.status(201).json({
      message: "Coordinator added successfully",
      coordinator: coordinator._id,
    });
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
      res.status(400).json({ message: "Invalid id" });
      return;
    }

    const deleteInfo = await COORDINATORS.deleteOne({ _id: id });

    if (deleteInfo.deletedCount === 0) {
      res.status(400).json({ message: "No coordinator with that id exists" });
      return;
    }

    res.status(200).json({ message: "Coordinator deleted successfully" });
    return;
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
      res.status(400).json({ message: "Invalid update request" });
      return;
    }

    // Allowed fields for coordinator update
    // Note: password, email, faculty, and department require special handling
    let allowedFields = [
      "firstName",
      "lastName",
      "phone1",
      "phone2",
      "office",
      "email",
      "faculty",
      "department",
      "isMainCoordinator",
    ];

    // Handle password separately with hashing
    if (update.password) {
      if (update.password.trim().length < 8) {
        res.status(400).json({
          message: "Password must be at least 8 characters",
        });
        return;
      }
      // Hash password before updating
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(update.password, salt);
      allowedFields.push("password");
    }

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

    const coordinator = await COORDINATORS.updateOne({ _id: id }, update);

    if (coordinator.acknowledged === false) {
      res.status(404).json({ message: "Coordinator not found" });
      return;
    }

    res.status(200).json({ message: "Coordinator updated successfully" });
    return;
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
          "Something unusual happened to your authentication status while trying to change your password, so we couldn't process your request",
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
    // Validate required fields
    const { name, pathToFile, publicId, description, purpose } = formInfo;

    if (!name || !pathToFile || !publicId) {
      res.status(400).json({
        message: "File upload failed. Please try again.",
      });
      return;
    }

    if (!description || !purpose) {
      res.status(400).json({
        message: "Please provide both description and purpose for the form",
      });
      return;
    }

    // Create the form with all required fields
    const formData = {
      name,
      pathToFile,
      publicId,
      description,
      purpose,
      uploadedBy: _id,
    };

    await FORMS.create(formData);

    res.status(200).json({ message: "Form was added successfully" });
    return;
  } catch (error) {
    console.error("Form upload error:", error);
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

    res.status(201).json({
      message: "Supervisor added succepssfully",
      supervisor: supervisor._id,
    });

    // Send email after success - don't fail the request if email fails
    try {
      await sendMailToSupervisorEmail(req.body);
    } catch (emailError) {
      console.error("Failed to send supervisor email:", emailError);
    }
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
    const pipeline = [
      {
        $project: {
          password: 0,
          validation_secret: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      },
      {
        $lookup: {
          from: "inspection_lists",
          foreignField: "supervisorId",
          localField: "_id",
          as: "assignedStudents",
        },
      },
      {
        $addFields: {
          noOfAssignedStudents: {
            $size: "$assignedStudents",
          },
        },
      },
      {
        $project: {
          assignedStudents: 0,
        },
      },
    ];

    const supervisors = await SUPERVISORS.aggregate(pipeline);

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
 * Assigns a student to a supervisor for defense, can also be used to overwrite previous assignment
 * @param {request} req
 * @param {response} res
 */
const assign_defense_supervisor = async function (req, res) {
  const { studentCode, supervisorId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
      res.status(400).json({ message: "Invalid supervisor id" });
      return;
    }

    if (/\w+\-\d+\-\d+/.test(studentCode) === false) {
      res.status(400).json({ message: "Invalid student code" });
      return;
    }

    const supervisorExists = await SUPERVISORS.findOne({ _id: supervisorId });

    if (supervisorExists === null) {
      res.status(400).json({ message: "No supervisor was found with that id" });
      return;
    }

    const studentExists = await STUDENTS.findOne({ studentCode });

    if (studentExists === null) {
      res
        .status(400)
        .json({ message: "No student was found with that student code" });
      return;
    }

    await DEFENSE_LIST.updateOne(
      { studentCode },
      { supervisorId },
      { upsert: true }
    );

    res
      .status(200)
      .json({ message: "Defense supervisor was successfully assigned" });
    return;
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
      res.status(400).json({ message: "Invalid supervisor id" });
      return;
    }

    if (/\w+\-\d+\-\d+/.test(studentCode) === false) {
      res.status(400).json({ message: "Invalid student code" });
      return;
    }

    const supervisorExists = await SUPERVISORS.findOne({ _id: supervisorId });

    if (supervisorExists === null) {
      res.status(400).json({ message: "No supervisor was found with that id" });
      return;
    }

    const studentExists = await STUDENTS.findOne({ studentCode });

    if (studentExists === null) {
      res
        .status(400)
        .json({ message: "No studet was found with that student code" });
      return;
    }

    await INSPECTION_LIST.updateOne(
      { studentCode },
      { supervisorId },
      { upsert: true }
    );

    res
      .status(200)
      .json({ message: "Inspection supervisor was successfully assigned" });
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
  const { faculty, department, isMainCoordinator } = req.user;

  try {
    // get pagination parameters
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const { sortOrder, sortBy } = req.query;

    // Check if pagination parameters are provided
    const hasPagination = !isNaN(page) || !isNaN(limit);

    // Set default values only if pagination is requested
    const finalPage = hasPagination ? page || 1 : 1;
    const finalLimit = hasPagination ? limit || 10 : null; // null means no limit

    if (hasPagination) {
      if (finalPage < 1)
        return res.status(400).json({ message: "Invalid page number" });
      if (finalLimit < 1)
        return res.status(400).json({ message: "Invalid limit" });
      if (finalLimit > 50)
        return res
          .status(400)
          .json({ message: "Limit too large, maximum allowed limit is 50" });
    }

    let sortQuery = [
      { $sort: { "company.LGA": -1 } }, // Always keep LGA sorted in descending order
    ];

    const validSortOrder = ["asc", "desc"];
    const validSortBy = ["course"];

    if (
      sortOrder &&
      validSortOrder.includes(sortOrder.toLowerCase()) &&
      sortBy &&
      validSortBy.includes(sortBy)
    ) {
      sortQuery.unshift({
        // Apply course sorting before LGA sorting
        $sort: {
          [sortBy]: sortOrder.toLowerCase() === "asc" ? 1 : -1,
        },
      });
    }

    // Build match criteria based on coordinator type
    // Normalize faculty and department to lowercase to match database schema
    const matchCriteria = {
      faculty:
        typeof faculty === "string" ? faculty.toLowerCase().trim() : faculty,
    };

    // If coordinator is not main coordinator, filter by department
    if (!isMainCoordinator && department) {
      matchCriteria.department =
        typeof department === "string"
          ? department.toLowerCase().trim()
          : department;
    }

    const pipeline = [
      {
        $match: matchCriteria,
      },
      {
        $project: {
          password: 0,
          validation_secret: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "company",
          pipeline: [
            {
              $project: {
                name: 1,
                address: 1,
                state: 1,
                LGA: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          company: { $arrayElemAt: ["$company", 0] },
        },
      },
      ...sortQuery, // Apply sorting here
      // Apply pagination only if requested
      ...(hasPagination
        ? [
            {
              $skip: (finalPage - 1) * finalLimit,
            },
            {
              $limit: finalLimit,
            },
          ]
        : []),
      {
        $lookup: {
          from: "grades",
          localField: "_id",
          foreignField: "studentId",
          as: "grade",
          pipeline: [
            {
              $project: { studentId: 0, __v: 0, createdAt: 0, updatedAt: 0 },
            },
          ],
        },
      },
      {
        $addFields: {
          grade: { $arrayElemAt: ["$grade", 0] },
        },
      },
      {
        $lookup: {
          from: "inspection_lists",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "inspectionInfo",
        },
      },
      {
        $addFields: {
          inspectionInfo: { $arrayElemAt: ["$inspectionInfo", 0] },
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "inspectionInfo.supervisorId",
          foreignField: "_id",
          as: "assignedSupervisorInfo",
          pipeline: [
            {
              $project: { firstName: 1, lastName: 1, phone: 1, email: 1 },
            },
          ],
        },
      },
      {
        $addFields: {
          assignedSupervisorInfo: {
            $arrayElemAt: ["$assignedSupervisorInfo", 0],
          },
        },
      },
      {
        $lookup: {
          from: "defense_lists",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "defenseInfo",
        },
      },
      {
        $addFields: {
          defenseInfo: { $arrayElemAt: ["$defenseInfo", 0] },
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "defenseInfo.supervisorId",
          foreignField: "_id",
          as: "defenseSupervisorInfo",
          pipeline: [
            {
              $project: { firstName: 1, lastName: 1, phone: 1, email: 1 },
            },
          ],
        },
      },
      {
        $addFields: {
          defenseSupervisorInfo: {
            $arrayElemAt: ["$defenseSupervisorInfo", 0],
          },
        },
      },
      {
        $project: {
          defenseInfo: 0,
        },
      },
    ];

    const students = await STUDENTS.aggregate(pipeline);

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    const totalStudents = await STUDENTS.countDocuments(matchCriteria);
    const csvString = jsonToCsvString(students);

    // Return appropriate response based on pagination
    if (hasPagination) {
      res.status(200).json({
        students,
        totalStudents,
        currentPage: finalPage,
        currentLimit: finalLimit,
      });
    } else {
      res.status(200).json({
        students,
        totalStudents,
      });
    }
  } catch (error) {
    console.error("Error fetching students:", error);
    handleError(error, res);
  }
};

/**
 * Returns a list containing all students
 * @param {request} req
 * @param {response} res
 */
const download_all_students = async function (req, res) {
  const { faculty, department, isMainCoordinator } = req.user;
  // Put this at the top or in a separate utils file
  function flattenObject(obj, parentKey = "", acc = {}) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const propName = parentKey ? `${parentKey}.${key}` : key;
        const value = obj[key];

        // Skip MongoDB ObjectId methods and internal properties
        if (
          key.startsWith("_") ||
          key.startsWith("studentCode") ||
          typeof value === "function"
        ) {
          continue;
        }

        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // Recursively flatten nested objects
          flattenObject(value, propName, acc);
        } else {
          // Replace commas with spaces in string values
          if (typeof value === "string") {
            acc[propName] = value.replace(/,/g, " ").replace(/\n/g, " ");
          } else {
            // Assign non-string values directly
            acc[propName] = value;
          }
        }
      }
    }
    return acc;
  }

  try {
    const { sortOrder, sortBy } = req.query;

    let sortQuery = [
      { $sort: { "company.LGA": -1 } }, // Always keep LGA sorted in descending order
    ];

    const validSortOrder = ["asc", "desc"];
    const validSortBy = ["course"];

    if (
      sortOrder &&
      validSortOrder.includes(sortOrder.toLowerCase()) &&
      sortBy &&
      validSortBy.includes(sortBy)
    ) {
      sortQuery.unshift({
        // Apply course sorting before LGA sorting
        $sort: {
          [sortBy]: sortOrder.toLowerCase() === "asc" ? 1 : -1,
        },
      });
    }

    // Build match criteria based on coordinator type
    // Normalize faculty and department to lowercase to match database schema
    const matchCriteria = {
      faculty:
        typeof faculty === "string" ? faculty.toLowerCase().trim() : faculty,
    };

    // If coordinator is not main coordinator, filter by department
    if (!isMainCoordinator && department) {
      matchCriteria.department =
        typeof department === "string"
          ? department.toLowerCase().trim()
          : department;
    }

    const pipeline = [
      {
        $match: matchCriteria,
      },
      {
        $project: {
          password: 0,
          validation_secret: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "company",
          pipeline: [
            {
              $project: {
                name: 1,
                address: 1,
                state: 1,
                LGA: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          company: { $arrayElemAt: ["$company", 0] },
        },
      },
      ...sortQuery,
      {
        $lookup: {
          from: "grades",
          localField: "_id",
          foreignField: "studentId",
          as: "grade",
          pipeline: [
            {
              $project: { studentId: 0, __v: 0, createdAt: 0, updatedAt: 0 },
            },
          ],
        },
      },
      {
        $addFields: {
          grade: { $arrayElemAt: ["$grade", 0] },
        },
      },
      {
        $lookup: {
          from: "inspection_lists",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "inspectionInfo",
        },
      },
      {
        $addFields: {
          inspectionInfo: {
            $arrayElemAt: ["$inspectionInfo", 0],
          },
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "inspectionInfo.supervisorId",
          foreignField: "_id",
          as: "assignedSupervisorInfo",
          pipeline: [
            {
              $project: { firstName: 1, lastName: 1 },
            },
          ],
        },
      },
      {
        $addFields: {
          assignedSupervisorInfo: {
            $arrayElemAt: ["$assignedSupervisorInfo", 0],
          },
        },
      },
    ];

    const students = await STUDENTS.aggregate(pipeline);

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    const totalStudents = await STUDENTS.countDocuments(matchCriteria);
    // Convert the result to a CSV string

    // Set headers and send CSV response
    const flattenedStudents = students.map((student) => flattenObject(student));

    const csvString = jsonToCsvString(flattenedStudents);

    // Now send the CSV string as usual:
    res
      .status(200)
      .header("Content-Type", "text/csv")
      .header(
        "Content-Disposition",
        "attachment; filename=student_inspection_list.csv"
      )
      .send(csvString);
  } catch (error) {
    console.error("Error fetching students:", error);
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
      res.status(400).json({ message: "Invalid id" });
      return;
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
            $concat: [
              "$firstName",
              " ",
              {
                $ifNull: [
                  {
                    $concat: ["$middleName", " "],
                  },
                  "",
                ],
              },
              "$lastName",
            ],
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
          as: "coordinatorLookup",
        },
      },
      {
        $unwind: {
          path: "$coordinatorLookup",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "grades.lastUpdatedBy",
          foreignField: "_id",
          as: "supervisorLookup",
        },
      },
      {
        $unwind: {
          path: "$supervisorLookup",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          lastUpdatedBy: {
            $ifNull: ["$coordinatorLookup", "$supervisorLookup"],
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
        $unset: ["coordinatorLookup", "supervisorLookup", "lastUpdatedBy"],
      },
    ]);

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
 * Returns a list containing all students and thier assigned supervisors for defense
 * @param {request} req
 * @param {response} res
 */
const get_defense_list = async function (req, res) {
  const { faculty, department, isMainCoordinator } = req.user;

  try {
    // Build match criteria based on coordinator type
    // Normalize faculty and department to lowercase to match database schema
    const matchCriteria = {
      faculty:
        typeof faculty === "string" ? faculty.toLowerCase().trim() : faculty,
    };

    // If coordinator is not main coordinator, filter by department
    if (!isMainCoordinator && department) {
      matchCriteria.department =
        typeof department === "string"
          ? department.toLowerCase().trim()
          : department;
    }

    const pipeline = [
      {
        $lookup: {
          from: "students",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "studentDetails",
          pipeline: [
            {
              $match: matchCriteria,
            },
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
    ];

    const defenseList = await DEFENSE_LIST.aggregate(pipeline);

    if (defenseList.length === 0) {
      res.status(404).json({ message: "Defense list is empty" });
      return;
    }

    res.status(200).json(defenseList);
    return;
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
  const { faculty, department, isMainCoordinator } = req.user;

  try {
    // Build match criteria based on coordinator type
    // Normalize faculty and department to lowercase to match database schema
    const matchCriteria = {
      faculty:
        typeof faculty === "string" ? faculty.toLowerCase().trim() : faculty,
    };

    // If coordinator is not main coordinator, filter by department
    if (!isMainCoordinator && department) {
      matchCriteria.department =
        typeof department === "string"
          ? department.toLowerCase().trim()
          : department;
    }

    const pipeline = [
      {
        $lookup: {
          from: "students",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "studentDetails",
          pipeline: [
            {
              $match: matchCriteria,
            },
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
    ];

    const inspectionList = await INSPECTION_LIST.aggregate(pipeline);

    if (inspectionList.length === 0) {
      res.status(404).json({ message: "Inspection list is empty" });
      return;
    }

    res.status(200).json(inspectionList);
    return;
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
      res
        .status(400)
        .json({ message: "You cannot set a deadline into the past" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(updatedBy)) {
      res.status(401).json({
        message:
          "Something went wrong while authenticating your request, re-authenticate and try again",
      });
      return;
    }

    // clears the entire collection
    await DEADLINE.deleteMany({});

    await DEADLINE.create({ time, updatedBy });

    res
      .status(200)
      .json({ message: "Registration deadline has been assigned" });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Gets the current registration deadline
 * @param {request} req
 * @param {response} res
 */
const get_registration_deadline = async function (req, res) {
  try {
    const deadline = await DEADLINE.findOne({}).sort({ createdAt: -1 });

    if (!deadline) {
      res.status(404).json({
        message: "No registration deadline has been set",
      });
      return;
    }

    res.status(200).json({
      message: "Registration deadline retrieved successfully",
      deadline: {
        time: deadline.time,
        updatedAt: deadline.updatedAt,
        updatedBy: deadline.updatedBy,
      },
    });
    return;
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
      res.status(404).json({
        message: "No weekly reports submission found for the specified student",
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
      mini_inspection: "miniInspectionScore",
      main_inspection: "mainInspectionScore",
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

    // Validate score ranges (mini: 0-20, main: 0-10)
    if (type == "mini_inspection" && (score > 20 || score < 0)) {
      res
        .status(400)
        .json({ message: "mini_inspection score must be between 0 and 20" });
      return;
    }
    if (type == "main_inspection" && (score > 10 || score < 0)) {
      res
        .status(400)
        .json({ message: "main_inspection score must be between 0 and 10" });
      return;
    }

    if (type == "reports" && (score > 20 || score < 0)) {
      res
        .status(400)
        .json({ message: "reports score must be between 0 and 20" });
      return;
    }
    if (type == "inspection" && (score > 30 || score < 0)) {
      res
        .status(400)
        .json({ message: "inspection score must be between 0 and 30" });
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

    // Prepare update object
    let updateObj = { [validTypes[type]]: score, lastUpdatedBy };

    // If updating mini or main inspection, recalculate the total inspectionScore
    if (type === "mini_inspection" || type === "main_inspection") {
      const currentMiniScore = studentGrade?.miniInspectionScore || 0;
      const currentMainScore = studentGrade?.mainInspectionScore || 0;

      // Calculate new inspectionScore
      if (type === "mini_inspection") {
        updateObj.inspectionScore = score + currentMainScore;
      } else {
        updateObj.inspectionScore = currentMiniScore + score;
      }
    }

    const response = await GRADES.updateOne(
      { studentId },
      { $set: updateObj },
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
      res.status(500).json({
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
  const { _id: lastUpdatedBy, faculty } = req.user;

  try {
    // Update all grades with total
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
      res.status(500).json({
        message: "Action failed, please try again or contact support",
      });
      return;
    }

    // Get all grades with student information for the coordinator's faculty
    const gradesData = await GRADES.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      {
        $unwind: {
          path: "$studentInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "studentInfo.faculty": faculty,
        },
      },
      {
        $project: {
          _id: 0,
          firstName: { $ifNull: ["$studentInfo.firstName", ""] },
          middleName: { $ifNull: ["$studentInfo.middleName", ""] },
          lastName: { $ifNull: ["$studentInfo.lastName", ""] },
          matricNumber: { $ifNull: ["$studentInfo.matricNo", ""] },
          department: { $ifNull: ["$studentInfo.department", ""] },
          miniInspectionScore: { $ifNull: ["$miniInspectionScore", 0] },
          mainInspectionScore: { $ifNull: ["$mainInspectionScore", 0] },
          inspectionScore: { $ifNull: ["$inspectionScore", 0] },
          weeklyReportsScore: { $ifNull: ["$weeklyReportsScore", 0] },
          defenseScore: { $ifNull: ["$defenseScore", 0] },
          total: { $ifNull: ["$total", 0] },
        },
      },
      {
        $sort: { matricNumber: 1 },
      },
    ]);

    // Format the data for CSV
    const formatName = (str) => {
      if (!str) return "";
      return str
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    };

    const formattedData = gradesData.map((item) => {
      // Combine first, middle, and last name
      const firstName = formatName(item.firstName || "");
      const middleName = formatName(item.middleName || "");
      const lastName = formatName(item.lastName || "");
      const fullName = [firstName, middleName, lastName]
        .filter((name) => name.trim() !== "")
        .join(" ");

      // Format department (capitalize first letter of each word)
      const formattedDepartment = item.department
        ? item.department
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ")
        : "";

      return {
        name: fullName,
        matricNumber: item.matricNumber || "",
        department: formattedDepartment,
        miniInspectionScore: item.miniInspectionScore,
        mainInspectionScore: item.mainInspectionScore,
        inspectionScore: item.inspectionScore,
        weeklyReportsScore: item.weeklyReportsScore,
        defenseScore: item.defenseScore,
        total: item.total,
      };
    });

    // If no students found, still return success message but no CSV
    if (formattedData.length === 0) {
      res.status(200).json({
        message:
          "Grades have been collated successfully, but no students found in your faculty",
      });
      return;
    }

    // Convert to CSV and send as response
    const csvString = jsonToCsvString(formattedData);

    res
      .status(200)
      .header("Content-Type", "text/csv")
      .header(
        "Content-Disposition",
        `attachment; filename=grades_${faculty}_${
          new Date().toISOString().split("T")[0]
        }.csv`
      )
      .send(csvString);
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
 * Deletes a specific form
 * @param {request} req
 * @param {response} res
 */
const delete_form = async function (req, res) {
  const { formId, publicId } = req.query;

  try {
    if (mongoose.Types.ObjectId.isValid(formId) == false) {
      res.status(400).json({ message: "Invalid form id" });
      return;
    }

    // I need some part of the form below
    const form = await FORMS.findById(formId);

    if (form == null) {
      res.status(404).json({ message: "Form not found" });
      return;
    }

    await FORMS.deleteOne({ _id: ObjectId(formId) });

    // Delete local file if it exists
    if (form.pathToFile) {
      const filePath = path.join(__dirname, "..", form.pathToFile);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }

    res.status(201).json({ message: "Form has been deleted" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Escapes special regex characters in a string for safe use in $regex
 * @param {string} str - The string to escape
 * @returns {string} - Escaped string safe for regex
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Searches for students by firstName, lastName, middleName
 * Uses regex-based search (works without Atlas Search index)
 * @param {request} req
 * @param {response} res
 */
const search_for_students = async function (req, res) {
  const { faculty, department, isMainCoordinator } = req.user;

  try {
    const { q: searchQuery } = req.query;

    if (!searchQuery) {
      res.status(400).json({ message: "Please specify a search query" });
      return;
    }

    if (searchQuery.length < 3) {
      res
        .status(400)
        .json({ message: "Search query must be at least 3 characters long" });
      return;
    }

    // Build match criteria based on coordinator type
    // Normalize faculty and department to lowercase to match database schema
    const matchCriteria = {
      faculty:
        typeof faculty === "string" ? faculty.toLowerCase().trim() : faculty,
    };

    // If coordinator is not main coordinator, filter by department
    if (!isMainCoordinator && department) {
      matchCriteria.department =
        typeof department === "string"
          ? department.toLowerCase().trim()
          : department;
    }

    // Regex-based search: case-insensitive match on firstName, lastName, middleName
    // Works without Atlas Search index; escapes user input for safety
    const escapedQuery = escapeRegex(searchQuery.trim());
    const searchRegex = new RegExp(escapedQuery, "i");
    const nameSearchCriteria = {
      $or: [
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } },
        { middleName: { $regex: searchRegex } },
      ],
    };

    const pipeline = [
      {
        $match: {
          $and: [matchCriteria, nameSearchCriteria],
        },
      },
      {
        $project: {
          password: 0,
          validation_secret: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      },
      {
        $lookup: {
          from: "grades",
          localField: "_id",
          foreignField: "studentId",
          as: "grade",
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
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "company",
          pipeline: [
            {
              $project: {
                name: 1,
                address: 1,
                state: 1,
                LGA: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          grade: {
            $arrayElemAt: ["$grade", 0],
          },
          company: {
            $arrayElemAt: ["$company", 0],
          },
        },
      },
      {
        $lookup: {
          from: "inspection_lists",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "inspectionInfo",
        },
      },
      {
        $addFields: {
          inspectionInfo: { $arrayElemAt: ["$inspectionInfo", 0] },
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "inspectionInfo.supervisorId",
          foreignField: "_id",
          as: "assignedSupervisorInfo",
          pipeline: [
            {
              $project: { firstName: 1, lastName: 1, phone: 1, email: 1 },
            },
          ],
        },
      },
      {
        $addFields: {
          assignedSupervisorInfo: {
            $arrayElemAt: ["$assignedSupervisorInfo", 0],
          },
        },
      },
    ];

    const students = await STUDENTS.aggregate(pipeline);

    if (students.length === 0) {
      res.status(404).json({ message: "No students found" });
      return;
    }

    res.status(200).json({
      students,
      nHits: students.length,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * This retrieves the data for all students and returns it as a csv file ready for download
 * @param {request} req
 * @param {response} res
 */
const download_all_student_data = async function (req, res) {
  const { faculty, department, isMainCoordinator } = req.user;

  try {
    // Build match criteria based on coordinator type
    // Normalize faculty and department to lowercase to match database schema
    const matchCriteria = {
      faculty:
        typeof faculty === "string" ? faculty.toLowerCase().trim() : faculty,
    };

    // If coordinator is not main coordinator, filter by department
    if (!isMainCoordinator && department) {
      matchCriteria.department =
        typeof department === "string"
          ? department.toLowerCase().trim()
          : department;
    }

    const students = await STUDENTS.aggregate([
      {
        $match: matchCriteria,
      },
      {
        $project: {
          password: 0,
          validation_secret: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
        },
      },
      {
        $lookup: {
          from: "grades",
          localField: "_id",
          foreignField: "studentId",
          as: "grade",
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
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "company",
          pipeline: [
            {
              $project: {
                name: 1,
                address: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          grade: {
            $arrayElemAt: ["$grade", 0],
          },
          company: {
            $arrayElemAt: ["$company", 0],
          },
        },
      },
      {
        $addFields: {
          accountNo: "$bankDetails.accountNumber",
          bankname: "$bankDetails.name",
          sortCode: "$bankDetails.sortCode",
          companyName: "$company.name",
          companyAddress: "$company.address",
          miniInspectionScore: "$grade.miniInspectionScore",
          mainInspectionScore: "$grade.mainInspectionScore",
          inspectionScore: "$grade.inspectionScore",
          weeklyReportsScore: "$grade.weeklyReportsScore",
          defenseScore: "$grade.defenseScore",
          totalScore: "$grade.total",
          lastUpdatedBy: "$grade.lastUpdatedBy",
        },
      },
      {
        $project: {
          bankDetails: 0,
          company: 0,
          grade: 0,
          _id: 0,
        },
      },
    ]);

    if (students.length === 0) {
      res.status(404).json({ message: "No students found" });
      return;
    }

    const csvString = jsonToCsvString(students);

    res
      .status(200)
      .header("Content-Type", "text/csv")
      .header("Content-Disposition", "attachment; filename=students.csv")
      .send(csvString);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * This allows coordinators update the information for a particular student
 * @param {request} req
 * @param {response} res
 */
const update_student_details = async function (req, res) {
  try {
    const session = await mongoose.startSession({
      defaultTransactionOptions: {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
      },
    });

    let sentResponse = false;

    await session.withTransaction(async () => {
      try {
        const allowedFields = [
          "firstName",
          "middleName",
          "lastName",
          "course",
          "sex",
          "level",
          "faculty",
          "phone",
          "accountNumber",
          "bankName",
          "sortCode",
          "company",
        ];
        const allowedCompanyFields = [
          "name",
          "address",
          "state",
          "LGA",
          "email",
          "phone",
          "assignedDepartment",
          "jobDescription",
          "resumptionDate",
          "expectedEndDate",
        ];

        const update = req.body;

        if (
          !update ||
          typeof update !== "object" ||
          Object.keys(update).length === 0
        ) {
          throw {
            message: "Please specify all the fields to update",
            code: 400,
            type: "frontend_error",
          };
        }

        // check if all fields are valid
        const fields = Object.keys(update);
        // this checks to ensure that all fields specified are allowed and that they have values
        const isValid = fields.every((field) => {
          // middle name is optional so it doesn't need to have a value for it
          if (field === "middleName") {
            return allowedFields.includes(field);
          }

          return update[field] && allowedFields.includes(field);
        });

        if (!isValid) {
          throw {
            message: "Invalid or incomplete field(s) specified",
            code: 400,
            type: "frontend_error",
          };
        }

        // convert the fields to their appropriate paths
        if (update.hasOwnProperty("accountNumber")) {
          update["bankDetails.accountNumber"] = update.accountNumber;
          delete update.accountNumber;
        }

        if (update.hasOwnProperty("bankName")) {
          update["bankDetails.name"] = update.bankName;
          delete update.bankName;
        }

        if (update.hasOwnProperty("sortCode")) {
          update["bankDetails.sortCode"] = update.sortCode;
          delete update.sortCode;
        }

        const { id: studentId } = req.params;
        const studentDetails = await STUDENTS.findOne(
          { _id: studentId },
          {},
          { session }
        );

        // handle company update
        if (update.hasOwnProperty("company")) {
          const companyDetails = JSON.parse(JSON.stringify(update.company)); // make a no-refrence copy
          delete update.company;

          // verify company values are correct
          const companyFields = Object.keys(companyDetails);
          const isValid = companyFields.every((field) => {
            return (
              allowedCompanyFields.includes(field) && companyDetails[field]
            );
          });

          if (!isValid) {
            throw {
              message: "Invalid or incomplete company field(s) specified",
              code: 400,
              type: "frontend_error",
            };
          }

          // update company
          await COMPANIES.updateOne(
            { studentCode: studentDetails.studentCode },
            companyDetails,
            { session }
          );
        }

        await STUDENTS.updateOne({ _id: studentId }, update, { session });

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();

        if (error.type === "frontend_error") {
          res.status(error.code).json({ message: error.message });
          sentResponse = true;
          return;
        }

        throw error;
      } finally {
        await session.endSession();
      }
    });

    if (!sentResponse) {
      res.status(200).json({
        message: "Student profile updated successfully",
      });
    }
  } catch (error) {
    handleError(error, res);
  }
};

const assign_score_for_student_weekly_report = async function (req, res) {
  try {
    const final_result = await WEEKLYREPORTS.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "studentInfo",
        },
      },
      {
        $unwind: "$studentInfo",
      },
      {
        $group: {
          _id: "$studentCode",
          reportCount: { $sum: 1 },
          firstName: { $first: "$studentInfo.firstName" },
          lastName: { $first: "$studentInfo.lastName" },
          course: { $first: "$studentInfo.course" },
          matricNumber: { $first: "$studentInfo.matricNo" },
        },
      },
      {
        $project: {
          _id: 0,
          studentCode: "$_id",
          firstName: 1,
          lastName: 1,
          matricNumber: 1,
          course: 1, // Added course to the projection
          reportCount: 1,
          marks: {
            $switch: {
              branches: [
                {
                  case: { $gte: ["$reportCount", 10] },
                  then: 20,
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$reportCount", 8] },
                      { $lt: ["$reportCount", 10] },
                    ],
                  },
                  then: 17,
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$reportCount", 6] },
                      { $lt: ["$reportCount", 8] },
                    ],
                  },
                  then: 14,
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$reportCount", 5] },
                      { $lt: ["$reportCount", 6] },
                    ],
                  },
                  then: 10,
                },
              ],
              default: 0,
            },
          },
        },
      },
    ]);

    // Update the grades collection with the calculated weeklyReportsScore
    for (const student of final_result) {
      // Find the student by studentCode to get their _id
      const studentDoc = await STUDENTS.findOne({
        studentCode: student.studentCode,
      });
      if (studentDoc) {
        // Update or create the grade record with the calculated weeklyReportsScore
        await GRADES.updateOne(
          { studentId: studentDoc._id },
          {
            $set: {
              weeklyReportsScore: student.marks,
              lastUpdatedBy: req.user._id,
            },
          },
          { upsert: true }
        );
      }
    }

    // Send the final result and the log data as the response
    res.status(200).json({
      message: "Student score calculated and updated successfully",
      data: final_result,
    });
  } catch (error) {
    console.error("Error in aggregation pipeline: ", error);
    handleError(error, res);
  }
};

/**
 * Fetches calculated weekly report scores without storing them in the database
 * @param {request} req
 * @param {response} res
 */
const fetch_weekly_report_scores = async function (req, res) {
  const { faculty, department, isMainCoordinator } = req.user;

  const matchCriteria = {
    "studentInfo.faculty":
      typeof faculty === "string" ? faculty.toLowerCase().trim() : faculty,
  };

  if (!isMainCoordinator && department) {
    matchCriteria["studentInfo.department"] =
      typeof department === "string"
        ? department.toLowerCase().trim()
        : department;
  }

  try {
    const final_result = await WEEKLYREPORTS.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "studentInfo",
        },
      },
      {
        $unwind: "$studentInfo",
      },
      {
        $match: matchCriteria,
      },
      {
        $group: {
          _id: "$studentCode",
          reportCount: { $sum: 1 },
          firstName: { $first: "$studentInfo.firstName" },
          lastName: { $first: "$studentInfo.lastName" },
          course: { $first: "$studentInfo.course" },
          matricNumber: { $first: "$studentInfo.matricNo" },
        },
      },
      {
        $project: {
          _id: 0,
          studentCode: "$_id",
          firstName: 1,
          lastName: 1,
          matricNumber: 1,
          course: 1,
          reportCount: 1,
          marks: {
            $switch: {
              branches: [
                {
                  case: { $gte: ["$reportCount", 10] },
                  then: 20,
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$reportCount", 8] },
                      { $lt: ["$reportCount", 10] },
                    ],
                  },
                  then: 17,
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$reportCount", 6] },
                      { $lt: ["$reportCount", 8] },
                    ],
                  },
                  then: 14,
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$reportCount", 5] },
                      { $lt: ["$reportCount", 6] },
                    ],
                  },
                  then: 10,
                },
              ],
              default: 0,
            },
          },
        },
      },
    ]);

    // Send the calculated scores without storing them
    res.status(200).json({
      message: "Weekly report scores calculated successfully",
      data: final_result,
    });
  } catch (error) {
    console.error("Error in aggregation pipeline: ", error);
    handleError(error, res);
  }
};

const download_csv_score_for_student_weekly_report = async function (req, res) {
  try {
    // Perform the aggregation
    const student_score = await WEEKLYREPORTS.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "studentInfo",
        },
      },
      {
        $unwind: "$studentInfo",
      },
      {
        $group: {
          _id: "$studentCode",
          firstName: { $first: "$studentInfo.firstName" },
          lastName: { $first: "$studentInfo.lastName" },
          matricNumber: { $first: "$studentInfo.matricNo" },
          course: { $first: "$studentInfo.course" },
          reportCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          studentCode: "$_id",
          firstName: 1,
          lastName: 1,
          course: 1,
          matricNumber: 1,
          reportCount: 1,
          marks: {
            $switch: {
              branches: [
                {
                  case: { $gte: ["$reportCount", 10] },
                  then: 20,
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$reportCount", 8] },
                      { $lt: ["$reportCount", 10] },
                    ],
                  },
                  then: 17,
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$reportCount", 6] },
                      { $lt: ["$reportCount", 8] },
                    ],
                  },
                  then: 14,
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$reportCount", 5] },
                      { $lt: ["$reportCount", 6] },
                    ],
                  },
                  then: 10,
                },
              ],
              default: 0,
            },
          },
        },
      },
    ]);

    // Check if there are students
    if (student_score.length === 0) {
      return res.status(404).json({ message: "No student scores found" });
    }

    // Convert the result to a CSV string
    const csvString = jsonToCsvString(student_score);

    // Set headers and send CSV response
    res
      .status(200)
      .header("Content-Type", "text/csv")
      .header("Content-Disposition", "attachment; filename=student_scores.csv")
      .send(csvString);
  } catch (error) {
    console.error("Error in aggregation pipeline: ", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing the data" });
  }
};

/**
 * Downloads student names and their assigned inspection supervisor names as CSV
 * @param {request} req
 * @param {response} res
 */
const download_student_inspection_supervisors = async function (req, res) {
  const { faculty, department, isMainCoordinator } = req.user;

  try {
    // Build match criteria based on coordinator type
    // Normalize faculty and department to lowercase to match database schema
    const matchCriteria = {
      faculty:
        typeof faculty === "string" ? faculty.toLowerCase().trim() : faculty,
    };

    // If coordinator is not main coordinator, filter by department
    if (!isMainCoordinator && department) {
      matchCriteria.department =
        typeof department === "string"
          ? department.toLowerCase().trim()
          : department;
    }

    const pipeline = [
      {
        $match: matchCriteria,
      },
      {
        $project: {
          password: 0,
          validation_secret: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
        },
      },
      {
        $addFields: {
          studentName: {
            $concat: [
              "$firstName",
              " ",
              {
                $ifNull: [
                  {
                    $concat: ["$middleName", " "],
                  },
                  "",
                ],
              },
              "$lastName",
            ],
          },
        },
      },
      {
        $lookup: {
          from: "inspection_lists",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "inspectionInfo",
        },
      },
      {
        $addFields: {
          inspectionInfo: { $arrayElemAt: ["$inspectionInfo", 0] },
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "inspectionInfo.supervisorId",
          foreignField: "_id",
          as: "assignedSupervisorInfo",
          pipeline: [
            {
              $project: {
                supervisorName: {
                  $concat: ["$firstName", " ", "$lastName"],
                },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          assignedSupervisorInfo: {
            $arrayElemAt: ["$assignedSupervisorInfo", 0],
          },
        },
      },
      {
        $project: {
          studentName: 1,
          supervisorName: "$assignedSupervisorInfo.supervisorName",
          _id: 0,
        },
      },
    ];

    const students = await STUDENTS.aggregate(pipeline);

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    const csvString = jsonToCsvString(students);

    res
      .status(200)
      .header("Content-Type", "text/csv")
      .header(
        "Content-Disposition",
        "attachment; filename=student_inspection_supervisors.csv"
      )
      .send(csvString);
  } catch (error) {
    console.error("Error fetching student inspection supervisors:", error);
    handleError(error, res);
  }
};

/**
 * Bulk assign multiple students to one inspection supervisor
 * @param {request} req
 * @param {response} res
 */
const bulk_assign_inspection_supervisor = async function (req, res) {
  const { supervisorId, studentCodes } = req.body;

  try {
    // Validate supervisorId
    if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
      res.status(400).json({ message: "Invalid supervisor id" });
      return;
    }

    // Validate studentCodes array
    if (!Array.isArray(studentCodes) || studentCodes.length === 0) {
      res.status(400).json({
        message: "studentCodes must be a non-empty array",
      });
      return;
    }

    // Check if supervisor exists
    const supervisorExists = await SUPERVISORS.findOne({ _id: supervisorId });

    if (supervisorExists === null) {
      res.status(400).json({ message: "No supervisor was found with that id" });
      return;
    }

    let assignedCount = 0;
    let failedAssignments = [];

    // Process each student code
    for (const studentCode of studentCodes) {
      try {
        // Validate student code format
        if (/\w+\-\d+\-\d+/.test(studentCode) === false) {
          failedAssignments.push({
            studentCode,
            reason: "Invalid student code format",
          });
          continue;
        }

        // Check if student exists
        const studentExists = await STUDENTS.findOne({ studentCode });

        if (studentExists === null) {
          failedAssignments.push({
            studentCode,
            reason: "Student not found",
          });
          continue;
        }

        // Assign supervisor to student
        await INSPECTION_LIST.updateOne(
          { studentCode },
          { supervisorId },
          { upsert: true }
        );

        assignedCount++;
      } catch (error) {
        failedAssignments.push({
          studentCode,
          reason: error.message,
        });
      }
    }

    res.status(200).json({
      message: "Bulk inspection supervisor assignment completed",
      totalRequested: studentCodes.length,
      successfulAssignments: assignedCount,
      failedAssignments:
        failedAssignments.length > 0 ? failedAssignments : undefined,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Bulk assign multiple students to one defense supervisor
 * @param {request} req
 * @param {response} res
 */
const bulk_assign_defense_supervisor = async function (req, res) {
  const { supervisorId, studentCodes } = req.body;

  try {
    // Validate supervisorId
    if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
      res.status(400).json({ message: "Invalid supervisor id" });
      return;
    }

    // Validate studentCodes array
    if (!Array.isArray(studentCodes) || studentCodes.length === 0) {
      res.status(400).json({
        message: "studentCodes must be a non-empty array",
      });
      return;
    }

    // Check if supervisor exists
    const supervisorExists = await SUPERVISORS.findOne({ _id: supervisorId });

    if (supervisorExists === null) {
      res.status(400).json({ message: "No supervisor was found with that id" });
      return;
    }

    let assignedCount = 0;
    let failedAssignments = [];

    // Process each student code
    for (const studentCode of studentCodes) {
      try {
        // Validate student code format
        if (/\w+\-\d+\-\d+/.test(studentCode) === false) {
          failedAssignments.push({
            studentCode,
            reason: "Invalid student code format",
          });
          continue;
        }

        // Check if student exists
        const studentExists = await STUDENTS.findOne({ studentCode });

        if (studentExists === null) {
          failedAssignments.push({
            studentCode,
            reason: "Student not found",
          });
          continue;
        }

        // Assign supervisor to student
        await DEFENSE_LIST.updateOne(
          { studentCode },
          { supervisorId },
          { upsert: true }
        );

        assignedCount++;
      } catch (error) {
        failedAssignments.push({
          studentCode,
          reason: error.message,
        });
      }
    }

    res.status(200).json({
      message: "Bulk defense supervisor assignment completed",
      totalRequested: studentCodes.length,
      successfulAssignments: assignedCount,
      failedAssignments:
        failedAssignments.length > 0 ? failedAssignments : undefined,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Bulk add siwes inspecor
 * @param {request} req
 * @param {response} res
 */
const assign_right_defense_supervisor = async function (req, res) {
  try {
    // Get all students who have inspection supervisors
    const studentsWithInspectionSupervisors = await INSPECTION_LIST.find(
      {},
      {
        studentCode: 1,
        supervisorId: 1,
      }
    );

    if (studentsWithInspectionSupervisors.length === 0) {
      res.status(404).json({
        message: "No students with inspection supervisors found",
      });
      return;
    }

    let defenseAssignedCount = 0;
    const errors = [];

    // Process each student with inspection supervisor
    for (const inspectionAssignment of studentsWithInspectionSupervisors) {
      try {
        // Check if this student already has a defense supervisor
        const existingDefenseAssignment = await DEFENSE_LIST.findOne({
          studentCode: inspectionAssignment.studentCode,
        });

        // If no defense supervisor assigned, make the inspection supervisor the defense supervisor too
        if (!existingDefenseAssignment) {
          await DEFENSE_LIST.updateOne(
            { studentCode: inspectionAssignment.studentCode },
            {
              supervisorId: inspectionAssignment.supervisorId,
              assignedDate: new Date(),
            },
            { upsert: true }
          );
          defenseAssignedCount++;
        }
      } catch (error) {
        console.error(
          `Error assigning defense supervisor for student ${inspectionAssignment.studentCode}:`,
          error
        );
        errors.push({
          studentCode: inspectionAssignment.studentCode,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      message: "Defense supervisors assignment completed",
      totalStudentsWithInspectionSupervisors:
        studentsWithInspectionSupervisors.length,
      defenseAssignments: defenseAssignedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in assign_siwes_inspectors:", error);
    handleError(error, res);
  }
};

/**
 * Assigns defense supervisors to students based on their course
 * @param {request} req
 * @param {response} res
 */
const assign_defense_supervisor_by_course = async function (req, res) {
  try {
    // Get all students
    const students = await STUDENTS.find({}, { studentCode: 1, course: 1 });

    if (students.length === 0) {
      res.status(404).json({
        message: "No students found",
      });
      return;
    }

    // Course to supervisor mapping
    const courseSupervisorMapping = {
      "software engineering": "65d7332e2f6747921841c438", // amos awoniyi
      "computer science": "65d7290e2f6747921841c3d2", // oluwasefunmi famodimu
      "information technology": "65d736432f6747921841c45d", // oluwaseyi adediran
      "computer technology": "65df11f6308eb07ae2ab6e0b", // oluwayemisi fatade
      "computer information systems": "65df11f6308eb07ae2ab6e0b", // oluwayemisi fatade
    };

    // Default supervisor (amos awoniyi)
    const defaultSupervisorId = "65d7332e2f6747921841c438";

    let defenseAssignedCount = 0;
    let defenseUpdatedCount = 0;
    const errors = [];

    // Process each student
    for (const student of students) {
      try {
        // Get the appropriate supervisor based on course
        const courseLower = student.course.toLowerCase().trim();
        const supervisorId =
          courseSupervisorMapping[courseLower] || defaultSupervisorId;

        // Check if this student already has a defense supervisor
        const existingDefenseAssignment = await DEFENSE_LIST.findOne({
          studentCode: student.studentCode,
        });

        if (!existingDefenseAssignment) {
          // Create new defense assignment
          await DEFENSE_LIST.create({
            studentCode: student.studentCode,
            supervisorId: supervisorId,
            assignedDate: new Date(),
          });
          defenseAssignedCount++;
        } else if (
          existingDefenseAssignment.supervisorId.toString() !== supervisorId
        ) {
          // Update existing defense assignment if supervisor is different
          await DEFENSE_LIST.updateOne(
            { studentCode: student.studentCode },
            {
              supervisorId: supervisorId,
              assignedDate: new Date(),
            }
          );
          defenseUpdatedCount++;
        }
      } catch (error) {
        console.error(
          `Error assigning defense supervisor for student ${student.studentCode}:`,
          error
        );
        errors.push({
          studentCode: student.studentCode,
          course: student.course,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      message: "Defense supervisors assignment by course completed",
      totalStudents: students.length,
      newDefenseAssignments: defenseAssignedCount,
      updatedDefenseAssignments: defenseUpdatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in assign_defense_supervisor_by_course:", error);
    handleError(error, res);
  }
};

/**
 * Allows coordinator to change a student's password by email
 * @param {request} req
 * @param {response} res
 */
const change_student_password = async function (req, res) {
  let { email, newPassword } = req.body;

  // Validate and trim inputs
  if (typeof email === "string") {
    email = email.trim().toLowerCase();
  }

  if (typeof newPassword === "string") {
    newPassword = newPassword.trim();
  }

  // Validate required fields
  if (!email || !newPassword) {
    res.status(400).json({
      message: "Incomplete request, please provide email and newPassword",
    });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      message: "Invalid email format",
    });
    return;
  }

  // Validate password length
  if (newPassword.length < 6) {
    res.status(400).json({
      message: "Password must be at least 6 characters long",
    });
    return;
  }

  try {
    // Find student by email
    const student = await STUDENTS.findOne({ email });

    if (!student) {
      res.status(404).json({
        message: "Student not found with the provided email",
      });
      return;
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update student password
    const { modifiedCount } = await STUDENTS.updateOne(
      { _id: student._id },
      { password: hashedPassword }
    );

    if (!modifiedCount) {
      res.status(500).json({
        message: "Something went wrong, please try again",
      });
      return;
    }

    res.status(200).json({
      message: "Student password changed successfully",
      studentEmail: email,
    });
  } catch (error) {
    console.error("Error in change_student_password:", error);
    handleError(error, res);
  }
};

/**
 * Update student details by studentCode (Coordinator only)
 * @param {request} req
 * @param {response} res
 */
const update_student_details_by_code = async function (req, res) {
  try {
    const { studentCode, email, matricNo } = req.body;

    // Validate required fields
    if (!studentCode) {
      res.status(400).json({
        message: "Student code is required",
      });
      return;
    }

    // At least one field to update must be provided
    if (!email && !matricNo) {
      res.status(400).json({
        message: "Please provide at least one field to update (email or matricNo)",
      });
      return;
    }

    // Find student by studentCode
    const student = await STUDENTS.findOne({ studentCode });

    if (!student) {
      res.status(404).json({
        message: "Student not found with the provided student code",
      });
      return;
    }

    // Prepare update object
    const updateFields = {};

    // Validate and add email if provided
    if (email) {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(trimmedEmail)) {
        res.status(400).json({
          message: "Invalid email format",
        });
        return;
      }

      // Check if email is already taken by another student
      const existingStudentWithEmail = await STUDENTS.findOne({
        email: trimmedEmail,
        _id: { $ne: student._id },
      });

      if (existingStudentWithEmail) {
        res.status(400).json({
          message: "Email is already taken by another student",
        });
        return;
      }

      updateFields.email = trimmedEmail;
    }

    // Validate and add matricNo if provided
    if (matricNo) {
      const trimmedMatricNo = matricNo.trim().toLowerCase();
      
      if (trimmedMatricNo.length < 7) {
        res.status(400).json({
          message: "Matric number must be at least 7 characters long",
        });
        return;
      }

      // Check if matricNo is already taken by another student
      const existingStudentWithMatricNo = await STUDENTS.findOne({
        matricNo: trimmedMatricNo,
        _id: { $ne: student._id },
      });

      if (existingStudentWithMatricNo) {
        res.status(400).json({
          message: "Matric number is already taken by another student",
        });
        return;
      }

      updateFields.matricNo = trimmedMatricNo;
    }

    // Update student details
    const { modifiedCount } = await STUDENTS.updateOne(
      { _id: student._id },
      { $set: updateFields }
    );

    if (!modifiedCount) {
      res.status(400).json({
        message: "No changes were made. The provided values may be the same as existing values.",
      });
      return;
    }

    res.status(200).json({
      message: "Student details updated successfully",
      studentCode: studentCode,
      updatedFields: Object.keys(updateFields),
    });
  } catch (error) {
    console.error("Error in update_student_details_by_code:", error);
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
  bulk_assign_inspection_supervisor,
  bulk_assign_defense_supervisor,
  get_all_students,
  download_all_students,
  get_a_student,
  set_registration_deadline,
  get_registration_deadline,
  get_weekly_reports,
  assign_grade,
  collate_grades,
  collate_all_grades,
  get_forms,
  delete_form,
  search_for_students,
  download_all_student_data,
  update_student_details,
  assign_score_for_student_weekly_report,
  fetch_weekly_report_scores,
  download_csv_score_for_student_weekly_report,
  download_student_inspection_supervisors,
  assign_right_defense_supervisor,
  assign_defense_supervisor_by_course,
  change_student_password,
  update_student_details_by_code,
};
