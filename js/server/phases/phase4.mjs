import db from "../db.mjs";
import logger from "../logger.mjs";
export function getPhase4(req, res){
    db.get("SELECT * FROM documents_b WHERE document_nr=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)", [req.params.documentNr, req.access_token, req.access_token], (err, row) => {
      if (err) {
        logger.log("error", `Error sending phase4 for ${req.access_token}`)
        return res.sendStatus(500)
      };
  
      if (row == undefined) {
        res.sendStatus(404);
        return
      }
      res.json(row)
    })
  }

export function submitPhase4(req, res) {
    db.run(
      `INSERT INTO responses_phase_4 (user_id, document_nr, label) VALUES((SELECT ID FROM users WHERE access_token = ?),?,?);`,
      [req.access_token, req.body.ID, req.body.label],
      (error) => {
        if (error) {
          logger.log("error", `Error saving phase4 for ${req.access_token}: ${JSON.stringify(req.body)}`)
          res.sendStatus(500);
        } else {
          res.sendStatus(201);
        }
      }
    );
  
  }
  async function getResponsesPhase4(access_token) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT label, document_nr, max(timestamp) FROM responses_phase_4 WHERE user_id = (SELECT ID FROM users WHERE access_token = ?) group by document_nr;`,
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
  export async function sendResponsesPhase4(req, res) {
    try {
      const data = await getResponsesPhase4(req.access_token);
      res.send(data);
    } catch (error) {
      logger.log("error", `Error sending phase4 info for ${req.access_token}`)
      res.sendStatus(500);
    }
  
  }
  export async function isPhase4Complete(access_token){
    
  try {
      const data = await getResponsesPhase4(access_token)
      return await new Promise((resolve, reject)=>{
        db.get(`SELECT COUNT(ID) FROM documents_b WHERE detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)`, [access_token, access_token], (error, row)=>{
          if(error){
            reject(error);
          }
          const n_documents = row['COUNT(ID)'];
          resolve(n_documents == data.length)
        })
      })
  } catch (error) {
    logger.log("error", `Error checking completion of phase4 for ${access_token}`)
    return false;
  }
  
  }