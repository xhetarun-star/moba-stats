const XLSX = require('xlsx');
const workbook = XLSX.readFile('PARFAIT 6 (5).xlsx');
const sheet = workbook.Sheets['DATA'];
const data = XLSX.utils.sheet_to_json(sheet);
console.log("Premier objet brut:", data[0]);
