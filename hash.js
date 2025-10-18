const bcrypt = require('bcryptjs');

async function hashPassword() {
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const userHash = await bcrypt.hash('user123', salt);
  console.log('Hashed password for admin123:', adminHash);
  console.log('Hashed password for user123:', userHash);
}

hashPassword();