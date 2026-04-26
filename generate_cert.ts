import pem from 'pem';

pem.createCertificate({ days: 365, selfSigned: true }, (err, keys) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('--- CERTIFICATE (Copy this to Revolut) ---');
  console.log(keys.certificate);
  console.log('\n--- PRIVATE KEY (Add this to .env as REVOLUT_PRIVATE_KEY) ---');
  console.log(keys.serviceKey);
});
