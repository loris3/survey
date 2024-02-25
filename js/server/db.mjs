import dotenv from 'dotenv'
import fs from "fs"
import sqlite3 from 'sqlite3';
import logger from './logger.mjs';

if (!fs.existsSync('.env')) {
    const msg = "No .env file. Run 'node setup.js' first!";
    logger.log("emerg", msg)
    throw new Error(msg)
}
dotenv.config();


const db_path = "./db.db"


const db = new sqlite3.Database(db_path, (error) => {
    logger.log({
        level: "info",
        message: `New DB connection`
      })
    if (error) {
        const msg = "Can't establish DB connection";
        logger.log("emerg", msg)
        throw new Error(msg)
    }
});

export default db;