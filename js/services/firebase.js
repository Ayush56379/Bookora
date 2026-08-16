// Bookora Official Firebase Authentication Service

import { API_BASE_URL } from '../config.js';
import { state } from '../state.js';
import { Toast } from '../components/Toast.js';


// =========================================================
// FIREBASE CONFIG
// =========================================================

export const firebaseConfig = {
  apiKey: "AIzaSyDgPa6d8gxRhrJEaPyKuki2hbTbSfAU-94",
  authDomain: "bookora-676bf.firebaseapp.com",
  projectId: "bookora-676bf",
  storageBucket: "bookora-676bf.firebasestorage.app",
  messagingSenderId: "520063789526",
  appId: "1:520063789526:web:e85773de48d2a56034dc77",
  measurementId: "G-JB9D643JNT"
};


let authInstance = null;


// =========================================================
// FIREBASE INSTANCE
// =========================================================

export function getAuthInstance() {

  if (authInstance) {
    return authInstance;
  }

  if (
    window.firebase &&
    window.firebase.auth
  ) {

    if (
      !window.firebase.apps ||
      window.firebase.apps.length === 0
    ) {
      window.firebase.initializeApp(firebaseConfig);
    }

    authInstance = window.firebase.auth();

    return authInstance;
  }

  return null;
}


// =========================================================
// APPS SCRIPT AUTH REQUEST
// =========================================================

async function appsScriptAuth(action, payload = {}) {

  const url = API_BASE_URL;

  const response = await fetch(url, {
    method: 'POST',

    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },

    body: JSON.stringify({
      action: action,
      ...payload
    })
  });

  let data;

  try {
    data = await response.json();
  } catch (error) {

    throw new Error(
      'Invalid response received from Bookora backend.'
    );
  }

  if (!response.ok || !data.success) {

    throw new Error(
      data.error ||
      'Bookora authentication request failed.'
    );
  }

  return data;
}


// =========================================================
// 1. GOOGLE SIGN-IN
// =========================================================

export async function firebaseGoogleSignIn(
  roleChoice = 'buyer'
) {

  const auth = getAuthInstance();

  if (!auth) {

    Toast.show(
      'Firebase SDK is loading. Please try again.',
      'warning'
    );

    return {
      success: false,
      error: 'Firebase not ready'
    };
  }


  Toast.show(
    'Connecting to Google...',
    'info'
  );


  try {

    const provider =
      new window.firebase.auth.GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: 'select_account'
    });


    const userCredential =
      await auth.signInWithPopup(provider);


    const user =
      userCredential.user;


    const idToken =
      await user.getIdToken(true);


    const data =
      await appsScriptAuth(
        'firebase',
        {
          id_token: idToken,
          role: roleChoice
        }
      );


    state.setUser(
      data.user,
      data.token
    );


    Toast.show(
      `Welcome to Bookora, ${data.user.name}!`,
      'success'
    );


    return {
      success: true,
      user: data.user,
      is_admin: data.is_admin,
      is_seller: data.is_seller
    };


  } catch (err) {

    console.error(
      'Firebase Google Sign-In error:',
      err
    );


    if (
      err.code ===
      'auth/popup-closed-by-user'
    ) {

      Toast.show(
        'Google sign-in was closed.',
        'info'
      );

    } else if (
      err.code ===
      'auth/unauthorized-domain'
    ) {

      Toast.show(
        'Domain not authorized. Add ayush56379.github.io to Firebase Authorized Domains.',
        'error'
      );

    } else {

      Toast.show(
        err.message ||
        'Google sign-in failed.',
        'error'
      );
    }


    return {
      success: false,
      error: err.message
    };
  }
}


// =========================================================
// 2. APPLE SIGN-IN
// =========================================================

export async function firebaseAppleSignIn(
  roleChoice = 'buyer'
) {

  const auth = getAuthInstance();

  if (!auth) {

    Toast.show(
      'Firebase SDK is loading. Please try again.',
      'warning'
    );

    return {
      success: false,
      error: 'Firebase not ready'
    };
  }


  Toast.show(
    'Connecting to Apple...',
    'info'
  );


  try {

    const provider =
      new window.firebase.auth.OAuthProvider(
        'apple.com'
      );


    provider.addScope('email');
    provider.addScope('name');


    const userCredential =
      await auth.signInWithPopup(provider);


    const user =
      userCredential.user;


    const idToken =
      await user.getIdToken(true);


    const data =
      await appsScriptAuth(
        'firebase',
        {
          id_token: idToken,
          role: roleChoice
        }
      );


    state.setUser(
      data.user,
      data.token
    );


    Toast.show(
      `Welcome to Bookora, ${data.user.name}!`,
      'success'
    );


    return {
      success: true,
      user: data.user,
      is_admin: data.is_admin,
      is_seller: data.is_seller
    };


  } catch (err) {

    console.error(
      'Firebase Apple Sign-In error:',
      err
    );


    Toast.show(
      err.message ||
      'Apple sign-in failed.',
      'error'
    );


    return {
      success: false,
      error: err.message
    };
  }
}


// =========================================================
// 3. EMAIL + PASSWORD REGISTRATION
// =========================================================

export async function firebaseRegister(
  name,
  email,
  password,
  roleChoice = 'buyer'
) {

  const auth = getAuthInstance();

  if (!auth) {

    Toast.show(
      'Firebase SDK is loading. Please try again.',
      'warning'
    );

    return {
      success: false,
      error: 'Firebase not ready'
    };
  }


  try {

    const userCredential =
      await auth.createUserWithEmailAndPassword(
        email,
        password
      );


    const user =
      userCredential.user;


    if (
      name &&
      user.updateProfile
    ) {

      await user.updateProfile({
        displayName: name
      });
    }


    const idToken =
      await user.getIdToken(true);


    const data =
      await appsScriptAuth(
        'firebase',
        {
          id_token: idToken,
          name: name,
          role: roleChoice
        }
      );


    state.setUser(
      data.user,
      data.token
    );


    Toast.show(
      `Account created! Welcome to Bookora, ${data.user.name}.`,
      'success'
    );


    return {
      success: true,
      user: data.user,
      is_admin: data.is_admin,
      is_seller: data.is_seller
    };


  } catch (err) {

    console.error(
      'Firebase Register error:',
      err
    );


    let msg =
      'Registration failed.';


    if (
      err.code ===
      'auth/email-already-in-use'
    ) {

      msg =
        'An account with this email already exists. Please Sign In.';

    } else if (
      err.code ===
      'auth/weak-password'
    ) {

      msg =
        'Password is too weak. Must be at least 6 characters.';

    } else if (
      err.code ===
      'auth/invalid-email'
    ) {

      msg =
        'Invalid email address format.';

    } else if (err.message) {

      msg = err.message;
    }


    Toast.show(
      msg,
      'error'
    );


    return {
      success: false,
      error: msg
    };
  }
}


// =========================================================
// 4. EMAIL + PASSWORD LOGIN
// =========================================================

export async function firebaseLogin(
  email,
  password
) {

  const auth =
    getAuthInstance();


  if (!auth) {

    Toast.show(
      'Firebase SDK is loading. Please try again.',
      'warning'
    );

    return {
      success: false,
      error: 'Firebase not ready'
    };
  }


  try {

    const userCredential =
      await auth.signInWithEmailAndPassword(
        email,
        password
      );


    const user =
      userCredential.user;


    const idToken =
      await user.getIdToken(true);


    const data =
      await appsScriptAuth(
        'firebase',
        {
          id_token: idToken
        }
      );


    state.setUser(
      data.user,
      data.token
    );


    Toast.show(
      `Welcome back, ${data.user.name}!`,
      'success'
    );


    return {
      success: true,
      user: data.user,
      is_admin: data.is_admin,
      is_seller: data.is_seller
    };


  } catch (err) {

    console.error(
      'Firebase Login error:',
      err
    );


    let msg =
      'Invalid email or password.';


    if (
      err.code ===
      'auth/user-not-found' ||
      err.code ===
      'auth/wrong-password' ||
      err.code ===
      'auth/invalid-credential'
    ) {

      msg =
        'Invalid email or password. Please check your credentials or Sign Up.';

    } else if (
      err.code ===
      'auth/too-many-requests'
    ) {

      msg =
        'Too many failed login attempts. Please try again later.';

    } else if (err.message) {

      msg =
        err.message;
    }


    Toast.show(
      msg,
      'error'
    );


    return {
      success: false,
      error: msg
    };
  }
}


// =========================================================
// 5. FORGOT PASSWORD
// =========================================================

export async function firebaseForgotPassword(
  email
) {

  const auth =
    getAuthInstance();


  if (!auth) {

    Toast.show(
      'Firebase SDK is loading. Please try again.',
      'warning'
    );

    return {
      success: false,
      error: 'Firebase not ready'
    };
  }


  try {

    await auth.sendPasswordResetEmail(
      email
    );


    Toast.show(
      `Password reset link sent to ${email}.`,
      'success'
    );


    return {
      success: true
    };


  } catch (err) {

    console.error(
      'Firebase Forgot Password error:',
      err
    );


    let msg =
      'Failed to send password reset email.';


    if (
      err.code ===
      'auth/user-not-found'
    ) {

      msg =
        'No account found with this email.';

    } else if (
      err.code ===
      'auth/invalid-email'
    ) {

      msg =
        'Invalid email address format.';

    } else if (err.message) {

      msg =
        err.message;
    }


    Toast.show(
      msg,
      'error'
    );


    return {
      success: false,
      error: msg
    };
  }
}


// =========================================================
// 6. SIGN OUT
// =========================================================

export async function firebaseSignOut() {

  const auth =
    getAuthInstance();


  if (auth) {

    try {

      await auth.signOut();

    } catch (error) {

      console.warn(
        'Firebase sign out warning:',
        error
      );
    }
  }


  await state.logout();


  Toast.show(
    'You have been signed out.',
    'info'
  );
}


// =========================================================
// 7. AUTO AUTH STATE SYNC
// =========================================================

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
    async (firebaseUser) => {

      if (!firebaseUser) {
        return;
      }


      try {

        const idToken =
          await firebaseUser.getIdToken();


        const data =
          await appsScriptAuth(
            'firebase',
            {
              id_token: idToken
            }
          );


        if (data.success) {

          state.setUser(
            data.user,
            data.token
          );
        }


      } catch (err) {

        console.warn(
          'Background Firebase verification notice:',
          err
        );
      }
    }
  );
}


// =========================================================
// LOAD LISTENER
// =========================================================

if (
  typeof window !== 'undefined'
) {

  window.addEventListener(
    'load',
    () => {

      setTimeout(
        initAuthListener,
        300
      );

    }
  );
}
