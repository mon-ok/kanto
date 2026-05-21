const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../assets/images/vehicles');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 1x1 transparent PNG in base64
const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const buffer = Buffer.from(transparentPngBase64, 'base64');

const files = ['bicycle.png', 'motorcycle.png', 'car.png', 'jeepney.png', 'tricycle.png', 'truck.png', 'padala.png'];
for (const file of files) {
  const filePath = path.join(dir, file);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created placeholder for ${file} at ${filePath}`);
}
console.log('All placeholders created successfully!');
