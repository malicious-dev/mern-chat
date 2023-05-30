//create a server with mongodb connection 
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const User = require('./models/user');

const app = express();

//enable cors
app.use(cors(
  {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
));
app.use(cookieParser());

//connect to mongodb
mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise;

//middleware
app.use(bodyParser.json());

//initialize routes
app.get('/me', async (req, res, next) => {
  res.send('Working')
});

// app.use('/api', require('./routes/api'));
app.post('/register', async (req, res, next) => {
  const { username, password } = req.body;
  const checkUsername = await User.findOne({ username: username });
  if (checkUsername) {
    return res.status(422).send({ error: 'Username already exists' });
  }
  const createUser = await User.create({ username, password });
  jwt.sign({ userId: createUser._id, username }, process.env.SECRET_KEY, function (err, token) {
    if (err) {
      return res.status(422).send({ error: err.message });
    }
    res.cookie('token', token).status(201).json({
      id: createUser._id,
    });
  });
});


app.get('/profile', async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ error: 'You must be logged in' });
  } else {
    jwt.verify(token, process.env.SECRET_KEY, async (err, payload) => {
      if (err) {
        return res.status(401).send({ error: 'You must be logged in' });
      }
      res.json(payload)
    })
  }

});


//error handling middleware
app.use(function (err, req, res, next) {
  //console.log(err);
  res.status(422).send({ error: err.message });
}
);

//listen for requests
app.listen(process.env.PORT, function () {
  console.log('now listening for requests ' + process.env.PORT);
}
);
