
const fs = require('fs');

async function getRanges() {
  try {
    const response = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json');
    const data = await response.json();
    
    const ec2Prefixes = data.prefixes
      .filter(p => p.region === 'us-east-1' && p.service === 'EC2')
      .map(p => p.ip_prefix);
      
    const uniqueEc2Prefixes = [...new Set(ec2Prefixes)];
    console.log('--- EC2 ONLY ---');
    console.log(JSON.stringify(uniqueEc2Prefixes, null, 2));
    console.log(`Total unique EC2 ranges: ${uniqueEc2Prefixes.length}`);
  } catch (error) {
    console.error('Error fetching ranges:', error);
  }
}

getRanges();
