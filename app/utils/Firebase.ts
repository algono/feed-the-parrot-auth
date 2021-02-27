// The Firebase Admin SDK to generate the auth JWT token
import admin = require("firebase-admin");

const firebaseCredentials: admin.ServiceAccount = JSON.parse(
  process.env.FIREBASE_CREDENTIALS
);

admin.initializeApp({
  credential: admin.credential.cert(firebaseCredentials),
});

export async function createCustomToken(uid: string) {
  return await admin.auth().createCustomToken(await getUserRefId(uid));
}

async function getUserRefId(userId: string) {
  const userDataQuery = await admin
    .firestore()
    .collection("users")
    .where("userId", "==", userId)
    .limit(1)
    .get();

  // Get user data from query
  const userDoc = userDataQuery.docs[0];
  const userRef = userDoc.ref;

  return userRef.id;
}
