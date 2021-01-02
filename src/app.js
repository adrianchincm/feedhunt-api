const express = require('express')
require('./db/mongoose.js')
const userRouter = require('./routers/user')
const allowCors = require('./middleware/allow-cors')
const cors = require('cors');
const postRouter = require('./routers/post')
const productRouter = require('./routers/product')
const cartRouter = require('./routers/cart')

const app = express()

app.use(cors())
// app.use(allowCors);
app.use(express.json())
app.use(userRouter)
app.use(postRouter)
app.use(productRouter)
app.use(cartRouter)

module.exports = app