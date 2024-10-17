import { useContext, useEffect, useState } from 'react'
import './ProfileUpdate.css'
import assets from '../../assets/assets'
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, storage } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';
import { AppContext } from '../../context/AppContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 檢查是否為開發環境的函數
const checkIsDevelopment = () => {
  try {
    // 檢查是否可以訪問本地資源
    return Boolean(assets.avatar_icon);
  } catch (error) {
    console.log(error + "no local");
    return false;
  }
};

// 用於存儲預設頭像 URL 的常量
const DEFAULT_AVATAR_REF = 'default/avatar_icon.png';
let defaultAvatarUrl = null;

// 預設的 base64 頭像（用於生產環境）
const DEFAULT_AVATAR_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAADsQAAA7EB9YPtSQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAARbSURBVHic7d0/bBxlGMfx73t3Tuw4MSR2HAxJEEpEISRCQUhQUFBQUNBQQEVHCQUN/0RBT4FEQwEdoqJCQqKho6GhoaCgQEKiQEIoCEWBxCGOE9vJ2b57KRCKk/id7N7uvDvv+/tIVqTkvd3n+5z9vXmT3Z0ZAAAAAAAAAAAAAAAAAAAAoIAi7wIwHbP+7+4kbeg3S65ayFSVTBUpUyVVNUlVSVVJVTNVzFQ1U0X//7empIpMsaSKTGVJJVlcaanRiOLGbKXUGnrBKGDhdCYaWUWNyKKGmaox0ShFnUimsRs1Yolxl6Rx5B6byY0jY45NLrPINOrqDn7Qr1tbp/7tmY0AZn59+a3WA+vnBlWVB1JV/EhUrhd55kEcR2bR/v+eSGY7MrVNasvUbsva7aiFzogvHHwS7ZpUl1k9arW7cVSrR1Gt5THOxmPZSEd7tXrr6JdrktSYJRcB7Lvm8jOvPdVN3q2WKm/WytXHK+XyvJmVvXs7jeFw2O92uru9fu+TzZ3bHx3c+Ob6xp+3pM5pzyeAs5h//qHlp5eWzvynVq2+UImTc4X5EXOy3mCwu9vt3rj1z+0P1m9df1/S7qSvI4DTmn/p0XOvn6nNva5SaWna84ug2+vd3el03t3Y2Xq31x98PelrCOC05p9/+Pw7C7MLr5pZ7L2n0xqNRv2dfvutza3Nt3qD/k+TvIYATmv+pQsX318sL77ivadZ6g8Gf93Z2X6z1+9/PcnzCeC05p99/Mm/58pzT3jvJ43+YLC+3dl5/bgfC8chgNOaX3r0sU65VFnw3k9a5XK51u/219Nu2whgGhYrGpF7b0KplZ67kEFtBDAFk0mZRSsBKFsBTKRdIwBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgBnBJAtAnBGANkiAGcEkC0CcEYA2SIAZwSQLQJwRgDZIgAAAAAAAAAAAAAAAAAAAACAYvkP2pjPVxUzB+wAAAAASUVORK5CYII=";

// 將 base64 轉換為 blob
const base64ToBlob = async (base64) => {
  const response = await fetch(base64);
  return await response.blob();
};

// 本地開發環境的預設頭像上傳
const uploadDefaultAvatarDev = async () => {
  if (!defaultAvatarUrl) {
    try {
      const response = await fetch(assets.avatar_icon);
      const blob = await response.blob();
      const storageRef = ref(storage, DEFAULT_AVATAR_REF);
      await uploadBytes(storageRef, blob);
      defaultAvatarUrl = await getDownloadURL(storageRef);
      return defaultAvatarUrl;
    } catch (error) {
      console.error("Error uploading default avatar:", error);
      return assets.avatar_icon;
    }
  }
  return defaultAvatarUrl;
};

// 生產環境的預設頭像上傳
const uploadDefaultAvatarProd = async () => {
  if (!defaultAvatarUrl) {
    try {
      const blob = await base64ToBlob(DEFAULT_AVATAR_BASE64);
      const storageRef = ref(storage, DEFAULT_AVATAR_REF);
      await uploadBytes(storageRef, blob);
      defaultAvatarUrl = await getDownloadURL(storageRef);
      return defaultAvatarUrl;
    } catch (error) {
      console.error("Error uploading default avatar:", error);
      return DEFAULT_AVATAR_BASE64;
    }
  }
  return defaultAvatarUrl;
};

// 根據環境選擇適當的上傳函數
const uploadDefaultAvatar = checkIsDevelopment() ? uploadDefaultAvatarDev : uploadDefaultAvatarProd;

// 獲取初始預設圖片
const getInitialDefaultImage = () => {
  return checkIsDevelopment() ? assets.avatar_icon : DEFAULT_AVATAR_BASE64;
};

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");
  const [preImage, setPreImage] = useState(getInitialDefaultImage());
  const { setUserData } = useContext(AppContext);

  const profileUpdate = async (event) => {
    event.preventDefault();
    try {
      const docRef = doc(db, 'users', uid);
      let avatarUrl = preImage;

      // 如果預設圖片還未上傳到 Firebase
      if (preImage === assets.avatar_icon || preImage === DEFAULT_AVATAR_BASE64) {
        avatarUrl = await uploadDefaultAvatar();
      }

      // 如果用戶選擇了新圖片
      if (image) {
        avatarUrl = await upload(image);
      }

      await updateDoc(docRef, {
        avatar: avatarUrl,
        bio: bio,
        name: name
      });

      const snap = await getDoc(docRef);
      setUserData(snap.data());
      navigate('/chat');
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Profile Error:", error);
      toast.error("Failed to update profile");
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
            setPreImage(userData.avatar || getInitialDefaultImage());
          }
        } catch (error) {
          console.error("UpdateError:", error);
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
          <h3>Profile Details</h3>
          <label htmlFor="avatar">
            <input
              onChange={(e) => setImage(e.target.files[0])}
              type="file"
              id='avatar'
              accept='.png, .jpg, .jpeg'
              hidden
            />
            <img
              src={image ? URL.createObjectURL(image) : preImage}
              alt="Avatar"
            />
            Upload Avatar
          </label>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            placeholder='Name'
            required
          />
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder='Your bio'
            required
          ></textarea>
          <button type='submit'>Save</button>
        </form>
        <img
          className='profile-pic'
          src={image ? URL.createObjectURL(image) : preImage}
          alt="Preview Avatar"
        />
      </div>
    </div>
  )
}

export default ProfileUpdate