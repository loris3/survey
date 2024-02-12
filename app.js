const path = require('path');
const express = require('express')
const reload = require('reload')
const app = express()
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const sqlite3 = require("sqlite3").verbose();
const fs = require('fs');
var sanitize = require("sanitize-filename");

if(!fs.existsSync('.env')){
    throw new Error("Run 'node setup.js' first!")
  }
dotenv.config();


const db_path = "./db.db"
const port = 3002



const db = new sqlite3.Database(db_path, (error) => {
    if (error) {
      return console.error(error.message);
    }
  });












app.use(express.static('./public'));
app.use(express.json());

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// there are two versions of this middleware: one that checks if the user is in the right phase and one that doesn't
function authMiddlewarePhase(req, res, next, phase) { // https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null || token == "null"){
        console.log("no token provided")
         res.sendStatus(403)
         return
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, data) => {
      if (err){
        console.log("auth err", err)
        return res.sendStatus(403)
      } 
      req.access_token = data.access_token
      db.get("SELECT EXISTS (SELECT 1 FROM users WHERE access_token=? AND current_phase=?)", [req.access_token, phase],(err, row) =>{
            if (err) return res.sendStatus(403);
            if(Object.values(row)[0]){// TODO this can't be the only way of doing this
                next()
            }else{ 
                // user did not complete previous phases
                return res.sendStatus(403);
            }
        })
    })
}
// there are two versions of this middleware: one that checks if the user is in the right phase and one that doesn't
function authMiddleware(req, res, next) { // https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null || token == "null"){
      console.log("no token provided")
      res.sendStatus(403)
      return 
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, data) => {
    if (err){
      console.log("auth err", err)
      return res.sendStatus(403)
    } 
    req.access_token = data.access_token
    db.get("SELECT EXISTS (SELECT 1 FROM users WHERE access_token=?)", [req.access_token],(err, row) =>{
          if (err) return res.sendStatus(403);
          if(Object.values(row)[0]){// TODO this can't be the only way of doing this
              next()
          }else{ 
              // user doesn't exist
              return res.sendStatus(403);
          }
      })
  })
}

app.get("/completeCurrentPhase", authMiddleware, (req,res)=>{
          db.run("UPDATE users SET current_phase = current_phase + 1 WHERE access_token = ?", [req.access_token],(err, row) =>{
            if (err) return res.sendStatus(403);
            return res.sendStatus(200); 
        })
    })

// phase 1
app.get("/documentPhase1/:documentNr", (req,res, next) => {authMiddlewarePhase(req,res, next, 1)} ,(req,res)=>{
    db.get("SELECT * FROM documents_a WHERE document_nr=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)", [req.params.documentNr, req.access_token, req.access_token],(err, row) =>{
        if (err) return res.sendStatus(500);    

        if(row == undefined){
            res.sendStatus(404);
            return
        }  
        res.json(row)
    })
})
// phase 2
app.get("/documentPhase2/:documentNr", (req,res, next) => {authMiddlewarePhase(req,res, next, 2)} ,(req,res)=>{
  db.get("SELECT * FROM documents_b WHERE document_nr=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)", [req.params.documentNr, req.access_token, req.access_token],(err, row) =>{
      if (err) return res.sendStatus(500);    

      if(row == undefined){
          res.sendStatus(404);
          return
      }  
      res.json(row)
  })
})
app.post("/submitPhase2", (req,res, next) => {authMiddlewarePhase(req,res, next, 2)} ,(req,res)=>{


  db.run(
    `INSERT INTO responses_phase_2 (user_id, document_nr, label) VALUES((SELECT ID FROM users WHERE access_token = ?),?,?);`,
    [req.access_token, req.body.ID, req.body.label],
    (error) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      }else{
        res.sendStatus(201);
      }
    }
    );

})
// phase 3: now with explanations: this is not redundant with phase1
app.get("/documentPhase3/:documentNr", (req,res, next) => {authMiddlewarePhase(req,res, next, 3)} ,(req,res)=>{
  db.get("SELECT * FROM documents_a WHERE document_nr=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)", [req.params.documentNr, req.access_token, req.access_token],(err, row) =>{
      if (err) return res.sendStatus(500);    

      if(row == undefined){
          res.sendStatus(404);
          return
      }  
      res.json(row)
  })
})
app.get("/explanation/:explanation_filename", (req,res, next) => {authMiddlewarePhase(req,res, next, 3)}, (req,res)=>{
    // only allow explanations from the assigned method
    db.get("SELECT EXISTS(SELECT 1 FROM documents_a WHERE explanation_filename=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?))", [sanitize(req.params.explanation_filename), req.access_token,req.access_token],(err, row) =>{
      if (err) return res.sendStatus(403);
      if(Object.values(row)[0]){// TODO this can't be the only way of doing this
        //  console.log("serving", path.join(__dirname , "./import/explanations/html", sanitize(req.params.explanation_filename)+".html"))
          res.sendFile(path.join(__dirname , "./import/explanations/html", sanitize(req.params.explanation_filename)+".html"))
      }else{ 
          // not permitted
          return res.sendStatus(403);
      }
  })
    
})

// phase 4: just as phase 2, just writes to another table
app.get("/documentPhase4/:documentNr", (req,res, next) => {authMiddlewarePhase(req,res, next, 4)} ,(req,res)=>{
  db.get("SELECT * FROM documents_b WHERE document_nr=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)", [req.params.documentNr, req.access_token, req.access_token],(err, row) =>{
      if (err) return res.sendStatus(500);    

      if(row == undefined){
          res.sendStatus(404);
          return
      }  
      res.json(row)
  })
})
app.post("/submitPhase4", (req,res, next) => {authMiddlewarePhase(req,res, next, 4)} ,(req,res)=>{


  db.run(
    `INSERT INTO responses_phase_4 (user_id, document_nr, label) VALUES((SELECT ID FROM users WHERE access_token = ?),?,?);`,
    [req.access_token, req.body.ID, req.body.label],
    (error) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      }else{
        res.sendStatus(201);
      }
    }
    );

})
app.post("/submitParticipantInfo", (req,res, next) => {authMiddlewarePhase(req,res, next, -1)} ,(req,res)=>{

  db.run(
    `INSERT OR REPLACE INTO participant_info (user_id, has_seen_explanation_methods_before, has_seen_SHAP_before, has_seen_LIME_before, has_seen_ANCHOR_before,
      has_seen_OTHERS_before, level_of_expertise) VALUES((SELECT ID FROM users WHERE access_token = ?),?,?,?,?,?,?);`,
    [
      req.access_token,
      req.body?.has_seen_explanation_methods_before,
      req.body?.has_seen_SHAP_before,
      req.body?.has_seen_LIME_before,
      req.body?.has_seen_ANCHOR_before,
      req.body?.has_seen_OTHERS_before,
      req.body?.level_of_expertise
    ],
    (error) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      }else{
        res.sendStatus(201);
      }
    }
    );
  
})

// util endpoints
app.get("/state", authMiddleware,(req,res)=>{
  db.get("SELECT * FROM users WHERE access_token=?", [req.access_token],(err, row) =>{
      if (err) return res.sendStatus(500);    

      if(row == undefined){
          res.sendStatus(404);
          return
      }  
      res.json({
        current_phase: row.current_phase,
        document_order_a: row.document_order_a,
        document_order_b: row.document_order_b,
        explainer: row.explainer
      })
  })
})

app.get("/getParticipantInfo", (req,res, next) => {authMiddlewarePhase(req,res, next, -1)} ,(req,res)=>{


  db.all(
    `SELECT * FROM participant_info  WHERE user_id = (SELECT ID FROM users WHERE access_token = ?)`,
    [req.access_token],
    (error, rows) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      }else{
        res.send(rows)
      }
    }
    );

})

app.get("/getPhase4", (req,res, next) => {authMiddlewarePhase(req,res, next, 4)} ,(req,res)=>{


  db.all(
    `SELECT label, document_nr, max(timestamp) FROM responses_phase_4 WHERE user_id = (SELECT ID FROM users WHERE access_token = ?) group by document_nr`,
    [req.access_token],
    (error, rows) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      }else{
        res.send(rows)
      }
    }
    );

})
app.get("/getPhase2", (req,res, next) => {authMiddlewarePhase(req,res, next, 2)} ,(req,res)=>{


  db.all(
    `SELECT label, document_nr, max(timestamp) FROM responses_phase_2 WHERE user_id = (SELECT ID FROM users WHERE access_token = ?) group by document_nr;`,
    [req.access_token],
    (error, rows) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      }else{
        res.send(rows)
      }
    }
    );

})

// app.get("/numDocuments", authMiddleware,(req,res)=>{
//   db.get("SELECT COUNT(documents_a.ID) FROM documents_a",(err, row) =>{
//       if (err) return res.sendStatus(500);    
//       console.log(row)
//       if(row == undefined){
//           res.sendStatus(404);
//           return
//       }  
//       res.json(row['COUNT(documents_a.ID)'])
//   })
// })

app.get("/auth/:access_token", (req,res)=>{
  db.get("SELECT EXISTS (SELECT 1 FROM users WHERE access_token=? AND current_phase <= 4)", [req.params.access_token],(err, row) =>{
    if (err) return res.sendStatus(403);
    if(Object.values(row)[0]){// TODO this can't be the only way of doing this
      res.json(jwt.sign({access_token: req.params.access_token}, process.env.TOKEN_SECRET, { expiresIn: 60*60*24*30 }));
    }else{ 
        // no such token
        return res.sendStatus(403);
    }
})
    
})
app.get("/:access_token", (req,res)=>{
  res.sendFile(path.join(__dirname, "/public/index.html"))
})
reload(app);