import { create } from 'domain'
import fs from 'fs';
import sqlite3 from 'sqlite3';
import path, { resolve } from 'path';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import seedrandom from 'seedrandom';

const db_path = "./db.db"
const n_tokens = 27;

if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env', `TOKEN_SECRET=${require('crypto').randomBytes(64).toString('hex')}`);
  if (fs.existsSync('.config')) {
    fs.appendFileSync('.env', "\n")
    fs.appendFileSync('.env', fs.readFileSync(".config"))
  }

}


const db = new sqlite3.Database(db_path, (error) => {
  if (error) {
    return console.error(error.message);
  }
});


await new Promise((resolve, reject) => {
  db.exec(`
  DROP TABLE IF EXISTS documents_a;
  CREATE TABLE documents_a
  (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    document_nr         INTEGER NOT NULL,
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
    document_nr         INTEGER NOT NULL,
    detector            VARCHAR(50) NOT NULL,
    explainer           VARCHAR(50) NOT NULL,
    document            TEXT NOT NULL
  );
  DROP TABLE IF EXISTS users;
  CREATE TABLE users
  (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    access_token TEXT NOT NULL UNIQUE,
    current_phase INTEGER NOT NULL DEFAULT -1,
    detector TEXT,
    explainer TEXT,
    document_order_a TEXT NOT NULL,
    document_order_b TEXT NOT NULL

  );
  DROP TABLE IF EXISTS phase_start_times;
  CREATE TABLE phase_start_times
  (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    phase INTEGER NOT NULL,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id       INTEGER NOT NULL,
    FOREIGN KEY (user_id)
    REFERENCES users (ID)
  );
  DROP TABLE IF EXISTS groups;
CREATE TABLE groups
(
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  explainer TEXT NOT NULL,
  detector TEXT NOT NULL
);
DROP TABLE IF EXISTS responses_phase_2;
CREATE TABLE responses_phase_2
(
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  label INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  document_nr   INTEGER NOT NULL,

  FOREIGN KEY (user_id)
     REFERENCES users (ID),
  
  FOREIGN KEY (document_nr)
     REFERENCES documents_b (document_nr)
);
DROP TABLE IF EXISTS responses_phase_3;
CREATE TABLE responses_phase_3
(
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  label INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  document_nr   INTEGER NOT NULL,
  question_nr INTEGER NOT NULL,
  FOREIGN KEY (user_id)
     REFERENCES users (ID),
  FOREIGN KEY (document_nr)
     REFERENCES documents_a (document_nr)
);
DROP TABLE IF EXISTS responses_phase_4;
CREATE TABLE responses_phase_4
(
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  label INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  document_nr   INTEGER NOT NULL,

  FOREIGN KEY (user_id)
     REFERENCES users (ID),
  
  FOREIGN KEY (document_nr)
     REFERENCES documents_b (document_nr)
);

DROP TABLE IF EXISTS participant_info;
CREATE TABLE participant_info
(
  user_id INTEGER NOT NULL PRIMARY KEY,
  has_seen_explanation_methods_before TEXT,
  has_seen_SHAP_before TEXT,
  has_seen_LIME_before TEXT,
  has_seen_ANCHOR_before TEXT,
  has_seen_OTHERS_before TEXT,
  level_of_expertise TEXT,
  familiarity_with_chatgpt TEXT,
  prefers_monochromatic_methods TEXT,
  FOREIGN KEY (user_id)
     REFERENCES users (ID)
);
`, (err) => {
    if (err) {
      reject(err)
    }
    resolve()
  });
})

const importPath = "./explanations/data"
fs.readdirSync(importPath).forEach(file => {
  const data = fs.readFileSync(path.join(importPath, file), 'utf8',);

  let explanationData = JSON.parse(data);


  if (explanationData?.explanation_filename) {
    // set a
    db.run(
      `INSERT INTO documents_a (document_nr, detector, explainer, ground_truth, detector_label, detector_p_machine, detector_p_human, document, explanation_filename) VALUES (?,?, ?, ?,?,?,?,?,?)`,
      [
        explanationData.document_nr,
        explanationData.detector,
        explanationData.explainer,
        explanationData?.ground_truth,
        explanationData?.detector_label,
        explanationData?.detector_p_machine,
        explanationData?.detector_p_human,
        explanationData.document,
        explanationData?.explanation_filename

      ]);
  } else {
    db.run(
      `INSERT INTO documents_b (document_nr, detector, explainer, document) VALUES (?, ?, ?, ?)`,
      [
        explanationData.document_nr,
        explanationData.detector,
        explanationData.explainer,
        explanationData.document,

      ]);
  }


});



let pastTokens = [];
function createToken() {
  let token = "1";
  while (!/^[A-Z]+$/.test(token) || token.length != 6 || pastTokens.includes(token)) {
    token = (Math.random() + 1).toString(36).substring(6).toUpperCase(); // https://stackoverflow.com/a/8084248
  }
  pastTokens.push(token);
  return token
}
// create users


const n_documents_in_each_phase = await new Promise((resolve, reject) => {
  db.get(`SELECT max(document_nr) from documents_a`, (err, row) => {
    if (err) {
      reject()
    }
    resolve(row["max(document_nr)"] + 1)
  })
})



for (let i = 1; i <= n_tokens; i++) {
  // randomize order of documents (with seed)
  let rng_a = new seedrandom("a" + i)
  let document_order_a = Array.from(Array(n_documents_in_each_phase).keys()).sort(() => rng_a() - 0.5);
  let rng_b = new seedrandom("b" + i)
  let document_order_b = Array.from(Array(n_documents_in_each_phase).keys()).sort(() => rng_b() - 0.5);

  db.run(`INSERT INTO users (access_token, document_order_a, document_order_b) VALUES (?,?,?)`,
    [createToken(), JSON.stringify(document_order_a), JSON.stringify(document_order_b)]);
}


// create groups
let explainers = ["SHAP_Explainer", "LIME_Explainer", "Anchor_Explainer"]
let detectors = ["DetectorRadford", "DetectorDetectGPT","DetectorGuo"]
explainers.forEach((explainer) => {
  detectors.forEach((detector) => {
    db.run(`INSERT INTO groups (explainer, detector) VALUES (?,?)`, [explainer, detector]);
  })
})
