// Bookora Firebase Authentication + Firestore
// ------------------------------------------------

import { state } from '../state.js';
import { Toast } from '../components/Toast.js';

// ------------------------------------------------
// FIREBASE CONFIG
// ------------------------------------------------

export const firebaseConfig = {
  apiKey: "AIzaSyDgPa6d8gxRhrJEaPyKuki2hbTbSfAU-94",
  authDomain: "bookora-676bf.firebaseapp.com",
  projectId: "bookora-676bf",
  storageBucket: "bookora-676bf.firebasestorage.app",
  messagingSenderId: "520063789526",
  appId: "1:520063789526:web:e85773de48d2a56034dc77",
  measurementId: "G-JB9D643JNT"
};

// ------------------------------------------------
// FIREBASE INSTANCE
// ------------------------------------------------

let authInstance = null;
let dbInstance = null;

export function getAuthInstance() {

  if (authInstance) {
    return authInstance;
  }

  if (!window.firebase) {
    console.error("Firebase SDK not loaded.");
    return null;
  }

  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
  }

  authInstance = window.firebase.auth();

  return authInstance;
}

export function getFirestoreInstance() {

  if (dbInstance) {
    return dbInstance;
  }

  if (!window.firebase) {
    console.error("Firebase SDK not loaded.");
    return null;
  }

  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
  }

  dbInstance = window.firebase.firestore();

  return dbInstance;
}

// ------------------------------------------------
// SAVE USER PROFILE TO FIRESTORE
// ------------------------------------------------

async function saveUserProfile(firebaseUser, extra = {}) {

  const db = getFirestoreInstance();

  if (!db || !firebaseUser) {
    throw new Error("Firestore is not available.");
  }

  const userRef = db
    .collection("users")
    .doc(firebaseUser.uid);

  const existing = await userRef.get();

  const oldData = existing.exists
    ? existing.data()
    : {};

  const isMasterAdmin =
    firebaseUser.email?.toLowerCase() ===
    "ayushprajpati6@gmail.com";

  const userData = {

    uid: firebaseUser.uid,

    name:
      extra.name ||
      firebaseUser.displayName ||
      oldData.name ||
      firebaseUser.email?.split("@")[0] ||
      "Bookora User",

    email:
      firebaseUser.email || oldData.email || "",

    photoURL:
      firebaseUser.photoURL ||
      oldData.photoURL ||
      "",

    role:
      isMasterAdmin
        ? "admin"
        : (oldData.role || extra.role || "buyer"),

    isMasterAdmin,

    status:
      oldData.status || "active",

    seller_status:
      oldData.seller_status || "none",

    updatedAt:
      firebase.firestore.FieldValue.serverTimestamp(),

    createdAt:
      oldData.createdAt ||
      firebase.firestore.FieldValue.serverTimestamp()
  };

  await userRef.set(userData, {
    merge: true
  });

  return userData;
}

// ------------------------------------------------
// APPLY USER TO BOOKORA STATE
// ------------------------------------------------

async function completeLogin(
  firebaseUser,
  extra = {}
) {

  const userData =
    await saveUserProfile(
      firebaseUser,
      extra
    );

  const isAdmin =
    userData.role === "admin" ||
    userData.isMasterAdmin === true;

  const isSeller =
    isAdmin ||
    userData.seller_status === "approved" ||
    userData.role === "creator" ||
    userData.role === "seller";

  state.setUser(
    userData,
    firebaseUser.uid
  );

  state.isAdmin = isAdmin;
  state.isSeller = isSeller;

  state.currentUser = userData;

  localStorage.setItem(
    "bookora_user_profile",
    JSON.stringify(userData)
  );

  return {
    success: true,
    user: userData,
    is_admin: isAdmin,
    is_seller: isSeller
  };
}

// ------------------------------------------------
// GOOGLE LOGIN
// ------------------------------------------------

export async function firebaseGoogleSignIn(
  roleChoice = "buyer"
) {

  const auth = getAuthInstance();

  if (!auth) {
    Toast.show(
      "Firebase is not ready. Please refresh the page.",
      "error"
    );

    return {
      success: false,
      error: "Firebase not ready"
    };
  }

  try {

    Toast.show(
      "Connecting to Google...",
      "info"
    );

    const provider =
      new window.firebase.auth.GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    const result =
      await auth.signInWithPopup(provider);

    const response =
      await completeLogin(
        result.user,
        {
          role: roleChoice
        }
      );

    Toast.show(
      `Welcome to Bookora, ${response.user.name}!`,
      "success"
    );

    return response;

  } catch (error) {

    console.error(
      "Google login error:",
      error
    );

    let message =
      "Google login failed.";

    if (
      error.code ===
      "auth/popup-closed-by-user"
    ) {

      message =
        "Google login window was closed.";

    } else if (
      error.code ===
      "auth/unauthorized-domain"
    ) {

      message =
        "Add ayush56379.github.io to Firebase Authorized Domains.";

    } else if (error.message) {

      message =
        error.message;
    }

    Toast.show(
      message,
      "error"
    );

    return {
      success: false,
      error: message
    };
  }
}

// ------------------------------------------------
// APPLE LOGIN
// ------------------------------------------------

export async function firebaseAppleSignIn(
  roleChoice = "buyer"
) {

  const auth = getAuthInstance();

  if (!auth) {
    Toast.show(
      "Firebase is not ready.",
      "error"
    );

    return {
      success: false
    };
  }

  try {

    const provider =
      new window.firebase.auth.OAuthProvider(
        "apple.com"
      );

    provider.addScope("email");
    provider.addScope("name");

    const result =
      await auth.signInWithPopup(provider);

    const response =
      await completeLogin(
        result.user,
        {
          role: roleChoice
        }
      );

    Toast.show(
      `Welcome to Bookora, ${response.user.name}!`,
      "success"
    );

    return response;

  } catch (error) {

    console.error(
      "Apple login error:",
      error
    );

    Toast.show(
      error.message ||
      "Apple login failed.",
      "error"
    );

    return {
      success: false,
      error: error.message
    };
  }
}

// ------------------------------------------------
// EMAIL SIGN UP
// ------------------------------------------------

export async function firebaseRegister(
  name,
  email,
  password,
  roleChoice = "buyer"
) {

  const auth = getAuthInstance();

  if (!auth) {

    Toast.show(
      "Firebase is not ready.",
      "error"
    );

    return {
      success: false
    };
  }

  try {

    const result =
      await auth.createUserWithEmailAndPassword(
        email.trim(),
        password
      );

    if (
      name &&
      result.user.updateProfile
    ) {

      await result.user.updateProfile({
        displayName: name.trim()
      });
    }

    const response =
      await completeLogin(
        result.user,
        {
          name: name.trim(),
          role: roleChoice
        }
      );

    Toast.show(
      `Account created! Welcome to Bookora, ${response.user.name}.`,
      "success"
    );

    return response;

  } catch (error) {

    console.error(
      "Registration error:",
      error
    );

    let message =
      "Registration failed.";

    if (
      error.code ===
      "auth/email-already-in-use"
    ) {

      message =
        "This email is already registered. Please sign in.";

    } else if (
      error.code ===
      "auth/weak-password"
    ) {

      message =
        "Password must be at least 6 characters.";

    } else if (
      error.code ===
      "auth/invalid-email"
    ) {

      message =
        "Please enter a valid email address.";

    } else if (error.message) {

      message =
        error.message;
    }

    Toast.show(
      message,
      "error"
    );

    return {
      success: false,
      error: message
    };
  }
}

// ------------------------------------------------
// EMAIL LOGIN
// ------------------------------------------------

export async function firebaseLogin(
  email,
  password
) {

  const auth = getAuthInstance();

  if (!auth) {

    Toast.show(
      "Firebase is not ready.",
      "error"
    );

    return {
      success: false
    };
  }

  try {

    const result =
      await auth.signInWithEmailAndPassword(
        email.trim(),
        password
      );

    const response =
      await completeLogin(
        result.user
      );

    Toast.show(
      `Welcome back, ${response.user.name}!`,
      "success"
    );

    return response;

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    let message =
      "Invalid email or password.";

    if (
      error.code ===
      "auth/invalid-credential"
    ) {

      message =
        "Invalid email or password.";

    } else if (
      error.code ===
      "auth/too-many-requests"
    ) {

      message =
        "Too many attempts. Please try again later.";

    } else if (error.message) {

      message =
        error.message;
    }

    Toast.show(
      message,
      "error"
    );

    return {
      success: false,
      error: message
    };
  }
}

// ------------------------------------------------
// FORGOT PASSWORD
// ------------------------------------------------

export async function firebaseForgotPassword(
  email
) {

  const auth = getAuthInstance();

  if (!auth) {

    Toast.show(
      "Firebase is not ready.",
      "error"
    );

    return {
      success: false
    };
  }

  try {

    await auth.sendPasswordResetEmail(
      email.trim()
    );

    Toast.show(
      "Password reset email sent.",
      "success"
    );

    return {
      success: true
    };

  } catch (error) {

    console.error(
      "Password reset error:",
      error
    );

    Toast.show(
      error.message ||
      "Unable to send password reset email.",
      "error"
    );

    return {
      success: false,
      error: error.message
    };
  }
}

// ------------------------------------------------
// SIGN OUT
// ------------------------------------------------

export async function firebaseSignOut() {

  const auth = getAuthInstance();

  try {

    if (auth) {
      await auth.signOut();
    }

  } catch (error) {

    console.warn(
      "Firebase signout warning:",
      error
    );
  }

  try {
    await state.logout();
  } catch (error) {
    console.warn(error);
  }

  localStorage.removeItem(
    "bookora_auth_token"
  );

  localStorage.removeItem(
    "bookora_user_profile"
  );

  localStorage.removeItem(
    "bookora_active_mode"
  );

  Toast.show(
    "You have been signed out.",
    "info"
  );
}

// ------------------------------------------------
// AUTH STATE LISTENER
// ------------------------------------------------

export function initAuthListener() {

  const auth =
    getAuthInstance();

  if (!auth) {

    setTimeout(
      initAuthListener,
      500
    );

    return;
  }

  auth.onAuthStateChanged(
    async firebaseUser => {

      if (!firebaseUser) {
        return;
      }

      try {

        await completeLogin(
          firebaseUser
        );

      } catch (error) {

        console.error(
          "Auth state sync error:",
          error
        );
      }
    }
  );
}

// ------------------------------------------------
// START AUTH LISTENER
// ------------------------------------------------

if (
  typeof window !== "undefined"
) {

  window.addEventListener(
    "load",
    () => {

      setTimeout(
        initAuthListener,
        300
      );

    }
  );
}
