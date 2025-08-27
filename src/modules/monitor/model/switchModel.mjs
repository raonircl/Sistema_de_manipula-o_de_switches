import { readFileSync } from 'fs';

const switches = JSON.parse(readFileSync('./switches.json'));

export default switches;
