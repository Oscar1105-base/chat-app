import React, { useContext, useEffect, useState } from 'react'
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
  const [image, setImage] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");
  const [preImage, setpreImage] = useState("");
  const { setUserData } = useContext(AppContext);

  const profileUpadate = async (event) => {
    event.preventDefault();
    try {
      if (!preImage && !image) {
        toast.error("Upload profile picture");
      }
      const docRef = doc(db, 'users', uid)
      if (image) {
        const imgUrl = await upload(image);
        setpreImage(imgUrl);
        await updateDoc(docRef, {
          avatar: imgUrl,
          bio: bio,
          name: name
        })
      }
      else {
        await updateDoc(docRef, {
          bio: bio,
          name: name
        })
      }
      const snap = await getDoc(docRef);
      setUserData(snap.data());
      navigate('/chat');
    }
    catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid)
        const docRdf = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRdf)
        if (docSnap.data().name) {
          setName(docSnap.data().name);
        }
        if (docSnap.data().bio) {
          setBio(docSnap.data().bio);
        }
        if (docSnap.data().avatar) {
          setpreImage(docSnap.data().avatar);
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
        <form onSubmit={profileUpadate}>
          <h3>Profile Details</h3>
          <label htmlFor="avatar">
            <input onChange={(e) => setImage(e.target.files[0])} type="file" id='avatar' accept='.png, jpg , jpeg' hidden />
            <img src={image ? URL.createObjectURL(image) : assets.avatar_icon} alt="" />
            avatar
          </label>
          <input onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder='name' required />
          <textarea onChange={(e) => setBio(e.target.value)} value={bio} placeholder='your bio' required></textarea>
          <button type='submit'>保存</button>
        </form>
        <img className='profile-pic' src={image ? URL.createObjectURL(image) : preImage ? preImage : assets.logo_icon} alt="" />
      </div>
    </div>
  )
}

export default ProfileUpdate