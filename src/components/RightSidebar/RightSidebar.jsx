import React, { useContext, useEffect, useState ,useCallback} from 'react'
import './RightSidebar.css'
import assets from '../../assets/assets'
import { logout, auth } from '../../config/firebase'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'


const RightSidebar = () => {

    const {
        chatUser,
        messages,
        userData,
        loadUserData,
        setMessages,
        setChatUser,
        setUserData
    } = useContext(AppContext);
    const [msgImages, setMsgImages] = useState([]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user && !userData) {
                loadUserData(user.uid);
            } else if (!user) {
                setUserData(null);
            }
        });

        return () => unsubscribe();
    }, [userData, loadUserData, setUserData]);

    useEffect(() => {
        let tempVar = [];
        try {
            messages.forEach((msg) => {
                if (msg.image) {
                    tempVar.push(msg.image)
                }
            })
        } catch (error) {
            console.log(tempVar);
            toast.error(error.message)
        }

        setMsgImages(tempVar);
    }, [messages])

    const handleLogout = useCallback(async () => {
        try {
            await logout();
            setMessages([]);
            setChatUser(null);
            setUserData(null); // Clear user data on logout
        } catch (error) {
            toast.error("Logout failed: " + error.message);
        }
    }, [setMessages, setChatUser, setUserData]);

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
        return <div className="rs">Please log in to see profile information</div>;
    }


    return (
        <div className="rs">
            {chatUser ? renderUserInfo(chatUser.userData) : renderUserInfo(userData)}
            <hr />
            <div className="rs-media">
                <p>Media</p>
                <div>
                    {msgImages.map((url, index) => (<img onClick={() => window.open(url)} key={index} src={url} alt='' />))}
                </div>
            </div>
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
}

export default React.memo(RightSidebar);
