import db from "./js/server/db.mjs";
import pdfkit from 'pdfkit'
import fs from "fs"
import path from 'path'
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
import bwipjs from 'bwip-js';


async function writeQr(x,y,access_token, doc){
    return new Promise((resolve, reject) => {
        bwipjs.toBuffer({
            bcid: 'qrcode',
            text: "https://survey.example.com/"+access_token,
            padding: 8,
   
        },
            (err, png) => {
                if (err) {
                    reject()
                } else {
                   
                    doc.image(png, x , y , { width: cell_height })
                  
                    resolve()
                }
            });
    })
}
const cell_height = 73;
async function createPDF(rows) {
    return await new Promise(async (resolve, reject) => {
        const out = path.join(__dirname, "/tokens", "tokens.pdf")

     
        // create document
        const margin = 10;
        const doc = new pdfkit({ size: 'A4', margin: margin });
        const writeStream = fs.createWriteStream(out);
        doc.pipe(writeStream);
        
        const page_width = doc.page.width - 2* margin;
        const cell_width = page_width / 3;
        

        let x = margin;
        let y = margin;
        for(let i in rows){
            let row = rows[i]
            doc.font("./fonts/Roboto/Roboto-Regular.ttf")
            doc.fontSize(12);
            doc.rect(x, y, cell_width, cell_height).stroke();
            doc.fillColor('lightgray').text("https://", x+5 , y+5,{continued: true}).fillColor('black').text("survey.example.com")

            doc.fontSize(20);
            
            doc.text(row.access_token, x +5, y+(cell_height/2))
            await writeQr(x+cell_width-cell_height,y,row.access_token, doc)


    
            x += cell_width;
            if((x + cell_width) > doc.page.width){
                x = margin;
                y += cell_height;
            }
            if((y + cell_height) > doc.page.height){
                x = margin;
                y = margin;
                doc.addPage();
            }

   
        }


        doc.end();
        writeStream.on('finish', function () {
            resolve(out)
        });
    })


}

db.all("SELECT * FROM users WHERE current_phase = -1", (err, rows) => {
    createPDF(rows)
})