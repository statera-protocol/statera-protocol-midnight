#!/usr/bin/env node

const childProcess = require('child_process');
const path = require('path');

const [_node, _script, ...args] = process.argv;
const COMPACT_HOME_ENV = process.env.COMPACT_HOME;

let compactPath;
if (COMPACT_HOME_ENV != null) {
  compactPath = COMPACT_HOME_ENV;
  console.log(`COMPACT_HOME env variable is set; using Compact from ${compactPath}`);
} else {
  compactPath = path.resolve(__dirname, '..', 'compactc');
  console.log(`COMPACT_HOME env variable is not set; using fetched compact from ${compactPath}`);
}

// Debug: Print the full path to compactc and zkir
console.log(`compactc path: ${path.resolve(compactPath, 'compactc')}`);
console.log(`zkir path: ${path.resolve(compactPath, 'zkir')}`);

// yarn runs everything with node...
const child = childProcess.spawn(path.resolve(compactPath, 'compactc'), args, {
  stdio: 'inherit'
});
child.on('exit', (code, signal) => {
  if (code === 0) {
    process.exit(0);
  } else {
    process.exit(code ?? signal);
  }
});