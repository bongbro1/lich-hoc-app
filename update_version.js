const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyAPDyWb1788CLyiCpfUR_pyf1UYQ0S09Tw",
  authDomain: "lichhoc-beb3e.firebaseapp.com",
  projectId: "lichhoc-beb3e",
  storageBucket: "lichhoc-beb3e.firebasestorage.app",
  messagingSenderId: "533041299457",
  appId: "1:533041299457:web:4360777648cac244a84000",
  measurementId: "G-XN84C6QM0F",
  databaseURL: "https://lichhoc-beb3e-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function updateVersion() {
    console.log("Updating version info in Firebase...");
    try {
        await update(ref(db, 'app_config/about'), {
            version: "1.0.0",
            buildNumber: "1"
        });
        console.log("Version info updated successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error updating version:", error);
        process.exit(1);
    }
}

updateVersion();
