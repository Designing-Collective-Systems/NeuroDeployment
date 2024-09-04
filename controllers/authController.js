const bcrypt = require('bcrypt');
const pgClient = require('../db');  

const saltRounds = 10;

exports.register = async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const avatarPath = req.file ? `/uploads/${req.file.filename}` : null;

    await pgClient.query(
      'INSERT INTO users (username, password, avatar) VALUES ($1, $2, $3)',
      [username, hashedPassword, avatarPath]
    );

    res.json({ msg: 'User registered successfully!' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ msg: 'Error registering user' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pgClient.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.userId = user.id;
        res.json({ msg: 'Login successful!' });
      } else {
        res.status(401).json({ msg: 'Incorrect password' });
      }
    } else {
      res.status(404).json({ msg: 'User not found' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ msg: 'Error logging in' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.json({ msg: 'Logged out successfully!' });
};

