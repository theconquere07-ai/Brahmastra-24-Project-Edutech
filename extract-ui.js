const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.indexOf('</script>');

const scriptContent = html.substring(scriptStart + 8, scriptEnd).trim();
fs.writeFileSync('public/app.js', scriptContent);

const newHtml = html.substring(0, scriptStart) + '<script src="app.js"></script>' + html.substring(scriptEnd + 9);
fs.writeFileSync('public/index.html', newHtml);

console.log('Extraction complete.');
