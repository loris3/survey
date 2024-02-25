import db from "../db.mjs";
import logger from "../logger.mjs";
export function submitParticipantInfo(req, res){

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
          logger.log("error", `Error saving participant info for ${req.access_token}: ${JSON.stringify(req.body)}`)
          res.sendStatus(500);
        } else {
          res.sendStatus(201);
        }
      }
    );
  
  }
async function getParticipantInfo(access_token){
  return new Promise((resolve, reject) =>{
    db.get(
      `SELECT * FROM participant_info  WHERE user_id = (SELECT ID FROM users WHERE access_token = ?)`,
      [access_token],
      (error, row) => {
        if (error) {
          reject(error)
        } else {
          if(row){
            resolve(row)
          }else{
            resolve({})
          }
          
        }
      }
    );
  })
}
export async function sendParticipantInfo(req, res){
  try {
    const data = await getParticipantInfo(req.access_token);
    res.send(data);
  } catch (error) {
    logger.log("error", `Error sending participant info for ${req.access_token}`)
    res.sendStatus(500);
  }

}

export async function isParticipantInfoComplete(access_token){
  const data = await getParticipantInfo(access_token)
  return  ('has_seen_explanation_methods_before' in data && ["yes", "no"].includes(data.has_seen_explanation_methods_before)) &&
          ('level_of_expertise' in data && data.level_of_expertise != "") &&
          ('familiarity_with_chatgpt' in data && data.familiarity_with_chatgpt != "") &&
          ('prefers_monochromatic_methods' in data && ["yes", "no"].includes(data.prefers_monochromatic_methods))
}