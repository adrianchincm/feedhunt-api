const express = require('express')
require('./db/mongoose.js')
const userRouter = require('./routers/user')
const allowCors = require('./middleware/allow-cors')
const postRouter = require('./routers/post')

const app = express()

app.use(allowCors);
app.use(express.json())
app.use(userRouter)
app.use(postRouter)

module.exports = app