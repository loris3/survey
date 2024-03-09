import db from "./db.mjs"
import logger from "./logger.mjs"

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from "fs"
import path from 'path'
import sizeOf from "buffer-image-size";
import { Client } from 'node-scp'
import pdfkit from 'pdfkit'
import bwipjs from 'bwip-js';
const __dirname = dirname(fileURLToPath(import.meta.url));


export async function getPDF(req, res) {
    res.sendFile(await createPDF(req.access_token))
}


export async function offSiteBackup(access_token = null) {
    if (process.env.NODE_ENV == 'production' && process.env.BACKUP_HOST) {
        try {
            const client = await Client({
                host: process.env.BACKUP_HOST,
                port: process.env.BACKUP_PORT,
                username: process.env.BACKUP_USERNAME,
                privateKey: fs.readFileSync(path.join(process.env.BACKUP_PRIVATE_KEY), "utf8"),

            })
            if (process.env.BACKUP_DESTINATION_DIR_PDF && access_token) {
                const filename = access_token + "-backup.pdf"
                const filepath = path.join(__dirname, "../../backup", filename)
                try {
                    await createPDF(access_token);
                    await client.uploadFile(filepath, process.env.BACKUP_DESTINATION_DIR_PDF + filename,)
                } catch (error) {
                    logger.log("error", `Error writing PDF to ${process.env.BACKUP_HOST}:${process.env.BACKUP_DESTINATION_DIR_PDF + filename} ${error}`)
                    return
                }
                logger.log("info", `Wrote PDF to ${process.env.BACKUP_HOST}:${process.env.BACKUP_DESTINATION_DIR_PDF + filename}`)
            }
            if (process.env.BACKUP_DESTINATION_DIR_DB) {
                const db_backup_destination = process.env.BACKUP_DESTINATION_DIR_DB + Math.floor(Date.now() / 1000) + "-db.db"
                try {
                    await client.uploadFile(path.join(__dirname, "../../db.db"), db_backup_destination)
                } catch (error) {
                    logger.log("error", `Error writing DB to ${process.env.BACKUP_HOST}:${db_backup_destination} ${error}`)
                    return;
                }
                logger.log("info", `Wrote DB to ${process.env.BACKUP_HOST}:${db_backup_destination}`)
            }

            client.close()
        } catch (e) {
            logger.log("error", `Error during offsite backup: ${e?.message}`)
        }
    }else{
        logger.log("info", `Skipping offsite backup for ${access_token}`)
    }

}
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

            db.all("SELECT label, document_nr, question_nr, max(timestamp) as timestamp_ FROM responses_phase_3 WHERE user_id = (SELECT ID FROM users WHERE access_token = ?) group by document_nr, question_nr;", [access_token], (err, rows) => {
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




async function createPDF(access_token) {
    return await new Promise(async (resolve, reject) => {
        const filename = access_token + "-backup.pdf"
        const out = path.join(__dirname, "../../backup", filename)

        // encode data
        let user_data = await getDataDump(access_token);
        const encoded = JSON.stringify(user_data);
        const chunks = encoded.match(/.{1,750}/g);

        // create document
        const doc = new pdfkit({ size: 'A4', margin: 10 });
        const writeStream = fs.createWriteStream(out);
        doc.pipe(writeStream);
        const code_width = 147;
        const PADDING = 5;

        // write text
        doc.text("This is a backup of your responses.")
        doc.fontSize(10);
        doc.text("All data was successfully submitted, no further action is required on your part.")
        doc.fontSize(9);
        doc.text("Please hold on to this file just in case.")
        doc.text(" ")
        doc.fontSize(5);
        doc.text(" ")
        doc.text(JSON.stringify(user_data))


        // generate pdf417 codes
        let x = 0;
        let y = doc.y + PADDING;
        let heights = [];
        for (let i = 0; i < chunks.length; i++) {
            await new Promise((resolve, reject) => {
                bwipjs.toBuffer({
                    bcid: 'pdf417',
                    text: chunks[i],
                    rotate: "L",
                    padding: 5,
                    height: 74
                },
                    (err, png) => {
                        if (err) {
                            reject()
                        } else {
                            doc.fontSize(5);
                            doc.text(i + 1 + "/" + chunks.length + " " + access_token, x + 10, y)
                            doc.image(png, x + 5, y + 5, { width: code_width })
                            const { width, height } = sizeOf(png);
                            heights.push((height) * (code_width / width));
                            x += code_width;
                            if (x + code_width > doc.page.width) {
                                x = 0;
                                y += 5 + Math.ceil(Math.max(...heights.slice(-4)))
                            }
                            if (y + 5 + Math.ceil(Math.max(...heights.slice(-4))) > doc.page.height) {
                                x = 0;
                                y = PADDING;
                                doc.addPage();
                            }
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