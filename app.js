const path = require('path');
const express = require('express')
const reload = require('reload')
const app = express()
const port = 3002

app.use(express.static('./public'));


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
reload(app);