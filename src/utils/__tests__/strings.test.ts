import "@testing-library/jest-dom";

/** Simulación del helper initialsFromName que usas en el navbar */
function initialsFromName(nombre = "", apellido = "", email = "") {
  const n = (nombre || "").trim();
  const a = (apellido || "").trim();
  if (n || a)
    return `${(n[0] || "").toUpperCase()}${(a[0] || "").toUpperCase()}` || "US";
  const user = (email || "").split("@")[0] || "US";
  return user.slice(0, 2).toUpperCase();
}

describe("initialsFromName", () => {
  it("usa nombre y apellido", () => {
    expect(initialsFromName("Juan", "Pérez")).toBe("JP");
  });
  it("cuando no hay nombre, usa email", () => {
    expect(initialsFromName("", "", "mauri@dmh.com")).toBe("MA");
  });
  it("maneja espacios y minúsculas", () => {
    expect(initialsFromName("  maría ", "  gomez ")).toBe("MG");
  });
});
