import { readFile } from "node:fs/promises";
import process from "node:process";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const invitationCodes = [
  { code: "UNJA", limit: 250 },
  { code: "AI-MARKETER-2026", limit: 5 },
  { code: "MEMBER-SPECIAL", limit: 1 },
];

async function loadCredential() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const rawServiceAccount = await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8");
    return admin.credential.cert(JSON.parse(rawServiceAccount));
  }

  return admin.credential.applicationDefault();
}

async function main() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: await loadCredential(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    });
  }

  const db = admin.firestore();
  const batch = db.batch();

  for (const invitation of invitationCodes) {
    const code = invitation.code.trim().toUpperCase();
    const ref = db.collection("invitationCodes").doc(code);
    batch.set(
      ref,
      {
        code,
        limit: invitation.limit,
        active: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  await batch.commit();

  console.log("Seeded invitationCodes:");
  for (const invitation of invitationCodes) {
    console.log(`- invitationCodes/${invitation.code}: limit ${invitation.limit}`);
  }
}

main().catch((error) => {
  console.error("Failed to seed invitation codes:", error);
  process.exit(1);
});
