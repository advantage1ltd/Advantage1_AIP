// Run this script with: node fix-dependencies.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if node_modules exists
const nodeModulesPath = path.resolve(__dirname, 'node_modules');
const exists = fs.existsSync(nodeModulesPath);

if (!exists) {
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
}

// Check for specific problematic packages
const packagesToCheck = [
  '@radix-ui/react-accordion',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-scroll-area',
  '@tanstack/react-table'
];

for (const pkg of packagesToCheck) {
  const pkgPath = path.resolve(__dirname, 'node_modules', pkg);
  const pkgExists = fs.existsSync(pkgPath);
  
  if (!pkgExists) {
    console.log(`Installing missing package: ${pkg}`);
    try {
      execSync(`npm install ${pkg}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Failed to install ${pkg}:`, error.message);
    }
  } else {
    console.log(`Package ${pkg} already installed.`);
  }
}

console.log('Dependencies check completed.'); 