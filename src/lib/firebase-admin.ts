import * as admin from 'firebase-admin';

// Initialize only if not already initialized
if (!admin.apps.length) {
    try {
        // Required environment variables for Firebase Admin
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        // Only initialize if we have the required keys
        // This prevents build errors on Vercel during static generation
        // where env vars might not be present.
        if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
                databaseURL: "https://ids-sports-default-rtdb.asia-southeast1.firebasedatabase.app"
            });
            console.log('Firebase Admin initialized successfully');
        } else {
            console.warn('Firebase Admin initialization skipped: Missing environment variables (Expected during build).');
        }
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
    }
}

// We need a way to assert these exist when actually using them at runtime,
// but for exporting, we can just export the getters. We'll use a wrapper
// to ensure we only get the services if apps exist.

export const adminDatabase = admin.apps.length ? admin.database() : null as unknown as admin.database.Database;
export const messaging = admin.apps.length ? admin.messaging() : null as unknown as admin.messaging.Messaging;
