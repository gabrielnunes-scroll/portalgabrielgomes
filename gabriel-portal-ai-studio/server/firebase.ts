import {applicationDefault,getApps,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
export function firebase(){if(!getApps().length)initializeApp({credential:applicationDefault(),projectId:process.env.FIREBASE_PROJECT_ID,storageBucket:process.env.FIREBASE_STORAGE_BUCKET});return getApps()[0];}
export const store=()=>getFirestore(firebase());
export const auth=()=>getAuth(firebase());
export const storage=()=>getStorage(firebase()).bucket();
