#!/usr/bin/env node

console.log('✅ Portfolio Deployment Check');
console.log('=============================\n');

const fs = require('fs');
const path = require('path');

// Check if required files exist
const requiredFiles = [
  'index.html',
  'dist/style.min.css',
  'dist/script.min.js',
  'deploy.sh',
  'deploy.bat',
  'netlify.toml'
];

let allFilesExist = true;

console.log('Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check package.json scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'deploy', 'deploy:prod', 'lint'];

console.log('\nChecking npm scripts:');
requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`✅ npm run ${script}`);
  } else {
    console.log(`❌ npm run ${script} - MISSING`);
    allFilesExist = false;
  }
});

// Check file sizes
console.log('\nChecking build sizes:');
try {
  const cssSize = fs.statSync('dist/style.min.css').size;
  const jsSize = fs.statSync('dist/script.min.js').size;

  console.log(`📄 CSS: ${Math.round(cssSize / 1024)}KB`);
  console.log(`📄 JS: ${Math.round(jsSize / 1024)}KB`);

  if (cssSize < 50000) { // 50KB
    console.log('✅ CSS size optimized');
  } else {
    console.log('⚠️  CSS could be further optimized');
  }

  if (jsSize < 50000) { // 50KB
    console.log('✅ JS size optimized');
  } else {
    console.log('⚠️  JS could be further optimized');
  }
} catch (err) {
  console.log('❌ Could not check build sizes');
  allFilesExist = false;
}

console.log('\n' + '='.repeat(30));

if (allFilesExist) {
  console.log('🎉 SUCCESS: Portfolio is ready for deployment!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run deploy');
  console.log('2. Or deploy manually: netlify deploy --prod');
  console.log('3. Or drag dist/ folder to Netlify');
} else {
  console.log('❌ ISSUES FOUND: Please fix missing files before deploying');
  process.exit(1);
}