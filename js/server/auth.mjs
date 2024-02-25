import jwt from 'jsonwebtoken'

import db from "./db.mjs"
import logger from './logger.mjs'
import { sqliteExists } from './util.mjs'

// there are two versions of this middleware: one that checks if the user is in the right phase and one that doesn't
export function authMiddlewarePhase(req, res, next, phase) { // https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null || token == "null") {
      logger.log("info", `Auth: No token provided @ ${getIP(req)}`)
      res.sendStatus(403)
      return
    }
  
    jwt.verify(token, process.env.TOKEN_SECRET, (err, data) => {
      if (err) {
        logger.log("error", `JWT token verification error: ${err?.message} @ ${getIP(req)}`)
        return res.sendStatus(403)
      }
      req.access_token = data.access_token
      db.get("SELECT EXISTS (SELECT 1 FROM users WHERE access_token=? AND current_phase=?)", [req.access_token, phase], (err, row) => {
        if (err) {
          logger.log("error", `Error querying DB for token ${err?.message} @ ${getIP(req)}`)
          return res.sendStatus(403)
        };
        if (sqliteExists(row)) {// TODO this can't be the only way of doing this
          next()
        } else {
          logger.log("info", `User ${token} not in correct phase or does not exist @ ${getIP(req)}`)
          return res.sendStatus(403);
        }
      })
    })
  }
  // there are two versions of this middleware: one that checks if the user is in the right phase and one that doesn't
  export function authMiddleware(req, res, next) { // https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
  
    if (token == null || token == "null") {
      logger.log("info", `Auth: No token provided @ ${getIP(req)}`)
      res.sendStatus(403)
      return
    }
    jwt.verify(token, process.env.TOKEN_SECRET, (err, data) => {
      if (err) {
        logger.log("error", `JWT token verification error: ${err?.message} @ ${getIP(req)}`)
        return res.sendStatus(403)
      }
      req.access_token = data.access_token
      db.get("SELECT EXISTS (SELECT 1 FROM users WHERE access_token=?)", [req.access_token], (err, row) => {
        if (err) {
          logger.log("error", `Error querying DB for token ${err?.message} @ ${getIP(req)}`)
          return res.sendStatus(403);
        }
        if (sqliteExists(row)) {
          next()
        } else {
          logger.log("info", `User ${token} does not exist @ ${getIP(req)}`)
          return res.sendStatus(403);
        }
      })
    })
  }


export function authenticate(req, res){
  db.get("SELECT EXISTS (SELECT 1 FROM users WHERE access_token=?)", [req.params.access_token], (err, row) => {
    if (err) {
      logger.log("error", `Error querying DB for token ${err?.message} @ ${getIP(req)}`)
      return res.sendStatus(403)
    };
    if (sqliteExists(row)) {
      logger.log("info", `Auth: success: ${req.params.access_token} @ ${getIP(req)}`)
      res.json(jwt.sign({ access_token: req.params.access_token }, process.env.TOKEN_SECRET, { expiresIn: 60 * 60 * 24 * 30 }));
    } else {
      // no such token
      logger.log("info", `Auth: no such token: ${req.params.access_token} @ ${getIP(req)}`)
      res.sendStatus(403);
      
    }
  })

}

function getIP(req){
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress
}