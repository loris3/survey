import db from "../db.mjs";
import logger from "../logger.mjs";
import { sqliteExists } from "../util.mjs";
import sanitize from "sanitize-filename";
import path from "node:path";
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
export function getPhase3(req, res){
    db.get("SELECT * FROM documents_a WHERE document_nr=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)", [req.params.documentNr, req.access_token, req.access_token], (err, row) => {
      if (err) {
        logger.log("error", `Error sending phase3 for ${req.access_token}`)
        return res.sendStatus(500);
      }
  
      if (row == undefined) {
        logger.log("error", `No documents in phase3 for ${req.access_token}`)
        res.sendStatus(404);
        return
      }
      res.json(row)
    })
  }

export function getExplanation(req, res) {
    // only allow explanations from the assigned method
    db.get("SELECT EXISTS(SELECT 1 FROM documents_a WHERE explanation_filename=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?))", [sanitize(req.params.explanation_filename), req.access_token, req.access_token], (err, row) => {
      if (err) {
        logger.log("error", `Error sending explanation ${sanitize(req.params.explanation_filename)} for ${req.access_token}`)
        return res.sendStatus(403)
      };
      if (sqliteExists(row)) {// TODO this can't be the only way of doing this
        res.sendFile(path.join(__dirname, "../../../explanations/html", sanitize(req.params.explanation_filename) + ".html"))
      } else {
        // not permitted
        logger.log("error", `${req.access_token} requested wrong explanation`)
        return res.sendStatus(403);
      }
    })
  
  }

export function submitPhase3(req, res){

    try {
      for (const [question_name, label] of Object.entries(req.body)) {
        if (question_name == "document_nr") {
          continue;
        }
        const question_nr = (/-q(.*)-/gm).exec(question_name)[1];
        db.run(
          `INSERT INTO responses_phase_3 (user_id, document_nr, question_nr, label) VALUES((SELECT ID FROM users WHERE access_token = ?),?,?, ?);`,
          [req.access_token, req.body.document_nr, question_nr, label],
          (error) => {
            if (error) {
              logger.log("error", `Error saving phase3 for ${req.access_token}: ${JSON.stringify(req.body)}`)
            }
          }
        );
      }
    } catch (error) {
      logger.log("error", `Exception saving phase3 for ${req.access_token}: ${JSON.stringify(req.body)}`)
      res.sendStatus(500);
      return;
    }
    res.sendStatus(201);
    return
  
  
  }

async function getResponsesPhase3(access_token){
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT label, document_nr, question_nr, max(timestamp) FROM responses_phase_3 WHERE user_id = (SELECT ID FROM users WHERE access_token = ?) group by document_nr, question_nr;`,
      [access_token],
      (error, rows) => {
        if (error) {
          reject(error)
        } else {
          resolve(rows)
        }
      }
    );
  })
}
export async function sendResponsesPhase3(req, res){
    try {
      const data = await getResponsesPhase3(req.access_token);
      res.send(data);
    } catch (error) {
      logger.log("error", `Error sending phase3 info for ${req.access_token}`)
      res.sendStatus(500);
    }
  
  }
  export async function isPhase3Complete(access_token){
  
    try {
        const data = await getResponsesPhase3(access_token)
        return await new Promise((resolve, reject)=>{
          db.get(`SELECT COUNT(ID) FROM documents_a WHERE detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)`, [access_token, access_token], (error, row)=>{
            if(error){
              reject(error);
            }
            const n_documents = row['COUNT(ID)'];
            resolve(n_documents == (data.length/3))
          })
        })
    } catch (error) {
      logger.log("error", `Error checking completion of phase3 for ${access_token} ${error}`)
      return false;
    }
    
    }