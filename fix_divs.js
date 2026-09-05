const fs = require('fs');
let code = fs.readFileSync('src/components/investments/InvestmentManagementModal.tsx', 'utf-8');
code = code.replace(/<\/div>\s*<\/div>\s*<div>\s*<label/g, '</div>\n                <div>\n                  <label');
fs.writeFileSync('src/components/investments/InvestmentManagementModal.tsx', code);
