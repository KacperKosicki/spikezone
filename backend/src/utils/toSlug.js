module.exports = function toSlug(s = "") {
  return s
    .toLowerCase()
    .trim()
    .replace(/[ąćęłńóśźż]/g, (m) => ({ ą:"a", ć:"c", ę:"e", ł:"l", ń:"n", ó:"o", ś:"s", ź:"z", ż:"z" }[m]))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};
