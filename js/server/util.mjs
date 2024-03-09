import db from "./db.mjs"
import path from 'path';

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from "./logger.mjs";
import { isParticipantInfoComplete } from "./phases/phase-1.mjs";
import { isPhase2Complete } from "./phases/phase2.mjs";
import { isPhase3Complete } from "./phases/phase3.mjs";
import { isPhase4Complete } from "./phases/phase4.mjs";
import { offSiteBackup } from "./backup.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function serveIndexHTML(req, res) {
  res.sendFile(path.join(__dirname, "../../build/index.html"))
}

export function getState(req, res) {
  db.get("SELECT * FROM users WHERE access_token=?", [req.access_token], (err, row) => {
    if (err) {
      logger.log("error", `Could not query users table for getState ${req.access_token}`)
      return res.sendStatus(500)
    };

    if (row == undefined) {
      res.sendStatus(404);
      logger.log("info", `${req.access_token} not in users`)
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
}

export async function completeCurrentPhase(req, res) {
  db.get("SELECT current_phase, prefers_monochromatic_methods FROM users JOIN participant_info on users.ID = participant_info.user_id WHERE access_token = ?", [req.access_token], async (err, row) => {

    if (err || row == undefined) {
      logger.log("error", `Error getting data to complete phase for ${req.access_token}`)
      return res.sendStatus(500);
    }

    if (req.body?.expected != row.current_phase + 1) {
      logger.log("info", `${req.access_token} already in phase ${req.body?.expected}`)
      res.sendStatus(208);
      return
    }

    if(! await userMayAdvancePhase(row.current_phase, req.access_token)){
      res.sendStatus(405);
      logger.log("info", `${req.access_token} attempted to complete phase${row.current_phase} but not all responses where stored in the database`)
      return;
    }
    db.serialize(() => {
      if (row.current_phase == -1) { // assign group
        let query;
        if (row.prefers_monochromatic_methods == "yes") {
          // select where explainer = Anchors, with the least participants assigned/completed
          // explainer = anchors, detectors order by num_assigned, num_completed
          query = `WITH choice as (WITH completed as (SELECT count(users.detector) as num_completed , groups.detector, groups.explainer FROM groups LEFT JOIN users ON groups.explainer = users.explainer AND groups.detector = users.detector  WHERE users.current_phase = 5 AND groups.explainer = "Anchor_Explainer" GROUP BY groups.explainer, groups.detector),
          assigned as (SELECT count(users.detector) as num_assigned , groups.detector, groups.explainer FROM groups LEFT JOIN users ON groups.explainer = users.explainer AND groups.detector = users.detector  WHERE groups.explainer = "Anchor_Explainer" GROUP BY groups.explainer, groups.detector)
          SELECT * from assigned LEFT JOIN completed ON completed.detector = assigned.detector AND completed.explainer = assigned.explainer ORDER BY num_assigned ASC, num_completed ASC,  explainer DESC, RANDOM() ASC)
          UPDATE users SET detector = (SELECT detector from choice), explainer = (SELECT explainer from choice) WHERE access_token = ?`
        } else {
          // select the one with the least participants assigned/completed
          // order by num_assigned, num_completed, (lime, shap, anchors), random detector
          query = `WITH choice as (WITH completed as (SELECT count(users.detector) as num_completed , groups.detector, groups.explainer FROM groups LEFT JOIN users ON groups.explainer = users.explainer AND groups.detector = users.detector  WHERE users.current_phase = 5 GROUP BY groups.explainer, groups.detector),
          assigned as (SELECT count(users.detector) as num_assigned , groups.detector, groups.explainer FROM groups LEFT JOIN users ON groups.explainer = users.explainer AND groups.detector = users.detector  GROUP BY groups.explainer, groups.detector)
          SELECT * from assigned LEFT JOIN completed ON completed.detector = assigned.detector AND completed.explainer = assigned.explainer ORDER BY num_assigned ASC, num_completed ASC,  explainer DESC, RANDOM() ASC)
          UPDATE users SET detector = (SELECT detector from choice), explainer = (SELECT explainer from choice) WHERE access_token = ?`
        }
        db.run(query, [req.access_token], (err, row) => {
          if (err) {
            logger.log("error", `Could not assign ${req.access_token} a group`)
          }
        })

      }
      db.run("UPDATE users SET current_phase =? WHERE access_token = ?", [req.body.expected, req.access_token], (err, row) => {
        if (err) {
          logger.log("error", `Could not advance phase for ${req.access_token}`)
          return res.sendStatus(403);
        }
        return res.sendStatus(200);
      })
      db.run("INSERT INTO phase_start_times (phase, user_id) VALUES (?, (SELECT ID FROM users WHERE access_token=?))", [req.body.expected, req.access_token], (err, row) => {
        if (err) {
          logger.log("error", `Could track start time of phase${req.body.expected} for ${req.access_token} ${err}`)
          
        }
      })

      if (row.current_phase == 4) { // once phase 4 is completed
        offSiteBackup(req.access_token);
      }

    })
  });

}

async function userMayAdvancePhase(phase, access_token){
  switch(phase){
    case -1:
      return await isParticipantInfoComplete(access_token);
    case 0:
      return true;
    case 1:
      return true;
    case 2:
      return await isPhase2Complete(access_token);
    case 3:
      return await isPhase3Complete(access_token);
    case 4:
      return await isPhase4Complete(access_token);
  }
}
/**
 * Helper to run SELECT EXIST queries
 * @param {*} row result object {query: int} from a db.get(SELECT EXISTS (.)")
 * @returns  true if row is "1"
 */
export function sqliteExists(row) {
  if (row && Object.values(row).length == 1) {
    return Object.values(row)[0] == 1
  } else {
    return false;
  }

}