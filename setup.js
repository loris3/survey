const { create } = require('domain');
const fs = require('fs');
const sqlite3 = require("sqlite3").verbose();
const path = require('path'); 
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const db_path = "./db.db"


if(!fs.existsSync('.env')){
  fs.writeFileSync('.env', `TOKEN_SECRET=${require('crypto').randomBytes(64).toString('hex')}`);
}


const db = new sqlite3.Database(db_path, (error) => {
    if (error) {
      return console.error(error.message);
    }
  });

  db.exec(`
  DROP TABLE IF EXISTS documents_a;
  CREATE TABLE documents_a
  (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    detector            VARCHAR(50) NOT NULL,
    explainer           VARCHAR(50) NOT NULL,
    ground_truth        INTEGER NOT NULL,
    detector_label      INTEGER NOT NULL,
    detector_p_machine  REAL NOT NULL,
    detector_p_human    REAL NOT NULL,
    document            TEXT NOT NULL,
    explanation_filename TEXT NOT NULL
  );
  DROP TABLE IF EXISTS documents_b;
  CREATE TABLE documents_b
  (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    detector            VARCHAR(50) NOT NULL,
    explainer           VARCHAR(50) NOT NULL,
    document            TEXT NOT NULL
  );
`);

const importPath = "./import/explanations/data"
fs.readdirSync(importPath).forEach(file => {
    fs.readFile(path.join(importPath, file), 'utf8', function (err, data) {
        if (err) throw err;
        explanationData = JSON.parse(data);
      //  console.log(explanationData)

        if(explanationData?.explanation_filename){
            // set a
            db.run(
                `INSERT INTO documents_a (detector, explainer, ground_truth, detector_label, detector_p_machine, detector_p_human, document, explanation_filename) VALUES (?, ?, ?,?,?,?,?,?)`,
                [
                    explanationData.detector,
                    explanationData.explainer,
                    explanationData?.ground_truth,
                    explanationData?.detector_label,
                    explanationData?.detector_p_machine,
                    explanationData?.detector_p_human,
                    explanationData.document,
                    explanationData?.explanation_filename
    
                ]);
        }else{
            db.run(
                `INSERT INTO documents_b (detector, explainer, document) VALUES (?, ?, ?)`,
                [
                    explanationData.detector,
                    explanationData.explainer,
                    explanationData.document,
    
                ]);
        }

      });
  });


  db.exec(`
  DROP TABLE IF EXISTS users;
  CREATE TABLE users
  (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    access_token TEXT NOT NULL UNIQUE,
    current_phase INTEGER NOT NULL DEFAULT 0
  );
`);
let pastTokens = [];
function createToken(){
  let token = "1";
  while(!/^[A-Z]+$/.test(token) || token.length != 6 || pastTokens.includes(token)){
    token = (Math.random() + 1).toString(36).substring(6).toUpperCase(); // https://stackoverflow.com/a/8084248
  }
  pastTokens.push(token);
  return token 
}
// create users
for(let i = 1; i <=30; i++){
  db.run(
    `INSERT INTO users (access_token) VALUES (?)`,
    [createToken()]);

}

db.exec(`
DROP TABLE IF EXISTS responses_phase_2;
CREATE TABLE responses_phase_2
(
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  label INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  document_id   INTEGER NOT NULL,

  FOREIGN KEY (user_id)
     REFERENCES users (ID),
  
  FOREIGN KEY (document_id)
     REFERENCES documents_a (ID)
);

DROP TABLE IF EXISTS responses_phase_4;
CREATE TABLE responses_phase_4
(
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  label INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  document_id   INTEGER NOT NULL,

  FOREIGN KEY (user_id)
     REFERENCES users (ID),
  
  FOREIGN KEY (document_id)
     REFERENCES documents_a (ID)
);
`);