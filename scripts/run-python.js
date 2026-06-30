const { runPython } = require("./python-runner");

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: node scripts/run-python.js <python args>");
  process.exit(1);
}

runPython(args);
