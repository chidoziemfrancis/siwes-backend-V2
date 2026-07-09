/**
 * This parses the JSON to retrieve the full set of field names across all entries,
 * in first-seen order, so no column is dropped just because an earlier row lacks it.
 * @param {JSON} json
 */
const getCsvHeader = function (json) {
  const fields = [];
  const seen = new Set();

  json.forEach((element) => {
    Object.keys(element).forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        fields.push(key);
      }
    });
  });

  return fields;
};

/**
 * Escapes a single CSV value: wraps in quotes (and doubles any internal quotes)
 * whenever the value contains a comma, quote, or newline. Null/undefined become "".
 * @param {*} value
 */
const escapeCsvValue = function (value) {
  if (value === undefined || value === null) {
    return "";
  }

  const stringValue = value instanceof Date ? value.toISOString() : String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * This converts an input json to a csv string
 * @param {JSON} json
 */
const jsonToCsvString = function (json) {
  const fields = getCsvHeader(json);
  let csvString = "";

  csvString = csvString.concat(fields.map(escapeCsvValue).join(",") + "\n");
  json.forEach((element) => {
    csvString = csvString.concat(
      fields.map((field) => escapeCsvValue(element[field])).join(",") + "\n"
    );
  });

  return csvString;
};

module.exports = jsonToCsvString;
