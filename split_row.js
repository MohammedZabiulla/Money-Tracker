const fs = require('fs');

let content = fs.readFileSync('src/components/transactions/TransactionsView.tsx', 'utf8');

const rowRegex = /<\s*div\s+key=\{`tx_\$\{t\.id\}_\$\{idx\}`\}([\s\S]*?)<\!-- Bottom Row: Detail Badges & Quick Action Buttons -->[\s\S]*?<\/\s*div\s*>\s*<\/\s*div\s*>/;

// Actually it's easier to write a specific script or just replace it manually.
