import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth, signOut, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

 // your Firebase API Key
const firebaseConfig = {    
    apiKey: "apiKey",
    authDomain: "authDomain",
    projectId: "projectId",
    storageBucket: "storageBucket",
    messagingSenderId: "messagingSenderId",
    appId: "appId"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const signup = async (username, email, password) => {
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;
        await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            username: username.toLowerCase(),
            email,
            name: "",
            avatar: "",
            bio: "Hey I am here",
            lastSeen: Date.now()
        });

        await setDoc(doc(db, "chats", user.uid), {
            chatsData: []
        });
        return user;
    } catch (error) {
        console.error(error);
        const cleanMessage = error.message.match(/\/([^)]+)\)/)[1].replace(/-/g, " ");
        toast.error(cleanMessage);
        throw error;
    }
};

export const login = async (email, password) => {
    try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        return res.user;
    } catch (error) {
        console.error(error);
        toast.error(error.message.match(/\/([^)]+)\)/)[1].replace(/-/g, " "));
        throw error;
    }


};

export const logout = async () => {
    try {
        await signOut(auth)
    } catch (error) {
        console.error(error);
        toast.error(error.message.match(/\/([^)]+)\)/)[1].replace(/-/g, " "))
    }
};

export const resetPass = async (email) => {
    if (!email) {
        toast.error("Please enter your email");
        return;
    }

    try {
        const auth = getAuth();
        await sendPasswordResetEmail(auth, email);
        toast.success("Reset Email Sent");
    } catch (error) {
        console.error(error);
        let errorMessage = "An error occurred while resetting the password";
        if (error.code === 'auth/user-not-found') {
            errorMessage = "Email doesn't exist";
        }
        toast.error(errorMessage);
    }
};
