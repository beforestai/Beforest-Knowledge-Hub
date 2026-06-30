const { spawn, spawnSync } = require("node:child_process");

const candidates = [
  process.env.KMS_PYTHON,
  process.platform === "win32" ? "py" : null,
  "python",
  "python3"
].filter(Boolean);

function pythonVersion(command) {
  const result = spawnSync(command, ["--version"], {
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  if (result.error || result.status !== 0) {
    return null;
  }
  return `${result.stdout || result.stderr}`.trim();
}

function findPython() {
  for (const command of candidates) {
    const version = pythonVersion(command);
    if (version) {
      return { command, version };
    }
  }
  return null;
}

function printMissingPythonHelp() {
  console.error("Could not find Python on PATH.");
  console.error("");
  console.error("Install Python 3.11+ and make sure one of these commands works:");
  console.error("  py --version");
  console.error("  python --version");
  console.error("  python3 --version");
  console.error("");
  console.error("Then install backend dependencies:");
  console.error("  npm.cmd run backend:install");
}

function runPython(args, options = {}) {
  const python = findPython();
  if (!python) {
    printMissingPythonHelp();
    process.exit(1);
  }

  console.log(`Using ${python.version} (${python.command})`);
  const child = spawn(python.command, args, {
    cwd: options.cwd || process.cwd(),
    env: { ...process.env, ...options.env },
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code || 0);
  });
}

module.exports = {
  findPython,
  printMissingPythonHelp,
  runPython
};
