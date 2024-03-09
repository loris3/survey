import express from 'express';
import {rateLimit} from 'express-rate-limit'
import logger from './js/server/logger.mjs'

import { sendParticipantInfo, submitParticipantInfo } from './js/server/phases/phase-1.mjs';
import { getPhase1 } from './js/server/phases/phase1.mjs';
import { getPhase2, sendResponsesPhase2, submitPhase2 } from './js/server/phases/phase2.mjs';
import { getExplanation, getPhase3, sendResponsesPhase3, submitPhase3 } from './js/server/phases/phase3.mjs';
import { getPhase4, sendResponsesPhase4, submitPhase4 } from './js/server/phases/phase4.mjs';
import { authMiddleware, authMiddlewarePhase, authenticate } from './js/server/auth.mjs';
import { completeCurrentPhase, getState, serveIndexHTML } from './js/server/util.mjs';
import { getPDF } from './js/server/backup.mjs';


const port = 3002

const app = express()
app.use(express.static('./build'));
app.use(express.json());

const limiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	limit: 10,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	skipSuccessfulRequests: true
})

// participant info ("phase -1")
app.post("/api/submitParticipantInfo", (req, res, next) => { authMiddlewarePhase(req, res, next, -1) }, submitParticipantInfo)
app.get("/api/getParticipantInfo", (req, res, next) => { authMiddlewarePhase(req, res, next, -1) }, sendParticipantInfo)

// phase 1
app.get("/api/documentPhase1/:documentNr", (req, res, next) => { authMiddlewarePhase(req, res, next, 1) }, getPhase1)

// phase 2
app.get("/api/documentPhase2/:documentNr", (req, res, next) => { authMiddlewarePhase(req, res, next, 2) }, getPhase2)
app.post("/api/submitPhase2", (req, res, next) => { authMiddlewarePhase(req, res, next, 2) }, submitPhase2)
app.get("/api/getPhase2", (req, res, next) => { authMiddlewarePhase(req, res, next, 2) }, sendResponsesPhase2)

// phase 3: now with explanations: this is not redundant with phase 1
app.get("/api/documentPhase3/:documentNr", (req, res, next) => { authMiddlewarePhase(req, res, next, 3) }, getPhase3)
app.get("/api/explanation/:explanation_filename", (req, res, next) => { authMiddlewarePhase(req, res, next, 3) }, getExplanation)
app.post("/api/submitPhase3", (req, res, next) => { authMiddlewarePhase(req, res, next, 3) }, submitPhase3)
app.get("/api/getPhase3", (req, res, next) => { authMiddlewarePhase(req, res, next, 3) }, sendResponsesPhase3)

// phase 4: just as phase 2, just writes to another table
app.get("/api/documentPhase4/:documentNr", (req, res, next) => { authMiddlewarePhase(req, res, next, 4) }, getPhase4)
app.post("/api/submitPhase4", (req, res, next) => { authMiddlewarePhase(req, res, next, 4) }, submitPhase4)
app.get("/api/getPhase4", (req, res, next) => { authMiddlewarePhase(req, res, next, 4) }, sendResponsesPhase4)

// other endpoints
app.get("/api/state", authMiddleware, getState)
app.get("/auth/:access_token", limiter, authenticate)
app.post("/api/completeCurrentPhase", authMiddleware, completeCurrentPhase)
app.get("/api/dump", authMiddleware, getPDF);
app.get("/:access_token", serveIndexHTML)


app.listen(port, () => {logger.log("info",`Listening on port ${port}`)})

