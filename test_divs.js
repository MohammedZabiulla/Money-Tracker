const fs = require('fs');
const code = fs.readFileSync('src/components/investments/InvestmentManagementModal.tsx', 'utf-8');
let openCount = 0;
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  let opens = (line.match(/<div(\s|>)/g) || []).length;
  let closes = (line.match(/<\/div>/g) || []).length;
  openCount += opens - closes;
  if (i > 380 && i < 410) {
     // console.log(`[${i+1}] ${openCount} ${line}`);
  }
}
console.log(`Total unmatched divs: ${openCount}`);
