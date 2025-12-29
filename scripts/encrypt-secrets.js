#!/usr/bin/env node

/**
 * Secure Secret Management Tool
 *
 * This tool encrypts sensitive environment variables so they can be safely
 * stored and viewed by AI assistants without exposing actual secrets.
 *
 * Usage:
 *   node scripts/encrypt-secrets.js encrypt    # Encrypt secrets
 *   node scripts/encrypt-secrets.js decrypt    # Decrypt and show secrets
 *   node scripts/encrypt-secrets.js setup      # First-time setup
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ALGORITHM = 'aes-256-gcm';
const KEY_FILE = path.join(process.env.HOME, '.vibeconnect-key');
const ENCRYPTED_DIR = path.join(__dirname, '..', '.encrypted');

// Ensure encrypted directory exists
if (!fs.existsSync(ENCRYPTED_DIR)) {
  fs.mkdirSync(ENCRYPTED_DIR, { recursive: true });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Generate or load encryption key
function getEncryptionKey() {
  if (fs.existsSync(KEY_FILE)) {
    return fs.readFileSync(KEY_FILE, 'utf8').trim();
  }

  // Generate new key
  const key = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(KEY_FILE, key, { mode: 0o600 }); // Owner read/write only
  console.log('✅ New encryption key generated and saved to:', KEY_FILE);
  console.log('⚠️  IMPORTANT: Back up this file! If you lose it, you cannot decrypt your secrets.');
  return key;
}

// Encrypt a value
function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    encrypted
  };
}

// Decrypt a value
function decrypt(encryptedData, key) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(key, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Interactive secret collection
async function collectSecrets() {
  console.log('\n🔒 Secure Secret Collection');
  console.log('Enter your secrets. They will be encrypted locally.\n');

  const secrets = {};

  // Backend secrets
  console.log('--- Backend Secrets ---');
  secrets.OPENAI_API_KEY = await question('OpenAI API Key: ');
  secrets.DATABASE_URL = await question('Database URL (press enter to skip if using default): ') ||
    'postgresql://darthvader@localhost:5432/vibeconnect';
  secrets.BASE_RPC_URL = await question('Alchemy Base RPC URL: ');

  // Contract deployment secrets
  console.log('\n--- Contract Deployment Secrets ---');
  secrets.PRIVATE_KEY = await question('Deployment Wallet Private Key (or press enter to skip): ') || '';
  secrets.BASESCAN_API_KEY = await question('Basescan API Key (optional, press enter to skip): ') || '';

  // Frontend secrets (these are actually safe to expose, but we'll include them for completeness)
  console.log('\n--- Frontend Secrets ---');
  secrets.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = await question('WalletConnect Project ID: ') ||
    'a3daa77487c8eb6cc5f861ef4d01f6fa';
  secrets.NEXT_PUBLIC_API_URL = await question('Backend API URL (press enter for default): ') ||
    'http://localhost:8000';

  return secrets;
}

// Save encrypted secrets
function saveEncryptedSecrets(secrets, key) {
  const encrypted = {};

  for (const [name, value] of Object.entries(secrets)) {
    if (value) {
      encrypted[name] = encrypt(value, key);
    }
  }

  fs.writeFileSync(
    path.join(ENCRYPTED_DIR, 'secrets.json'),
    JSON.stringify(encrypted, null, 2)
  );

  console.log('\n✅ Secrets encrypted and saved to .encrypted/secrets.json');
}

// Load and decrypt secrets
function loadSecrets(key) {
  const encryptedFile = path.join(ENCRYPTED_DIR, 'secrets.json');

  if (!fs.existsSync(encryptedFile)) {
    console.error('❌ No encrypted secrets found. Run "setup" first.');
    process.exit(1);
  }

  const encrypted = JSON.parse(fs.readFileSync(encryptedFile, 'utf8'));
  const secrets = {};

  for (const [name, encryptedData] of Object.entries(encrypted)) {
    secrets[name] = decrypt(encryptedData, key);
  }

  return secrets;
}

// Generate .env files from decrypted secrets
function generateEnvFiles(secrets) {
  // Backend .env
  const backendEnv = `# Auto-generated from encrypted secrets
# To update: run "node scripts/encrypt-secrets.js setup"

OPENAI_API_KEY=${secrets.OPENAI_API_KEY}
DATABASE_URL=${secrets.DATABASE_URL}
BASE_RPC_URL=${secrets.BASE_RPC_URL}
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'backend', '.env'),
    backendEnv
  );
  console.log('✅ Generated backend/.env');

  // Contracts .env
  const contractsEnv = `# Auto-generated from encrypted secrets
# To update: run "node scripts/encrypt-secrets.js setup"

PRIVATE_KEY=${secrets.PRIVATE_KEY}
BASE_RPC_URL=${secrets.BASE_RPC_URL}
BASESCAN_API_KEY=${secrets.BASESCAN_API_KEY}
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'contracts', '.env'),
    contractsEnv
  );
  console.log('✅ Generated contracts/.env');

  // Frontend .env.local
  const frontendEnv = `# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${secrets.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}

# Backend API URL
NEXT_PUBLIC_API_URL=${secrets.NEXT_PUBLIC_API_URL}
`;

  fs.writeFileSync(
    path.join(__dirname, '..', 'frontend', '.env.local'),
    frontendEnv
  );
  console.log('✅ Generated frontend/.env.local');
}

// Show secrets (for manual verification)
async function showSecrets(key) {
  const secrets = loadSecrets(key);

  console.log('\n🔓 Decrypted Secrets (DO NOT SHARE THIS OUTPUT):\n');
  console.log('--- Backend ---');
  console.log(`OPENAI_API_KEY: ${secrets.OPENAI_API_KEY.substring(0, 10)}...`);
  console.log(`DATABASE_URL: ${secrets.DATABASE_URL}`);
  console.log(`BASE_RPC_URL: ${secrets.BASE_RPC_URL}`);

  console.log('\n--- Contracts ---');
  console.log(`PRIVATE_KEY: ${secrets.PRIVATE_KEY ? secrets.PRIVATE_KEY.substring(0, 10) + '...' : '(not set)'}`);
  console.log(`BASESCAN_API_KEY: ${secrets.BASESCAN_API_KEY || '(not set)'}`);

  console.log('\n--- Frontend ---');
  console.log(`WALLETCONNECT_PROJECT_ID: ${secrets.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}`);
  console.log(`API_URL: ${secrets.NEXT_PUBLIC_API_URL}`);

  const confirm = await question('\nGenerate .env files from these secrets? (yes/no): ');
  if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
    generateEnvFiles(secrets);
  }
}

// Main command handler
async function main() {
  const command = process.argv[2];

  if (!command || command === 'help') {
    console.log(`
🔒 VibeConnect Secret Management Tool

Commands:
  setup     - First-time setup: collect and encrypt all secrets
  decrypt   - Decrypt secrets and generate .env files
  show      - Show decrypted secrets (partial, for verification)
  encrypt   - Re-encrypt secrets (if you've updated secrets.json manually)

Security:
  • Encryption key stored in: ${KEY_FILE}
  • Encrypted secrets stored in: ${ENCRYPTED_DIR}/secrets.json
  • Never commit .env files or the encryption key to git
  • The .encrypted/secrets.json file is safe to share with AI assistants
    `);
    rl.close();
    return;
  }

  const key = getEncryptionKey();

  switch (command) {
    case 'setup':
      const secrets = await collectSecrets();
      saveEncryptedSecrets(secrets, key);
      generateEnvFiles(secrets);
      console.log('\n✅ Setup complete! Your secrets are encrypted and .env files generated.');
      break;

    case 'decrypt':
      const decrypted = loadSecrets(key);
      generateEnvFiles(decrypted);
      console.log('\n✅ .env files generated from encrypted secrets.');
      break;

    case 'show':
      await showSecrets(key);
      break;

    case 'encrypt':
      // Re-encrypt existing secrets (useful if you manually edited secrets.json)
      const existing = loadSecrets(key);
      saveEncryptedSecrets(existing, key);
      console.log('\n✅ Secrets re-encrypted.');
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run "node scripts/encrypt-secrets.js help" for usage.');
  }

  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});
