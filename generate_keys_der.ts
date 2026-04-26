import { generateKeyPairSync } from 'crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'der' }, // DER format
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

console.log('--- PUBLIC KEY (Base64 - Copy this to Revolut) ---');
console.log(publicKey.toString('base64'));
console.log('\n--- PRIVATE KEY (Add this to .env as REVOLUT_PRIVATE_KEY) ---');
console.log(privateKey);
