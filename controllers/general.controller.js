const mongoose = require("mongoose");
const SCHOOLS = require("../models/school.model");
const DEPARTMENTS = require("../models/department.model");
const { handleError } = require("../utils/handleError");

const formatSchoolResponse = (schools) =>
  schools.map((school) => ({
    _id: school._id,
    name: school.name,
    description: school.description || "",
  }));

const formatDepartmentResponse = (departments) =>
  departments.map((department) => ({
    _id: department._id,
    name: department.name,
    description: department.description || "",
    schoolId:
      typeof department.schoolId === "object" && department.schoolId !== null
        ? {
            _id: department.schoolId._id,
            name: department.schoolId.name,
          }
        : department.schoolId,
  }));

const get_public_schools = async function (_req, res) {
  try {
    const schools = await SCHOOLS.find({}).sort({ name: 1 }).lean();
    res.status(200).json(formatSchoolResponse(schools));
  } catch (error) {
    handleError(error, res);
  }
};

const get_public_departments = async function (req, res) {
  try {
    const { schoolId } = req.query;
    const query = {};

    if (schoolId) {
      if (!mongoose.Types.ObjectId.isValid(schoolId)) {
        res.status(400).json({ message: "Invalid schoolId" });
        return;
      }
      query.schoolId = schoolId;
    }

    const departments = await DEPARTMENTS.find(query)
      .populate("schoolId", "name")
      .sort({ name: 1 })
      .lean();

    res.status(200).json(formatDepartmentResponse(departments));
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  get_public_schools,
  get_public_departments,
};
