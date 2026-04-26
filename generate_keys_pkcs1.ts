import { generateKeyPairSync } from 'crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'pkcs1', format: 'pem' }, // PKCS#1 format
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

console.log('--- PUBLIC KEY (PKCS#1 PEM - Copy this to Revolut) ---');
console.log(publicKey);
console.log('\n--- PRIVATE KEY (Add this to .env as REVOLUT_PRIVATE_KEY) ---');
console.log(privateKey);
