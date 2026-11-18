// Generates the RSA key pair used to sign Preta context tokens.
//   private.pem → stays on this site (signs the token)
//   public.pem  → paste into the Preta dashboard (verifies the token)
//
// Usage:  npm run keys            (refuses if keys already exist)
//         npm run keys -- --force (overwrite; the dashboard's public key must then be updated too)
const { generateKeyPairSync } = require('crypto');
const fs = require('fs');

const force = process.argv.includes('--force');
if (!force && (fs.existsSync('private.pem') || fs.existsSync('public.pem'))) {
  console.error('private.pem / public.pem already exist. Run with --force to replace them.');
  process.exit(1);
}

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
fs.writeFileSync('private.pem', privateKey);
fs.writeFileSync('public.pem', publicKey);
console.log('Done: private.pem and public.pem saved in this folder');
