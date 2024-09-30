import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import assets from '../../assets/assets';
import './LeftSidebar.css';

const LeftSidebar = () => {
    const navigate = useNavigate();
    const { 
        userData, 
        chatData, 
        setChatUser, 
        setMessagesId, 
        messagesId, 
        chatVisible, 
        setChatVisible,
        setMessages,
        handleLogout
    } = useContext(AppContext);

    const [searchResult, setSearchResult] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [filteredChatData, setFilteredChatData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (chatData) {
            setFilteredChatData(chatData.filter(chat => 
                chat && chat.userData && typeof chat.userData.name === 'string'
            ));
            setIsLoading(false);
        }
    }, [chatData]);

    const setChat = useCallback(async (item) => {
        if (!item?.messageId || !userData?.id) {
            toast.error("Invalid chat data");
            return;
        }

        try {
            setMessagesId(item.messageId);
            setChatUser(item);
            
            const userChatsRef = doc(db, 'chats', userData.id);
            const userChatsSnapshot = await getDoc(userChatsRef);
            const userChatsData = userChatsSnapshot.data();
            
            if (userChatsData?.chatsData) {
                const chatIndex = userChatsData.chatsData.findIndex((c) => c.messageId === item.messageId);
                if (chatIndex !== -1) {
                    userChatsData.chatsData[chatIndex].messageSeen = true;
                    await updateDoc(userChatsRef, {
                        chatsData: userChatsData.chatsData
                    });
                }
            }
            
            const messagesRef = doc(db, 'messages', item.messageId);
            const messagesSnapshot = await getDoc(messagesRef);
            const messagesData = messagesSnapshot.data();
            
            if (messagesData?.messages) {
                setMessages(messagesData.messages.reverse());
            }
            
            setChatVisible(true);
        } catch (error) {
            console.error('Error setting chat:', error);
            toast.error("Failed to load chat. Please try again.");
        }
    }, [userData, setMessagesId, setChatUser, setMessages, setChatVisible]);

    const addChat = useCallback(async () => {
        if (!searchResult || !userData?.id) return;

        try {
            const existingChat = chatData.find(chat => chat.rId === searchResult.id);
            if (existingChat) {
                setChat(existingChat);
                setSearchInput('');
                setFilteredChatData(chatData);
                setChatVisible(true);
                return;
            }

            const messagesRef = collection(db, "messages");
            const chatsRef = collection(db, "chats");
            
            const newMessageRef = doc(messagesRef);
            const newMessageId = newMessageRef.id;

            await setDoc(newMessageRef, {
                createdAt: serverTimestamp(),
                messages: []
            });

            const newChatData = {
                messageId: newMessageId,
                lastMessage: "",
                rId: searchResult.id,
                updateAt: Date.now(),
                messageSeen: true,
                userData: {
                    name: searchResult.name,
                    avatar: searchResult.avatar || assets.defaultAvatar
                }
            };

            await updateDoc(doc(chatsRef, userData.id), {
                chatsData: arrayUnion(newChatData)
            });

            await updateDoc(doc(chatsRef, searchResult.id), {
                chatsData: arrayUnion({
                    messageId: newMessageId,
                    lastMessage: "",
                    rId: userData.id,
                    updateAt: Date.now(),
                    messageSeen: true,
                    userData: {
                        name: userData.name,
                        avatar: userData.avatar || assets.defaultAvatar
                    }
                })
            });

            setChat(newChatData);
            setSearchInput('');
            setChatVisible(true);
            setSearchResult(null);
        } catch (error) {
            console.error('Error adding chat:', error);
            toast.error("Failed to add chat. Please try again.");
        }
    }, [searchResult, userData, setChat, setChatVisible, chatData]);

    const inputHandler = useCallback(async (e) => {
        const input = e.target?.value?.toLowerCase() ?? '';
        setSearchInput(input);

        if (input) {
            const filtered = chatData.filter(chat => 
                chat?.userData?.name?.toLowerCase().includes(input)
            );
            setFilteredChatData(filtered);

            try {
                const useRef = collection(db, 'users');
                const q = query(useRef, where("username", "==", input));
                const querySnap = await getDocs(q);
                if (!querySnap.empty && querySnap.docs[0].data().id !== userData?.id) {
                    const foundUser = querySnap.docs[0].data();
                    const userExist = chatData.some(user => user.rId === foundUser.id);
                    setSearchResult(userExist ? null : foundUser);
                } else {
                    setSearchResult(null);
                }
            } catch (error) {
                console.error('Error searching for user:', error);
                toast.error("Error searching for user");
            }
        } else {
            setFilteredChatData(chatData);
            setSearchResult(null);
        }
    }, [userData, chatData]);

    const memoizedChatList = useMemo(() => (
        filteredChatData.map((item, index) => (
            item && item.userData && (
                <div onClick={() => setChat(item)} key={index} className={`friends ${item.messageSeen || item.messageId === messagesId ? "" : "border"}`}>
                    <img src={item.userData.avatar || assets.defaultAvatar} alt="" />
                    <div>
                        <p>{item.userData.name || 'Unknown'}</p>
                        <span>{item.lastMessage || ''}</span>
                    </div>
                </div>
            )
        ))
    ), [filteredChatData, messagesId, setChat]);

    if (isLoading) return <div className="loading">Loading...</div>;

    return (
            <div className={`ls ${chatVisible ? "hidden" : ""}`}>
                <div className="ls-top">
                    <div className="ls-nav">
                        <img src={assets.logo} className='logo' alt="Logo" />
                        <div className="menu">
                            <img src={assets.menu_icon} alt="Menu" />
                            <div className="sub-menu">
                                <p onClick={() => navigate('/profile')}>Edit Profile</p>
                                <hr />
                                <p onClick={handleLogout}>Logout</p>
                            </div>
                        </div>
                    </div>
                    <div className="ls-search">
                        <img src={assets.search_icon} alt="Search" />
                        <input 
                            onChange={inputHandler} 
                            value={searchInput}
                            type="text" 
                            placeholder='Search here..' 
                        />
                    </div>
                </div>
                <div className="ls-list">
                    {searchResult && (
                        <div onClick={addChat} className='friends add-user'>
                            <img src={searchResult.avatar || assets.defaultAvatar} alt="User avatar" />
                            <p>{searchResult.name}</p>
                        </div>
                    )}
                    {memoizedChatList}
                </div>
            </div>
    );
};

export default React.memo(LeftSidebar);