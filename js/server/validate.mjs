import db from "./db.mjs"
import logger from './logger.mjs'
import { sqliteExists } from './util.mjs'



export function validate(req, res){
  db.get("SELECT EXISTS (SELECT 1 FROM users WHERE access_token=? AND current_phase = 5)", [req.params.access_token], (err, row) => {
    if (err) {
      logger.log("error", `Error querying DB for token ${err?.message} @ ${getIP(req)}`)
      if(req.accepts("json")){
        res.send({"access_token" : req.params.access_token, "result": "not elegible"})
      }else{
        return res.sendStatus(403)
      }
    };
    const disclaimer = `<p style="font-family: sans-serif;"><b>Note:</b> Check that the domain name in the browser's address bar is correct.</p>`
    if (sqliteExists(row)) {
      logger.log("info", `Val: elegible: ${req.params.access_token} @ ${getIP(req)}`)
      if(req.accepts("json")){
        req.send({"access_token" : req.params.access_token, "result": "completed"})
      }else{
        res.send(`<p style="font-family: sans-serif; font-size: 4em; color: green;">${req.params.access_token} completed the form</p>`+ disclaimer);
      }
      
    } else {
      logger.log("info", `Val: not elegible: ${req.params.access_token} @ ${getIP(req)}`)
      if(req.accepts("json")){
        res.send({"access_token" : req.params.access_token, "result": "not elegible"})
      }else{
      res.status(403)
      res.send(`<p style=" font-family: sans-serif; font-size: 4em; color: red">NOT ELIGIBLE</p>`)
      }
      
    }
  })

}

function getIP(req){
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress
}