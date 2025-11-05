const fs = require('fs');
const path = require('path');

// Wait a bit to ensure webpack is completely done
setTimeout(() => {
  const sourceDir = path.join(__dirname, 'public', 'icons');
  const destDir = path.join(__dirname, 'dist', 'icons');

  // Ensure dest directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const icons = ['icon16.png', 'icon48.png', 'icon128.png'];

  console.log('\nPost-build: Copying icons...');
  icons.forEach(icon => {
    const src = path.join(sourceDir, icon);
    const dest = path.join(destDir, icon);

    if (fs.existsSync(src)) {
      const data = fs.readFileSync(src);
      fs.writeFileSync(dest, data);

      // Verify immediately
      if (fs.existsSync(dest)) {
        console.log(`✓ ${icon} copied (${fs.statSync(dest).size} bytes)`);
      } else {
        console.error(`✗ ${icon} failed to copy`);
      }
    } else {
      console.error(`✗ Source not found: ${src}`);
    }
  });

  console.log('\nVerifying final state...');
  const distFiles = fs.readdirSync(destDir);
  console.log(`Files in dist/icons: ${distFiles.length}`);
  distFiles.forEach(f => {
    console.log(`  - ${f} (${fs.statSync(path.join(destDir, f)).size} bytes)`);
  });
}, 100);
