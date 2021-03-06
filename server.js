const express = require('express');
const config = require('config');
const connectDB = require('./config/db');
const app = express();

connectDB();

//Init Middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => {
  res.send('API running');
});
const { body, validationResult } = require('express-validator');

//Defiing routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/post', require('./routes/api/post'));

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server Started on port ${PORT}`));
