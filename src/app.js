const express = require('express')
require('./db/mongoose.js')
const userRouter = require('./routers/user')
// const taskRouter = require('./routers/task')

const app = express()

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept');
    next();
});
app.use(express.json())
app.use(userRouter)
// app.use(taskRouter)

module.exports = app

