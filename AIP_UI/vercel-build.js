// Custom build script for Vercel deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of problematic packages that need to be installed explicitly
const PROBLEMATIC_PACKAGES = [
  '@radix-ui/react-accordion',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-card',
  '@tanstack/react-table'
];

console.log('Starting custom Vercel build process...');

// Helper function to run commands
function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Ensure all dependencies are installed
console.log('Installing dependencies...');
runCommand('npm install');

// Install any missing problematic packages
console.log('Checking for problematic packages...');
for (const pkg of PROBLEMATIC_PACKAGES) {
  try {
    // Try to require the package to see if it's installed
    require.resolve(pkg);
    console.log(`✅ Package ${pkg} is already installed`);
  } catch (error) {
    // If not installed, try to install it
    console.log(`⚠️ Package ${pkg} is missing, installing...`);
    runCommand(`npm install ${pkg}`);
  }
}

// Create a virtual module shim for problematic packages
console.log('Creating virtual module shims...');
const virtualShimDir = path.join(__dirname, 'node_modules', '@virtual-shims');

// Create directory if it doesn't exist
if (!fs.existsSync(virtualShimDir)) {
  fs.mkdirSync(virtualShimDir, { recursive: true });
  console.log(`Created directory: ${virtualShimDir}`);
}

// Build the project
console.log('Building the project...');
const buildSuccessful = runCommand('npm run build');

if (buildSuccessful) {
  console.log('✅ Build completed successfully');
} else {
  console.error('❌ Build failed');
  process.exit(1);
} 