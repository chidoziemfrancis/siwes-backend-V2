const DIRECTORS = require("../models/director.model");
const COORDINATORS = require("../models/coordinator.model");
const SUPERVISORS = require("./../models/supervisor.model");
const STUDENTS = require("./../models/student.model");
const SCHOOLS = require("../models/school.model");
const DEPARTMENTS = require("../models/department.model");
const INSPECTION_LIST = require("../models/inspection_list.model");
const DEFENSE_LIST = require("../models/defense_list.model");
const { handleError } = require("../utils/handleError");
const { sendMailToDirectorEmail } = require("./mail.controller");
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
    // Store the plain password before it gets hashed by the pre-save hook
    const plainPassword = req.body.password;
    const { firstName, lastName, email } = req.body;

    // Create the director (password will be hashed by the pre-save hook)
    const director = await DIRECTORS.create(req.body);

    // Send email with login credentials to the new director
    try {
      await sendMailToDirectorEmail({
        email,
        firstName,
        lastName,
        password: plainPassword,
      });
      console.log(`Director registration email sent successfully to ${email}`);
    } catch (emailError) {
      console.error("Error sending director registration email:", emailError);
      // Note: We don't fail the director creation if email fails
      // The director is already created, we just log the email error
    }

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
 * Returns a list of all the supervisors with their assigned student counts
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

    // Calculate the number of assigned students for each supervisor
    const supervisorsWithCounts = await Promise.all(
      supervisors.map(async (supervisor) => {
        // Count students in inspection list
        const inspectionCount = await INSPECTION_LIST.countDocuments({
          supervisorId: supervisor._id,
        });

        // Count students in defense list
        const defenseCount = await DEFENSE_LIST.countDocuments({
          supervisorId: supervisor._id,
        });

        // Use a Set to avoid counting duplicate students (if a student is in both lists)
        const inspectionStudents = await INSPECTION_LIST.find(
          { supervisorId: supervisor._id },
          { studentCode: 1 }
        );
        const defenseStudents = await DEFENSE_LIST.find(
          { supervisorId: supervisor._id },
          { studentCode: 1 }
        );

        const uniqueStudentCodes = new Set([
          ...inspectionStudents.map((s) => s.studentCode),
          ...defenseStudents.map((s) => s.studentCode),
        ]);

        return {
          ...supervisor.toObject(),
          noOfAssignedStudents: uniqueStudentCodes.size,
        };
      })
    );

    res.status(200).json(supervisorsWithCounts);
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
 * creates a new coordinator
 * @param {request} req
 * @param {response} res
 */
const create_coordinator = async function (req, res) {
  try {
    const coordinator = await COORDINATORS.create(req.body);

    res.status(201).json({
      message: "Coordinator created successfully",
      coordinator: {
        _id: coordinator._id,
        firstName: coordinator.firstName,
        lastName: coordinator.lastName,
        email: coordinator.email,
        faculty: coordinator.faculty,
        department: coordinator.department,
        isMainCoordinator: coordinator.isMainCoordinator,
      },
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
 * updates coordinator details
 * @param {request} req
 * @param {response} res
 */
const update_coordinator = async function (req, res) {
  try {
    const id = req.params.id;
    const update = req.body;

    if (Object.keys(update).length === 0) {
      res.status(400).json({ message: "Invalid update request" });
      return;
    }

    // Allowed fields for director to update
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
 * Returns a list containing all students
 * @param {request} req
 * @param {response} res
 */
const get_all_students = async function (req, res) {
  try {
    const pipeline = [
      {
        $project: {
          password: 0,
          validation_secret: 0,
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
                isAbroad: 1,
                country: 1,
                state: 1,
                LGA: 1,
                street: 1,
                email: 1,
                phone: 1,
                assignedDepartment: 1,
                jobDescription: 1,
                resumptionDate: 1,
                expectedEndDate: 1,
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
    ];

    const students = await STUDENTS.aggregate(pipeline);

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

/**
 * creates a new school
 * @param {request} req
 * @param {response} res
 */
const create_school = async function (req, res) {
  try {
    const school = await SCHOOLS.create(req.body);
    res.status(201).json({
      message: "School created successfully",
      school,
    });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * gets all schools
 * @param {request} req
 * @param {response} res
 */
const get_all_schools = async function (req, res) {
  try {
    const schools = await SCHOOLS.find({});
    if (schools.length === 0) {
      res.status(404).json({ message: "No schools found" });
      return;
    }
    res.status(200).json(schools);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * gets a specific school by id
 * @param {request} req
 * @param {response} res
 */
const get_a_specific_school = async function (req, res) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    const school = await SCHOOLS.findOne({ _id: id });
    if (school === null) {
      res.status(404).json({ message: "School not found" });
      return;
    }
    res.status(200).json(school);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * updates a school
 * @param {request} req
 * @param {response} res
 */
const update_school = async function (req, res) {
  try {
    const id = req.params.id;
    const update = req.body;
    if (Object.keys(update).length === 0) {
      res.status(400).json({ message: "Invalid update request" });
      return;
    }
    let allowedFields = ["name", "description"];
    let hasInvalidField = Object.keys(update).some(
      (field) => !allowedFields.includes(field)
    );
    if (hasInvalidField) {
      res.status(400).json({
        message: "Your update failed as it contains certain invalid fields",
      });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    const school = await SCHOOLS.updateOne({ _id: id }, update);
    if (school.acknowledged === false) {
      res.status(404).json({ message: "School not found" });
      return;
    }
    res.status(200).json({ message: "School updated successfully" });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * deletes a school
 * @param {request} req
 * @param {response} res
 */
const delete_school = async function (req, res) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    // Delete all departments associated with this school
    await DEPARTMENTS.deleteMany({ schoolId: id });
    const school = await SCHOOLS.deleteOne({ _id: id });
    if (school.deletedCount === 0) {
      res.status(404).json({ message: "School not found" });
      return;
    }
    res.status(200).json({ message: "School deleted successfully" });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * creates a new department
 * @param {request} req
 * @param {response} res
 */
const create_department = async function (req, res) {
  try {
    const { schoolId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      res.status(400).json({ message: "Invalid school ID" });
      return;
    }
    // Verify school exists
    const school = await SCHOOLS.findOne({ _id: schoolId });
    if (school === null) {
      res.status(404).json({ message: "School not found" });
      return;
    }
    const department = await DEPARTMENTS.create(req.body);
    res.status(201).json({
      message: "Department created successfully",
      department,
    });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * gets all departments, optionally filtered by schoolId
 * @param {request} req
 * @param {response} res
 */
const get_all_departments = async function (req, res) {
  try {
    const { schoolId } = req.query;
    let query = {};
    if (schoolId) {
      if (!mongoose.Types.ObjectId.isValid(schoolId)) {
        res.status(400).json({ message: "Invalid school ID" });
        return;
      }
      query.schoolId = schoolId;
    }
    const departments = await DEPARTMENTS.find(query).populate(
      "schoolId",
      "name"
    );
    if (departments.length === 0) {
      res.status(404).json({ message: "No departments found" });
      return;
    }
    res.status(200).json(departments);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * gets a specific department by id
 * @param {request} req
 * @param {response} res
 */
const get_a_specific_department = async function (req, res) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    const department = await DEPARTMENTS.findOne({ _id: id }).populate(
      "schoolId",
      "name"
    );
    if (department === null) {
      res.status(404).json({ message: "Department not found" });
      return;
    }
    res.status(200).json(department);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * updates a department
 * @param {request} req
 * @param {response} res
 */
const update_department = async function (req, res) {
  try {
    const id = req.params.id;
    const update = req.body;
    if (Object.keys(update).length === 0) {
      res.status(400).json({ message: "Invalid update request" });
      return;
    }
    let allowedFields = ["name", "description", "schoolId"];
    let hasInvalidField = Object.keys(update).some(
      (field) => !allowedFields.includes(field)
    );
    if (hasInvalidField) {
      res.status(400).json({
        message: "Your update failed as it contains certain invalid fields",
      });
      return;
    }
    // If updating schoolId, verify it exists
    if (update.schoolId) {
      if (!mongoose.Types.ObjectId.isValid(update.schoolId)) {
        res.status(400).json({ message: "Invalid school ID" });
        return;
      }
      const school = await SCHOOLS.findOne({ _id: update.schoolId });
      if (school === null) {
        res.status(404).json({ message: "School not found" });
        return;
      }
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    const department = await DEPARTMENTS.updateOne({ _id: id }, update);
    if (department.acknowledged === false) {
      res.status(404).json({ message: "Department not found" });
      return;
    }
    res.status(200).json({ message: "Department updated successfully" });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * deletes a department
 * @param {request} req
 * @param {response} res
 */
const delete_department = async function (req, res) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    const department = await DEPARTMENTS.deleteOne({ _id: id });
    if (department.deletedCount === 0) {
      res.status(404).json({ message: "Department not found" });
      return;
    }
    res.status(200).json({ message: "Department deleted successfully" });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * deletes a director
 * @param {request} req
 * @param {response} res
 */
const delete_director = async function (req, res) {
  try {
    const id = req.params.id;

    // Validate the id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }

    // Prevent director from deleting themselves
    if (req.user && req.user._id && req.user._id.toString() === id) {
      res.status(400).json({ message: "You cannot delete your own account" });
      return;
    }

    // Delete the director
    const director = await DIRECTORS.deleteOne({ _id: id });
    if (director.deletedCount === 0) {
      res.status(404).json({ message: "Director not found" });
      return;
    }

    res.status(200).json({ message: "Director deleted successfully" });
    return;
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
  create_coordinator,
  get_all_coordinators,
  get_a_specific_coordinator,
  update_coordinator,
  get_all_students,
  get_a_specific_student,
  update_director_details,
  change_password,
  create_school,
  get_all_schools,
  get_a_specific_school,
  update_school,
  delete_school,
  create_department,
  get_all_departments,
  get_a_specific_department,
  update_department,
  delete_department,
  delete_director,
};
