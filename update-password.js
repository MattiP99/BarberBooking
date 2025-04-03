import bcrypt from 'bcrypt';

async function generateHash() {
  // Generate a hash for password 'admin123'
  const hash = await bcrypt.hash('admin123', 10);
  console.log('Generated hash for admin123:', hash);
}

generateHash();