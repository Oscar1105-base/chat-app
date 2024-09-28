import { doc, getDoc, onSnapshot, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { createContext, useEffect, useState, useCallback, useMemo } from "react";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState(null);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);
    const [chatVisible, setChatVisible] = useState(false);

    // 使用 useMemo 來緩存 userRef
    const userRef = useMemo(() => {
        return userData ? doc(db, 'users', userData.id) : null;
    }, [userData]);

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
            
            // 使用 RAF 替代 setInterval 來更新 lastSeen
            let rafId;
            const updateLastSeen = async () => {
                if (auth.currentUser) {
                    await updateDoc(userRef, { lastSeen: Date.now() });
                }
                rafId = requestAnimationFrame(() => {
                    setTimeout(updateLastSeen, 60000);
                });
            };
            updateLastSeen();

            // 清理函數
            return () => cancelAnimationFrame(rafId);
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    }, [navigate]);

    useEffect(() => {
        if (userData) {
            const chatRef = doc(db, 'chats', userData.id);
            const unsub = onSnapshot(chatRef, async (res) => {
                const chatItems = res.data()?.chatsData || [];
                
                // 獲取唯一用戶 ID
                const uniqueUserIds = [...new Set(chatItems.map(item => item.rId))];
                
                // 批量獲取用戶數據
                const usersQuery = query(collection(db, 'users'), where('__name__', 'in', uniqueUserIds));
                const usersSnapshot = await getDocs(usersQuery);
                
                // 創建用戶數據映射
                const userDataMap = {};
                usersSnapshot.forEach(doc => {
                    userDataMap[doc.id] = doc.data();
                });
                
                // 合併聊天項目和用戶數據
                const tempData = chatItems.map(item => ({
                    ...item,
                    userData: userDataMap[item.rId] || {}
                }));
                
                setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt));
            });
            
            return () => unsub();
        }
    }, [userData]);

    // 新增：延遲加載消息
    const loadMessages = useCallback(async (messageId) => {
        if (!messageId) return;
        
        const messagesRef = doc(db, 'messages', messageId);
        const messagesSnap = await getDoc(messagesRef);
        const messagesData = messagesSnap.data()?.messages || [];
        
        setMessages(messagesData.reverse());
    }, []);

    const value = {
        userData, setUserData,
        chatData, setChatData,
        loadUserData,
        messages, setMessages,
        messagesId, setMessagesId,
        chatUser, setChatUser,
        chatVisible, setChatVisible,
        loadMessages // 新增：暴露 loadMessages 函數
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;