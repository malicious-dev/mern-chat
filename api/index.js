//create a server with mongodb connection 
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs')
const ws = require('ws');
const User = require('./models/user');

const app = express();
const bcryptSalt = bcrypt.genSaltSync(10);

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
  if (username === '' || password === '') {
    return res.status(422).send({ error: 'You must provide username and password' });
  }
  const checkUsername = await User.findOne({ username: username });
  if (checkUsername) {
    return res.status(422).send({ error: 'Username already exists' });
  }
  const hashPassword = await bcrypt.hash(password, bcryptSalt);
  const createUser = await User.create({ username, password: hashPassword });
  jwt.sign({ userId: createUser._id, username }, process.env.SECRET_KEY, function (err, token) {
    if (err) {
      return res.status(422).send({ error: err.message });
    }
    res.cookie('token', token).status(201).json({
      id: createUser._id,
    });
  });
});

//login 
app.post('/login', async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: username });
  if (!user) {
    return res.status(422).send({ error: 'Invalid username or password' });
  }
  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) {
    return res.status(422).send({ error: 'Invalid username or password' });
  }
  jwt.sign({ userId: user._id, username }, process.env.SECRET_KEY, function (err, token) {
    if (err) {
      return res.status(422).send({ error: err.message });
    }
    res.cookie('token', token).status(200).json({
      id: user._id,
    });
  }
  );
})

//profile
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
const server = app.listen(5000);

const wss = new ws.WebSocketServer({ server });

wss.on('connection', (connection, req, res) => {
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies.split(';').find(cookie => cookie.includes('token='));
    if (tokenCookieString) {
      const token = tokenCookieString.split('=')[1];
      jwt.verify(token, process.env.SECRET_KEY, async (err, payload) => {
        if (err) {
          return console.log(err);
        }
        connection.userId = payload.userId;
        connection.username = payload.username;
      })
    }
  }
  [...wss.clients].forEach(client => {
    client.send(JSON.stringify(
      {
        online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))

      }
    ))
    // if (client.readyState === ws.OPEN) {
    //   client.send(JSON.stringify({ type: 'userConnected', userId: connection.userId, username: connection.username }));
    // }
  }
  );
}
);
