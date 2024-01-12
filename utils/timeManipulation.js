function getCurrentWeek() {
  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  const pastDaysOfYear = (today - firstDayOfYear) / 86400000;

  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getDateOfFirstDayOfTheWeek(w, y) {
  var simple = new Date(y, 0, 1 + (w - 1) * 7);
  var dow = simple.getDay();
  var ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay());
  else ISOweekStart.setDate(simple.getDate() + 7 - simple.getDay());

  return ISOweekStart;
}

function isDate1GreaterThanDate2(date1, date2) {
  // Create new Date objects to avoid modifying the original dates
  var d1 = new Date(date1);
  var d2 = new Date(date2);

  // Set the time components to zero (midnight)
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  // Compare the dates
  return d1 > d2;
}

module.exports = {
  getCurrentWeek,
  getDateOfFirstDayOfTheWeek,
  isDate1GreaterThanDate2,
};
