const SUPPORT = require("../models/support.model");
const STUDENTS = require("./../models/student.model");
const COMPANIES = require("../models/company.model");
const GRADES = require("../models/grade.model");
const WEEKLY_REPORTS = require("../models/weekly_report.model");
const INSPECTION_LIST = require("../models/inspection_list.model");
const DEFENSE_LIST = require("../models/defense_list.model");
const OTP = require("../models/otp.model");
const { handleError } = require("../utils/handleError");
const mongoose = require("mongoose");

/**
 * Creates a new support user
 * @param {request} req
 * @param {response} res
 */
const create_support = async function (req, res) {
  try {
    const support = await SUPPORT.create(req.body);

    res.status(201).json({
      message: "Support user created successfully",
      support: support._id,
    });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Gets all students (Support only - no filtering)
 * @param {request} req
 * @param {response} res
 */
const get_all_students = async function (req, res) {
  try {
    // Get pagination parameters
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

    // Support can view all students without filtering
    const matchCriteria = {};

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchCriteria },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "company",
        },
      },
      {
        $unwind: {
          path: "$company",
          preserveNullAndEmptyArrays: true,
        },
      },
      ...sortQuery,
      {
        $project: {
          password: 0,
          validation_secret: 0,
        },
      },
    ];

    // Add pagination if needed
    if (hasPagination && finalLimit) {
      pipeline.push(
        { $skip: (finalPage - 1) * finalLimit },
        { $limit: finalLimit }
      );
    }

    const students = await STUDENTS.aggregate(pipeline);

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    const totalStudents = await STUDENTS.countDocuments(matchCriteria);

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
 * Deletes a student and all related data (Support only)
 * @param {request} req
 * @param {response} res
 */
const delete_student = async function (req, res) {
  try {
    const { id } = req.params;

    // Check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid student id" });
      return;
    }

    // Find the student first
    const student = await STUDENTS.findOne({ _id: id });

    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const studentCode = student.studentCode;
      const studentId = student._id;
      const studentEmail = student.email;

      // Delete all related data in cascade
      // 1. Delete company (by studentCode)
      await COMPANIES.deleteMany({ studentCode }, { session });

      // 2. Delete grades (by studentId)
      await GRADES.deleteMany({ studentId }, { session });

      // 3. Delete weekly reports (by studentCode)
      await WEEKLY_REPORTS.deleteMany({ studentCode }, { session });

      // 4. Delete inspection list (by studentCode)
      await INSPECTION_LIST.deleteMany({ studentCode }, { session });

      // 5. Delete defense list (by studentCode)
      await DEFENSE_LIST.deleteMany({ studentCode }, { session });

      // 6. Delete OTP records (by email)
      await OTP.deleteMany({ email: studentEmail }, { session });

      // 7. Finally, delete the student
      const result = await STUDENTS.deleteOne({ _id: id }, { session });

      if (result.deletedCount === 0) {
        throw new Error("Failed to delete student");
      }

      await session.commitTransaction();

      res.status(200).json({
        message: "Student and all related data deleted successfully",
        deletedStudentId: id,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error deleting student:", error);
    handleError(error, res);
  }
};

module.exports = {
  create_support,
  get_all_students,
  delete_student,
};
