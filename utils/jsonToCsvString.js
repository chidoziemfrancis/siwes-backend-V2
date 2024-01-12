/**
 * This parses the JSON to retrieve the field names from the entry with the most subfields.
 * @param {JSON} json
 */
const getCsvHeader = function (json) {
  let maxFields = {};

  json.forEach((element) => {
    if (Object.keys(element).length > Object.keys(maxFields)) {
      maxFields = element;
    }
  });

  return Object.keys(maxFields);
};

/**
 * This converts an input json to a csv string
 * @param {JSON} json
 */
const jsonToCsvString = function (json) {
  const fields = getCsvHeader(json);
  let csvString = "";

  csvString = csvString.concat(fields.join(",") + "\n");
  json.forEach((element) => {
    fields.forEach((field) => {
      csvString = csvString.concat(element[field] + ",");
    });
    csvString = csvString.concat("\n");
  });

  return csvString;
};

module.exports = jsonToCsvString;
