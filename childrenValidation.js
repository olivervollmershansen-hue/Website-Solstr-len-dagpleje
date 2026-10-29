//Funktion til at teste javascript, om den viser den rigtige fejlbesked

function isValidDateRange(startDate, endDate) {
    return Boolean(startDate && endDate && endDate >= startDate);
}

module.exports = { isValidDateRange };
