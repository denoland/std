let defaultEncoding = "buffer";

function setDefaultEncoding(val) {
  defaultEncoding = val;
}

function getDefaultEncoding() {
  return defaultEncoding;
}

export default { getDefaultEncoding, setDefaultEncoding };
export { getDefaultEncoding, setDefaultEncoding };
