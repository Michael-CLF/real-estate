import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const csvPath = path.resolve('public/assets/data/uszips.csv');
const outputPath = path.resolve('public/assets/data/zip-data.json');

const zipMap = {};

const stream = fs.createReadStream(csvPath);

const rl = readline.createInterface({
  input: stream,
  crlfDelay: Infinity
});

let header = true;

for await (const line of rl) {

  if (header) {
    header = false;
    continue;
  }

  const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);

  if (!values) {
    continue;
  }

  const zip = values[0]?.replace(/"/g, '');
  const city = values[3]?.replace(/"/g, '');
  const state = values[4]?.replace(/"/g, '');
  const county = values[11]?.replace(/"/g, '');

  if (!zip) {
    continue;
  }

  zipMap[zip] = {
    zipCode: zip,
    city,
    state,
    county
  };

}

fs.writeFileSync(
  outputPath,
  JSON.stringify(zipMap, null, 2)
);

console.log(`Created ${outputPath}`);
console.log(`${Object.keys(zipMap).length} ZIP codes exported.`);