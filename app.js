const path = require('path');
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const sqlite3 = require("sqlite3").verbose();
const fs = require('fs');
const zlib = require('zlib');
const bwipjs = require('bwip-js');
const pdfkit = require('pdfkit');
const sanitize = require("sanitize-filename");

const { Client } =  require("node-scp");
const { exit } = require('process');

if (!fs.existsSync('.env')) {
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












app.use(express.static('./build'));
app.use(express.json());

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// there are two versions of this middleware: one that checks if the user is in the right phase and one that doesn't
function authMiddlewarePhase(req, res, next, phase) { // https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null || token == "null") {
    console.log("no token provided")
    res.sendStatus(403)
    return
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, data) => {
    if (err) {
      console.log("auth err", err)
      return res.sendStatus(403)
    }
    req.access_token = data.access_token
    db.get("SELECT EXISTS (SELECT 1 FROM users WHERE access_token=? AND current_phase=?)", [req.access_token, phase], (err, row) => {
      if (err) return res.sendStatus(403);
      if (Object.values(row)[0]) {// TODO this can't be the only way of doing this
        next()
      } else {
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

  if (token == null || token == "null") {
    console.log("no token provided")
    res.sendStatus(403)
    return
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, data) => {
    if (err) {
      console.log("auth err", err)
      return res.sendStatus(403)
    }
    req.access_token = data.access_token
    db.get("SELECT EXISTS (SELECT 1 FROM users WHERE access_token=?)", [req.access_token], (err, row) => {
      if (err) return res.sendStatus(403);
      if (Object.values(row)[0]) {// TODO this can't be the only way of doing this
        next()
      } else {
        // user doesn't exist
        return res.sendStatus(403);
      }
    })
  })
}

app.post("/completeCurrentPhase", authMiddleware, (req, res) => {
  db.get("SELECT current_phase, prefers_monochromatic_methods FROM users JOIN participant_info on users.ID = participant_info.user_id WHERE access_token = ?", [req.access_token], (err, row) => {

    if (err) return res.sendStatus(500);
    if (row == undefined) {
      res.sendStatus(404);
      return
    }
    if (req.body?.expected != row.current_phase + 1) {
      res.sendStatus(208);
      return
    }
    db.serialize(() => {
      if (row.current_phase == -1) { // assign group
        let query;
        if (row.prefers_monochromatic_methods == "yes") {
          // select where explainer = Anchors, with the least participants
          query = `WITH choice as (SELECT count(users.current_phase > 4) as numcompleted, count(users.detector) as count_ , groups.detector, groups.explainer FROM groups LEFT JOIN users ON groups.explainer = users.explainer AND groups.detector = users.detector   WHERE groups.explainer = "Anchor_Explainer" GROUP BY groups.explainer, groups.detector ORDER BY count_, numcompleted, groups.explainer DESC limit 1)
        UPDATE users SET detector = (SELECT detector from choice), explainer = (SELECT explainer from choice) WHERE access_token = ?`
        } else {
          // select the one with the least participants
          query = `WITH choice as (SELECT count(users.current_phase > 4) as numcompleted, count(users.detector) as count_ , groups.detector, groups.explainer FROM groups LEFT JOIN users ON groups.explainer = users.explainer AND groups.detector = users.detector  GROUP BY groups.explainer, groups.detector ORDER BY count_, numcompleted, groups.explainer DESC limit 1)
        UPDATE users SET detector = (SELECT detector from choice), explainer = (SELECT explainer from choice) WHERE access_token = ?`
        }
        db.run(query, [req.access_token], (err, row) => {
          if (err) console.log(err);
        })

      }
      db.run("UPDATE users SET current_phase =? WHERE access_token = ?", [req.body.expected, req.access_token], (err, row) => {
        if (err) return res.sendStatus(403);
        return res.sendStatus(200);
      })

      if (row.current_phase == 4) { // once phase 4 is completed
        offSiteBackup(req.access_token);
      }

    })
  });

})

// phase 1
app.get("/documentPhase1/:documentNr", (req, res, next) => { authMiddlewarePhase(req, res, next, 1) }, (req, res) => {
  db.get("SELECT * FROM documents_a WHERE document_nr=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)", [req.params.documentNr, req.access_token, req.access_token], (err, row) => {
    if (err) return res.sendStatus(500);

    if (row == undefined) {
      res.sendStatus(404);
      return
    }
    res.json(row)
  })
})
// phase 2
app.get("/documentPhase2/:documentNr", (req, res, next) => { authMiddlewarePhase(req, res, next, 2) }, (req, res) => {
  db.get("SELECT * FROM documents_b WHERE document_nr=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)", [req.params.documentNr, req.access_token, req.access_token], (err, row) => {
    if (err) return res.sendStatus(500);

    if (row == undefined) {
      res.sendStatus(404);
      return
    }
    res.json(row)
  })
})
app.post("/submitPhase2", (req, res, next) => { authMiddlewarePhase(req, res, next, 2) }, (req, res) => {


  db.run(
    `INSERT INTO responses_phase_2 (user_id, document_nr, label) VALUES((SELECT ID FROM users WHERE access_token = ?),?,?);`,
    [req.access_token, req.body.ID, req.body.label],
    (error) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      } else {
        res.sendStatus(201);
      }
    }
  );

})
// phase 3: now with explanations: this is not redundant with phase1
app.get("/documentPhase3/:documentNr", (req, res, next) => { authMiddlewarePhase(req, res, next, 3) }, (req, res) => {
  db.get("SELECT * FROM documents_a WHERE document_nr=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)", [req.params.documentNr, req.access_token, req.access_token], (err, row) => {
    if (err) return res.sendStatus(500);

    if (row == undefined) {
      res.sendStatus(404);
      return
    }
    res.json(row)
  })
})
app.get("/explanation/:explanation_filename", (req, res, next) => { authMiddlewarePhase(req, res, next, 3) }, (req, res) => {
  // only allow explanations from the assigned method
  db.get("SELECT EXISTS(SELECT 1 FROM documents_a WHERE explanation_filename=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?))", [sanitize(req.params.explanation_filename), req.access_token, req.access_token], (err, row) => {
    if (err) return res.sendStatus(403);
    console.log(sanitize(req.params.explanation_filename))
    if (Object.values(row)[0]) {// TODO this can't be the only way of doing this
      //  console.log("serving", path.join(__dirname , "./import/explanations/html", sanitize(req.params.explanation_filename)+".html"))
      res.sendFile(path.join(__dirname, "./explanations/html", sanitize(req.params.explanation_filename) + ".html"))
    } else {
      // not permitted
      return res.sendStatus(403);
    }
  })

})

// phase 4: just as phase 2, just writes to another table
app.get("/documentPhase4/:documentNr", (req, res, next) => { authMiddlewarePhase(req, res, next, 4) }, (req, res) => {
  db.get("SELECT * FROM documents_b WHERE document_nr=? and detector = (SELECT detector FROM users WHERE access_token=?) and explainer = (SELECT explainer FROM users WHERE access_token=?)", [req.params.documentNr, req.access_token, req.access_token], (err, row) => {
    if (err) return res.sendStatus(500);

    if (row == undefined) {
      res.sendStatus(404);
      return
    }
    res.json(row)
  })
})
app.post("/submitPhase4", (req, res, next) => { authMiddlewarePhase(req, res, next, 4) }, (req, res) => {


  db.run(
    `INSERT INTO responses_phase_4 (user_id, document_nr, label) VALUES((SELECT ID FROM users WHERE access_token = ?),?,?);`,
    [req.access_token, req.body.ID, req.body.label],
    (error) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      } else {
        res.sendStatus(201);
      }
    }
  );

})
app.post("/submitParticipantInfo", (req, res, next) => { authMiddlewarePhase(req, res, next, -1) }, (req, res) => {

  db.run(
    `INSERT OR REPLACE INTO participant_info (user_id, has_seen_explanation_methods_before, has_seen_SHAP_before, has_seen_LIME_before, has_seen_ANCHOR_before,
      has_seen_OTHERS_before, level_of_expertise, familiarity_with_chatgpt, prefers_monochromatic_methods) VALUES((SELECT ID FROM users WHERE access_token = ?),?,?,?,?,?,?,?,?);`,
    [
      req.access_token,
      req.body?.has_seen_explanation_methods_before,
      req.body?.has_seen_SHAP_before,
      req.body?.has_seen_LIME_before,
      req.body?.has_seen_ANCHOR_before,
      req.body?.has_seen_OTHERS_before,
      req.body?.level_of_expertise,
      req.body?.familiarity_with_chatgpt,
      req.body?.prefers_monochromatic_methods
    ],
    (error) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      } else {
        res.sendStatus(201);
      }
    }
  );

})
app.post("/submitPhase3", (req, res, next) => { authMiddlewarePhase(req, res, next, 3) }, (req, res) => {

  try {
    console.log(req.body)
    for (const [question_name, label] of Object.entries(req.body)) {
      if (question_name == "document_nr") {
        continue;
      }
      const question_nr = (/-q(.*)-/gm).exec(question_name)[1];
      console.log(req.access_token, req.body.document_nr, question_nr, label)
      db.run(
        `INSERT INTO responses_phase_3 (user_id, document_nr, question_nr, label) VALUES((SELECT ID FROM users WHERE access_token = ?),?,?, ?);`,
        [req.access_token, req.body.document_nr, question_nr, label],
        (error) => {
          if (error) {
            console.error(error.message);
            console.log(error)
          }
        }
      );
    }
  } catch (error) {
    console.log(error)
    res.sendStatus(500);
    return;
  }
  res.sendStatus(201);
  return


})
// util endpoints
app.get("/state", authMiddleware, (req, res) => {
  db.get("SELECT * FROM users WHERE access_token=?", [req.access_token], (err, row) => {
    if (err) return res.sendStatus(500);

    if (row == undefined) {
      res.sendStatus(404);
      return
    }
    res.json({
      current_phase: row.current_phase,
      document_order_a: row.document_order_a,
      document_order_b: row.document_order_b,
      explainer: row.explainer,
      detector: row.detector // TODO this is for simulatability.ipynb
    })
  })
})

app.get("/getParticipantInfo", (req, res, next) => { authMiddlewarePhase(req, res, next, -1) }, (req, res) => {


  db.all(
    `SELECT * FROM participant_info  WHERE user_id = (SELECT ID FROM users WHERE access_token = ?)`,
    [req.access_token],
    (error, rows) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      } else {
        res.send(rows)
      }
    }
  );

})

app.get("/getPhase4", (req, res, next) => { authMiddlewarePhase(req, res, next, 4) }, (req, res) => {


  db.all(
    `SELECT label, document_nr, max(timestamp) FROM responses_phase_4 WHERE user_id = (SELECT ID FROM users WHERE access_token = ?) group by document_nr`,
    [req.access_token],
    (error, rows) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      } else {
        res.send(rows)
      }
    }
  );

})
app.get("/getPhase2", (req, res, next) => { authMiddlewarePhase(req, res, next, 2) }, (req, res) => {


  db.all(
    `SELECT label, document_nr, max(timestamp) FROM responses_phase_2 WHERE user_id = (SELECT ID FROM users WHERE access_token = ?) group by document_nr;`,
    [req.access_token],
    (error, rows) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      } else {
        res.send(rows)
      }
    }
  );

})

app.get("/getPhase3", (req, res, next) => { authMiddlewarePhase(req, res, next, 3) }, (req, res) => {


  db.all(
    `SELECT label, document_nr, question_nr, max(timestamp) FROM responses_phase_3 WHERE user_id = (SELECT ID FROM users WHERE access_token = ?) group by document_nr, question_nr;`,
    [req.access_token],
    (error, rows) => {
      if (error) {
        console.error(error.message);
        console.log(error)
        res.sendStatus(500);
      } else {
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

app.get("/auth/:access_token", (req, res) => {
  console.log(req.params.access_token)
  db.get("SELECT EXISTS (SELECT 1 FROM users WHERE access_token=?)", [req.params.access_token], (err, row) => {
    if (err) return res.sendStatus(403);
    if (Object.values(row)[0]) {// TODO this can't be the only way of doing this
      res.json(jwt.sign({ access_token: req.params.access_token }, process.env.TOKEN_SECRET, { expiresIn: 60 * 60 * 24 * 30 }));
    } else {
      // no such token
      console.log("no such token")
      return res.sendStatus(403);
    }
  })

})
app.get("/:access_token", (req, res) => {
  res.sendFile(path.join(__dirname, "/build/index.html"))
})

async function getDataDump(access_token) {
  let user_data = {};
  let promises = [
    new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE access_token = ?", [access_token], (err, row) => {
        if (err) reject()
        user_data.user = row
        resolve()
      })
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT * FROM participant_info WHERE user_id = (SELECT ID from users WHERE access_token = ?)", [access_token], (err, row) => {
        if (err) reject()
        user_data.participant_info = row
        resolve()
      })
    }),
    new Promise((resolve, reject) => {
      db.all("SELECT label, document_nr, max(timestamp) as timestamp_ FROM responses_phase_2 WHERE user_id = (SELECT ID FROM users WHERE access_token = ?) group by document_nr", [access_token], (err, rows) => {
        if (err) reject()
        user_data.responses_phase_2 = rows.map(({ timestamp_, ...f }) => f)
        resolve()
      })
    }),
    new Promise((resolve, reject) => {
      db.all("SELECT label, document_nr, question_nr, max(timestamp) as timestamp_ FROM responses_phase_3 WHERE user_id = (SELECT ID FROM users WHERE access_token = ?) group by document_nr", [access_token], (err, rows) => {
        if (err) reject()
        user_data.responses_phase_3 = rows.map(({ timestamp_, ...f }) => f)
        resolve()
      })
    }),
    new Promise((resolve, reject) => {
      db.all("SELECT label, document_nr, max(timestamp) as timestamp_ FROM responses_phase_4 WHERE user_id = (SELECT ID FROM users WHERE access_token = ?) group by document_nr", [access_token], (err, rows) => {
        if (err) reject()
        user_data.responses_phase_4 = rows.map(({ timestamp_, ...f }) => f)
        resolve()
      })
    }),


  ]
  await Promise.all(promises)
  return user_data
}

app.get("/api/dump", authMiddleware, async (req, res) => {
  res.sendFile(await createPDF(req.access_token))
});

async function createPDF(access_token){
  return await new Promise(async (resolve, reject) =>{
    const filename = access_token + "-backup.pdf"
    const out = path.join(__dirname, "backup", filename)
  
    let user_data = await getDataDump(access_token);
    const encoded = JSON.stringify(user_data);
    const chunks = encoded.match(/.{1,1000}/g);
    const doc = new pdfkit({ size: 'A5' });
    const writeStream = fs.createWriteStream(out);
    doc.pipe(writeStream);
  
    doc.text("This is a backup of your responses.")
    doc.fontSize(10);
    doc.text("All data was successfully submitted, no further action is required on your part.")
    doc.fontSize(9);
    doc.text("Please hold on to this file just in case.")
    doc.text(" ")
    doc.fontSize(5);
    doc.text(" ")
    doc.text(JSON.stringify(user_data))
    for (let i = 0; i < chunks.length; i++) {
      await new Promise((resolve, reject) => {
        bwipjs.toBuffer({
          bcid: 'pdf417',       
          text: chunks[i], 
          rotate: "L",
          padding: 10,
          height: 74
        },
          (err, png) => {
            if (err) {
              reject()
            } else {
              if(i%2 == 0){doc.addPage()}
              doc.image(png, (209*(i%2)), 10, { width: 209 })
              doc.text(i+1 + "/" + chunks.length + " " + access_token, (209*(i%2))+10, 1)
              resolve()
            }
          });
      })
    }
    doc.end();
    writeStream.on('finish', function () {
      resolve(out)
    });
  })
  

}



async function offSiteBackup(access_token=null){
  if(process.env.BACKUP_HOST){
    try {
      const client = await Client({
        host: process.env.BACKUP_HOST,
        port: process.env.BACKUP_PORT,
        username: process.env.BACKUP_USERNAME,
        privateKey: fs.readFileSync(path.join(process.env.BACKUP_PRIVATE_KEY), "utf8"),
    
      })
      if(process.env.BACKUP_DESTINATION_DIR_PDF && access_token){
        const filename = access_token + "-backup.pdf"
        const filepath = path.join(__dirname, "backup", filename)
        await createPDF(access_token);
        console.log(filepath)
        await client.uploadFile(filepath, process.env.BACKUP_DESTINATION_DIR_PDF + filename,)
      }
      if(process.env.BACKUP_DESTINATION_DIR_DB){
        await client.uploadFile(db_path, process.env.BACKUP_DESTINATION_DIR_DB + Math.floor(Date.now() /1000) + "-db.db" )
      }

      client.close()
    } catch (e) {
      console.log(e)
    }
  }

}
offSiteBackup("AAAAAA").then(exit)