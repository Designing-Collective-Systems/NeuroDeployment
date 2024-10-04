const bcrypt = require('bcrypt');
const pgClient = require('../db');  

const saltRounds = 10;

exports.register = async (req, res) => {
  const { username, password, userType } = req.body;
  try {
    const normalizedUserType = userType.toLowerCase();
    if (!['participant', 'caregiver'].includes(normalizedUserType)) {
      return res.status(400).json({ success: false, msg: 'Invalid user type' });
    }

    // 加密用户密码
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const avatarPath = req.file ? `/uploads/${req.file.filename}` : null;

    // 将用户信息存入数据库
    await pgClient.query(
      'INSERT INTO users (username, password, role, avatar) VALUES ($1, $2, $3, $4)',
      [username, hashedPassword, normalizedUserType, avatarPath]
    );

    res.json({ success: true, msg: 'User registered successfully!' });
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
        req.session.username = user.username;  
        req.session.userType = user.role;     

        res.json({ 
          success: true, 
          msg: 'Login successful!', 
          userType: user.role,  
          userId: user.id       
        });
      } else {
        res.status(401).json({ success: false, msg: 'Incorrect password' });
      }
    } else {
      res.status(404).json({ success: false, msg: 'User not found' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, msg: 'Error logging in' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ msg: 'Error logging out' });
    }
    res.json({ msg: 'Logged out successfully!' });
  });
};