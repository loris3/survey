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


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


function authMiddleware(req, res, next, phase) { // https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null){
        console.log("no token provided")
        return res.sendStatus(401)
    }
    jwt.verify(token, process.env.TOKEN_SECRET, (err, access_token) => {
      if (err){
        console.log("auth err", err)
        return res.sendStatus(403)
      } 
      console.log(access_token)
      req.access_token = access_token
      db.get("SELECT EXISTS (SELECT 1 FROM users WHERE access_token=? AND current_phase=?)", [access_token.access_token, phase],(err, row) =>{
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

app.get("/completeCurrentPhase", (req,res)=>{
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null){
        console.log("no token provided")
        return res.sendStatus(401)
    }
    jwt.verify(token, process.env.TOKEN_SECRET, (err, access_token) => {
      if (err){
        console.log("auth err", err)
        return res.sendStatus(403)
      } 
      console.log(access_token.access_token)
      db.run("UPDATE users SET current_phase = current_phase + 1 WHERE access_token = ?", [access_token.access_token],(err, row) =>{
            if (err) return res.sendStatus(403);
            return res.sendStatus(200); 
        })
    })
})
// phase 1
app.get("/document/:documentNr", (req,res, next) => {authMiddleware(req,res, next, 32)} ,(req,res)=>{
    db.get("SELECT * FROM documents_a WHERE ID=?", [req.params.documentNr],(err, row) =>{
        if (err) return res.sendStatus(500);    
        console.log(row)
        if(row == undefined){
            res.sendStatus(404);
            return
        }  
        res.json(row)
    })
})
// phase 3
app.get("/explanation/:explanation_filename", (req,res, next) => {authMiddleware(req,res, next, 32)}, (req,res)=>{
    console.log("serving", path.join(__dirname , "./import/explanations/html", sanitize(req.params.explanation_filename)+".html"))
    res.sendFile(path.join(__dirname , "./import/explanations/html", sanitize(req.params.explanation_filename)+".html"))
})

app.get("/:access_token", (req,res)=>{
    res.json(jwt.sign({access_token: req.params.access_token}, process.env.TOKEN_SECRET, { expiresIn: 60*60*24*30 }));
})
reload(app);