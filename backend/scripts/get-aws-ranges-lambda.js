
const fs = require('fs');

async function getRanges() {
  try {
    const response = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json');
    const data = await response.json();
    
    const lambdaPrefixes = data.prefixes
      .filter(p => p.region === 'us-east-1' && p.service === 'LAMBDA')
      .map(p => p.ip_prefix);
      
    const uniqueLambdaPrefixes = [...new Set(lambdaPrefixes)];
    console.log('--- LAMBDA ONLY ---');
    console.log(JSON.stringify(uniqueLambdaPrefixes, null, 2));
    console.log(`Total unique Lambda ranges: ${uniqueLambdaPrefixes.length}`);
  } catch (error) {
    console.error('Error fetching ranges:', error);
  }
}

getRanges();
