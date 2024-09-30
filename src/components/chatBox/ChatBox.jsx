import React, { useContext, useEffect, useState, useCallback } from 'react'
import './ChatBox.css'
import assets from '../../assets/assets'
import { arrayUnion, doc, onSnapshot, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext'
import { upload } from '../../lib/upload'

const ChatBox = () => {
  const { 
    userData, 
    messages, 
    chatUser, 
    setMessages, 
    messagesId, 
    chatVisible, 
    setChatVisible,
    toggleChatUser 
  } = useContext(AppContext);
  const [input, setInput] = useState("");

  const updateChats = useCallback(async (messageContent) => {
    const batch = writeBatch(db);
    const userIDs = [chatUser.rId, userData.id];

    for (const id of userIDs) {
      const userChatRef = doc(db, 'chats', id);
      const userChatSnapshot = await getDoc(userChatRef);

      if (userChatSnapshot.exists()) {
        const userChatData = userChatSnapshot.data();
        const chatIndex = userChatData.chatsData.findIndex((c) => c.messageId === messagesId);
        if (chatIndex !== -1) {
          userChatData.chatsData[chatIndex] = {
            ...userChatData.chatsData[chatIndex],
            lastMessage: typeof messageContent === 'string' ? messageContent.slice(0, 30) : 'Image',
            updatedAt: Date.now(),
            messageSeen: userChatData.chatsData[chatIndex].rId !== userData.id
          };
          batch.update(userChatRef, { chatsData: userChatData.chatsData });
        }
      }
    }

    await batch.commit();
  }, [chatUser, userData, messagesId]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !messagesId) return;

    try {
      await updateDoc(doc(db, 'messages', messagesId), {
        messages: arrayUnion({
          sId: userData.id,
          text: input.trim(),
          createdAt: new Date()
        })
      });

      await updateChats(input.trim());
      setInput("");
    } catch (error) {
      toast.error(error.message);
    }
  }, [input, messagesId, userData, updateChats]);

  const sendImage = useCallback(async (e) => {
    try {
      const fileUrl = await upload(e.target.files[0]);
      if (fileUrl && messagesId) {
        await updateDoc(doc(db, 'messages', messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            image: fileUrl,
            createdAt: new Date()
          })
        });

        await updateChats('Image');
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, [messagesId, userData, updateChats]);

  const convertTimestamp = useCallback((timestamp) => {
    let date = timestamp.toDate();
    const hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
  }, []);

useEffect(() => {
    let unSub;
    if (messagesId) {
        unSub = onSnapshot(doc(db, 'messages', messagesId), (res) => {
            const updatedMessages = res.data().messages;
            setMessages(updatedMessages.reverse());
        });
    }
    return () => {
        if (unSub) unSub();
    };
}, [messagesId, setMessages]);


 useEffect(() => {
  if (!userData) {
    setInput("");
    setChatVisible(false);
  }
}, [userData, setChatVisible]);

if (!userData || !chatUser) {
  return (
    <div className={`chat-welcome ${chatVisible ? "" : "hidden"}`}>
      <img src={assets.logo_icon} alt="" />
      <p>{userData ? "Select a chat to start messaging" : "Please log in to chat"}</p>
    </div>
  );
}

  return (
    <div className={`chat-box ${chatVisible ? "" : "hidden"}`}>
      <div className="chat-user">
        <img src={chatUser.userData.avatar} alt="" />
        <p>
          {chatUser.userData.name}
          {Date.now() - chatUser.userData.lastSeen <= 70000 && <img className='dot' src={assets.green_dot} alt="" />}
        </p>
        <img src={assets.help_icon} className='help' alt="" onClick={toggleChatUser} /> {/* 修改這行 */}
        <img onClick={() => setChatVisible(false)} src={assets.arrow_icon} className='arrow' alt="" />
      </div>

      <div className="chat-msg">
        {messages.map((msg, index) => (
          <div key={index} className={msg.sId === userData.id ? "s-msg" : "r-msg"}>
            {msg.image 
              ? <img className='msg-img' src={msg.image} alt="" />
              : <p className='msg'>{msg.text}</p>
            }
            <div>
              <img src={msg.sId === userData.id ? userData.avatar : chatUser.userData.avatar} alt="" />
              <p>{convertTimestamp(msg.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input 
          onChange={(e) => setInput(e.target.value)} 
          value={input} 
          type="text" 
          placeholder='Send a message' 
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <input onChange={sendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="" />
        </label>
        <img onClick={sendMessage} src={assets.send_button} alt="" />
      </div>
    </div>
  );
}

export default React.memo(ChatBox);