import { useContext, useEffect, useState } from 'react'
import './ProfileUpdate.css'
import assets from '../../assets/assets'
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';
import { AppContext } from '../../context/AppContext';

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");
  const [preImage, setPreImage] = useState("");
  const { setUserData } = useContext(AppContext);

  const profileUpdate = async (event) => {
    event.preventDefault();
    try {
      if (!uid) {
        toast.error("用戶未登入");
        return;
      }

      const docRef = doc(db, 'users', uid);
      const updateData = {
        bio: bio,
        name: name
      };

      if (image) {
        try {
          const imgUrl = await upload(image);
          setPreImage(imgUrl);
          updateData.avatar = imgUrl;
        } catch (uploadError) {
          console.error("圖片上傳失敗:", uploadError);
          toast.error("圖片上傳失敗，請重試");
          return;
        }
      }

      await updateDoc(docRef, updateData);
      const snap = await getDoc(docRef);
      const updatedUserData = snap.data();
      setUserData(updatedUserData);
      toast.success("個人資料更新成功");
      navigate('/chat');
    } catch (error) {
      console.error("更新個人資料時出錯:", error);
      toast.error("更新失敗，請重試");
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setName(userData.name || userData.username || "");
            setBio(userData.bio || "");
            setPreImage(userData.avatar || "");
          } else {
            console.log("No such document!");
            toast.error("無法獲取用戶資料");
          }
        } catch (error) {
          console.error("獲取用戶資料時出錯:", error);
          toast.error("載入用戶資料失敗");
        }
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className='profile'>
      <div className="profile-container">
        <form onSubmit={profileUpdate}>
          <h3>個人資料</h3>
          <label htmlFor="avatar">
            <input
              onChange={(e) => setImage(e.target.files[0])}
              type="file"
              id='avatar'
              accept='.png, .jpg, .jpeg'
              hidden
            />
            <img
              src={image ? URL.createObjectURL(image) : preImage || assets.avatar_icon}
              alt="頭像"
            />
            更換頭像
          </label>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            placeholder='名稱'
            required
          />
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder='個人簡介'
            required
          ></textarea>
          <button type='submit'>Save</button>
        </form>
        <img
          className='profile-pic'
          src={image ? URL.createObjectURL(image) : preImage || assets.logo_icon}
          alt="頭像預覽"
        />
      </div>
    </div>
  )
}

export default ProfileUpdate