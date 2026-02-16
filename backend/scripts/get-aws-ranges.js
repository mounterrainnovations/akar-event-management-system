
const fs = require('fs');

async function getRanges() {
  try {
    const response = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json');
    const data = await response.json();
    
    const prefixes = data.prefixes
      .filter(p => p.region === 'us-east-1' && p.service === 'AMAZON')
      .map(p => p.ip_prefix);
      
    const uniquePrefixes = [...new Set(prefixes)];
    console.log(JSON.stringify(uniquePrefixes, null, 2));
    console.log(`Total unique ranges: ${uniquePrefixes.length}`);
  } catch (error) {
    console.error('Error fetching ranges:', error);
  }
}

getRanges();
