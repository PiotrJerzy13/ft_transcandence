import bcrypt from 'bcrypt';

const password = 'admin123';
const hashFromSeed = '$2a$10$v5GwmgtkMBR3RhAb9zrX/u3Kc5vV/HC.mY6vLD2fI4zqGPOS.cvqm';

console.log('Testing password hash...');
console.log('Password:', password);
console.log('Hash from seed:', hashFromSeed);

// Test if the hash matches the password
const isValid = await bcrypt.compare(password, hashFromSeed);
console.log('Hash matches password:', isValid);

// Generate a new hash for comparison
const newHash = await bcrypt.hash(password, 10);
console.log('New hash for same password:', newHash);

// Test the new hash
const newHashValid = await bcrypt.compare(password, newHash);
console.log('New hash matches password:', newHashValid); 