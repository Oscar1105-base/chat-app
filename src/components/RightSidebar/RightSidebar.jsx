import React, { useContext, useEffect, useState, useCallback } from 'react'
import './RightSidebar.css'
import assets from '../../assets/assets'
import { db } from '../../config/firebase'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import { collection, query, where, getDocs } from 'firebase/firestore'

const RightSidebar = () => {
    const {
        chatUser,
        messages,
        userData,
        handleLogout,
    } = useContext(AppContext);
    const [msgImages, setMsgImages] = useState([]);

    const fetchUserImages = useCallback(async (userId) => {
        try {
            const messagesRef = collection(db, 'messages');
            const q = query(messagesRef, where('participants', 'array-contains', userId));
            const querySnapshot = await getDocs(q);

            let images = [];
            querySnapshot.forEach((doc) => {
                const messagesData = doc.data().messages;
                const userImages = messagesData
                    .filter(msg => msg.sId === userId && msg.image)
                    .map(msg => msg.image);
                images = [...images, ...userImages];
            });

            setMsgImages(images);
        } catch (error) {
            console.error("Error fetching user images:", error);
            toast.error("無法載入圖片");
        }
    }, []);

    useEffect(() => {
        if (chatUser) {
            fetchUserImages(chatUser.userData.id);
        } else if (userData) {
            fetchUserImages(userData.id);
        }
    }, [chatUser, userData, fetchUserImages]);

    useEffect(() => {
        if (messages && messages.length > 0) {
            const images = messages
                .filter(msg => msg.image)
                .map(msg => msg.image);
            setMsgImages(images);
        }
    }, [messages]);

    const renderUserInfo = useCallback((user) => (
        <div className="rs-profile">
            <img src={user.avatar} alt="" />
            <h3>
                {Date.now() - user.lastSeen <= 70000 && <img className='dot' src={assets.green_dot} alt="" />}
                {user.name}
            </h3>
            <p>{user.bio}</p>
        </div>
    ), []);

    if (!userData) {
        return <div className="rs">Please Login account</div>;
    }

    return (
        <div className="rs">
            {chatUser ? renderUserInfo(chatUser.userData) : renderUserInfo(userData)}
            <hr />
            <div className="rs-media">
                <p>Media</p>
                <div>
                    {msgImages.map((url, index) => (
                        <img
                            onClick={() => window.open(url)}
                            key={index}
                            src={url}
                            alt=''
                        />
                    ))}
                </div>
            </div>
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
}

export default React.memo(RightSidebar);