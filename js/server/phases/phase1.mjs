import db from "../db.mjs";
import logger from "../logger.mjs";
export function getPhase1(req, res){
    db.get("SELECT * FROM documents_a WHERE document_nr=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)", [req.params.documentNr, req.access_token, req.access_token], (err, row) => {
      if (err){
        logger.log("error", `Error sending phase1 for ${req.access_token}`)
        return res.sendStatus(500);
      } 
  
      if (row == undefined) {
        logger.log("error", `No documents in phase1 for ${req.access_token}`)
        res.sendStatus(404);
        return
      }
      res.json(row)
    })
  }