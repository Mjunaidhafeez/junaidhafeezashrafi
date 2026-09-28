/* ============================================================
   FIREBASE CONFIG — paste keys here after creating a new project.
   Firebase Console → Project settings → Your apps → Web app.
   ============================================================ */
window.PORTFOLIO_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAxuuvpgEsubJLjlr8CsZ6OejTinYjm_8E",
  authDomain: "junaid-portfolio-e06d3.firebaseapp.com",
  databaseURL: "https://junaid-portfolio-e06d3-default-rtdb.firebaseio.com",
  projectId: "junaid-portfolio-e06d3",
  storageBucket: "junaid-portfolio-e06d3.firebasestorage.app",
  messagingSenderId: "539850627980",
  appId: "1:539850627980:web:df2aeb5ff78f6c7c00d4a9",
  measurementId: "G-BSF1R0LNCQ"
};

window.isPortfolioFirebaseConfigured = function () {
  var c = window.PORTFOLIO_FIREBASE_CONFIG || {};
  if (!c.apiKey || c.apiKey.indexOf("PASTE_") === 0) return false;
  if (!c.projectId || c.projectId.indexOf("PASTE_") === 0) return false;
  if (!c.databaseURL || c.databaseURL.indexOf("PASTE_") !== -1) return false;
  return true;
};

window.initPortfolioFirebase = function () {
  if (typeof firebase === "undefined") return null;
  if (!window.isPortfolioFirebaseConfigured()) return null;
  if (!firebase.apps.length) firebase.initializeApp(window.PORTFOLIO_FIREBASE_CONFIG);
  return firebase.app();
};
