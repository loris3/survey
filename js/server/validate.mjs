import db from "./db.mjs"
import logger from './logger.mjs'
import { sqliteExists } from './util.mjs'



export function validate(req, res){
  db.get("SELECT current_phase FROM users WHERE access_token=?", [req.params.access_token], (err, row) => {
    if (err || row == undefined) {
      logger.log("error", `Error querying DB for token ${req.params.access_token}:${err?.message} @ ${getIP(req)}`)
      res.status(403)
      if(!req.accepts("html")){
        
        return res.send({"access_token" : req.params.access_token, "result": "invalid"})
      }else{
        return res.send(`<p style=" font-family: sans-serif; font-size: 4em; color: red">NOT FOUND</p>`)
        
      }
    };
    const disclaimer = `<p style="font-family: sans-serif;"><b>Note:</b> Check that the domain name in the browser's address bar is correct.</p>`
    if (row.current_phase == 5) {
      logger.log("info", `Val: elegible: ${req.params.access_token} @ ${getIP(req)}`)
      if(!req.accepts("html")){
        res.send({"access_token" : req.params.access_token, "result": "elegible"})
      }else{
        res.send(`<p style="font-family: sans-serif; font-size: 4em; color: green;">${req.params.access_token} completed the form</p>`+ disclaimer);
      }
      
    } else{
      logger.log("info", `Val: not elegible: ${req.params.access_token} @ ${getIP(req)}`)
      res.status(403)
      if(!req.accepts("html")){
        res.send({"access_token" : req.params.access_token, "result": "not elegible"})
      }else{    
        res.send(`<p style=" font-family: sans-serif; font-size: 4em; color: red">NOT ELIGIBLE</p>`)
      }
      
    }
  })

}

function getIP(req){
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress
}