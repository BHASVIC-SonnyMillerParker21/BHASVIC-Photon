// Import dependencies
const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const cors = require('cors')
const helmet = require('helmet')
const https = require('https')
const fs = require("fs")
// Import routes
const usersRouter = require('./routes/dbRoutes')

// Set default port for express app
const PORT = process.env.PORT || 9000

// Create express app
const app = express()

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true
}

app.use(helmet())
app.use(compression())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors(corsOptions)) // Use this after the variable declaration

// Implement books route
app.use('/PRDB', usersRouter)

// Implement 500 error route
app.use(function (err, req, res) {
  console.error(err.stack)
  res.status(404).send('Something is broken.')
})

// Implement 404 error route
app.use(function (req, res) {
  res.status(404).send('Sorry we could not find that.')
})

https
	.createServer(
	{
	key: fs.readFileSync("key.pem"),
	cert: fs.readFileSync("cert.pem"),
	},
	app
	)
	.listen(PORT, function() {
		console.log('HTTPS server running on: ' + PORT)
})
