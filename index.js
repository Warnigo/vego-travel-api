const express = require('express')
const routes = require('./routes/api.js')
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(routes)

app.listen(3000, () => {
    console.log('Server running on port 3000')
    console.log('http://127.0.0.1:3000')
})
