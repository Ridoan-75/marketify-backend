import * as firebaseAdmin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

let serviceAccount: any;
const serviceAccountPath = join(__dirname, 'firebase-service-account.json');

if (existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  throw new Error(
    'Missing Firebase service account credentials. Add src/config/firebase-service-account.json or set FIREBASE_SERVICE_ACCOUNT.',
  );
}

if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
  });
}

export const admin = firebaseAdmin;