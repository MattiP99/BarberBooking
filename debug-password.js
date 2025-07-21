
const bcrypt = require('bcrypt');

async function debugPassword() {
  const password = 'password123';
  
  // Test the hash we're currently using
  const currentHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  console.log('Testing current hash...');
  console.log('Password:', password);
  console.log('Hash:', currentHash);
  const isValid1 = await bcrypt.compare(password, currentHash);
  console.log('Validation result:', isValid1);
  
  // Generate a fresh hash
  console.log('\nGenerating fresh hash...');
  const freshHash = await bcrypt.hash(password, 10);
  console.log('Fresh hash:', freshHash);
  const isValid2 = await bcrypt.compare(password, freshHash);
  console.log('Fresh hash validation:', isValid2);
}

debugPassword().catch(console.error);
