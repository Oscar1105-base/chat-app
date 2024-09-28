import { doc, getDoc, onSnapshot, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { createContext, useEffect, useState, useCallback } from "react";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState([]);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);
    const [chatVisible, setChatVisible] = useState(false);

    const loadUserData = useCallback(async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();
            setUserData(userData);
            
            if (userData.avatar && userData.name) {
                navigate('/chat');
            } else {
                navigate('/profile');
            }
            
            await updateDoc(userRef, { lastSeen: Date.now() });
            
            const interval = setInterval(async () => {
                if (auth.currentUser) {
                    await updateDoc(userRef, { lastSeen: Date.now() });
                }
            }, 60000);

            return () => clearInterval(interval);
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    }, [navigate]);

    useEffect(() => {
        if (userData) {
            const chatRef = doc(db, 'chats', userData.id);
            const unsub = onSnapshot(chatRef, async (res) => {
                const chatItems = res.data()?.chatsData || [];
                
                const uniqueUserIds = [...new Set(chatItems.map(item => item.rId))];
                
                if (uniqueUserIds.length > 0) {
                    const usersQuery = query(collection(db, 'users'), where('__name__', 'in', uniqueUserIds));
                    const usersSnapshot = await getDocs(usersQuery);
                    
                    const userDataMap = {};
                    usersSnapshot.forEach(doc => {
                        userDataMap[doc.id] = doc.data();
                    });
                    
                    const tempData = chatItems.map(item => ({
                        ...item,
                        userData: userDataMap[item.rId] || {}
                    }));
                    
                    // Deduplicate chat data
                    const uniqueChats = Array.from(new Map(tempData.map(item => [item.messageId, item])).values());
                    
                    setChatData(uniqueChats.sort((a, b) => b.updatedAt - a.updatedAt));
                } else {
                    setChatData([]);
                }
            });
            
            return () => unsub();
        }
    }, [userData]);

    useEffect(() => {
        const loadMessages = async () => {
            if (messagesId) {
                const messageRef = doc(db, 'messages', messagesId);
                const messageSnap = await getDoc(messageRef);
                if (messageSnap.exists()) {
                    setMessages(messageSnap.data().messages || []);
                } else {
                    setMessages([]);
                }
            }
        };

        loadMessages();
    }, [messagesId]);

    const value = {
        userData, setUserData,
        chatData, setChatData,
        loadUserData,
        messages, setMessages,
        messagesId, setMessagesId,
        chatUser, setChatUser,
        chatVisible, setChatVisible
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;