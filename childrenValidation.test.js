
const { isValidDateRange } = require("./childrenValidation");

test("Accepterer en gyldig datoperiode", () => {
    expect(
        isValidDateRange("2026-11-01", "2027-11-01")
    ).toBe(true);
});

test("Afviser slutdato før startdato", () => {
    expect(
        isValidDateRange("2027-11-01", "2026-11-01")
    ).toBe(false);
});

test("Afviser manglende datoer", () => {
    expect(
        isValidDateRange("", "2027-11-01")
    ).toBe(false);
});
