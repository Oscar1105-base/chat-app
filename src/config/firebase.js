import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth, signOut, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { getStorage } from 'firebase/storage';

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
export const storage = getStorage(app);

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
        console.error("Login error:", error);
        let errorMessage = "登入失敗";
        
        switch (error.code) {
            case 'auth/invalid-credential':
                errorMessage = "電子郵件或密碼錯誤";
                break;
            case 'auth/user-not-found':
                errorMessage = "找不到此用戶";
                break;
            case 'auth/too-many-requests':
                errorMessage = "登入嘗試次數過多，請稍後再試";
                break;
            default:
                errorMessage = error.message;
        }
        
        toast.error(errorMessage);
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