const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'PARFAIT 6 (5).xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = 'DATA';
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

// Print headers of the first row to identify correct columns
if (data.length > 0) {
    console.log("Colonnes détectées:", Object.keys(data[0]));
} else {
    console.log("Aucune donnée trouvée dans la feuille DATA");
}
