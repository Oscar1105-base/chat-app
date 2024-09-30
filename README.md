# Chat app 即時聊天室

## React & Firebase 實作 websocket

<div style="display: flex; justify-content: center; margin-bottom: 20px;">
  <img src="/sample.png" alt="GitHub 簡介" style="width: 90%;">
</div>

> 2024/09/29 bata 1.0 edit

## 環境建置

### 請先用npm安裝以下套件

React 環境
```
npm create vite@latest 
```
> 先選擇React，再選JavaScript

Node JS 環境
```
npm install
```


React Router + Toastify  
```
npm install react-router-dom react-toastify
```


Firebase
```
npm install firebase
```


### Firebase專案設定的SDK複製到 src/config/firebase.js：
```
const firebaseConfig = {    
    apiKey: "apiKey",
    authDomain: "authDomain",
    projectId: "projectId",
    storageBucket: "storageBucket",
    messagingSenderId: "messagingSenderId",
    appId: "appId"
  };
```
### 開啟本地伺服器
```
npm run dev
```

## Demo 展示

### 註冊/登錄
> 首次註冊需輸入ID/信箱/密碼，進入後添加暱稱/簡介/頭像後完成

<div style="display: flex; justify-content: center; margin-bottom: 20px;">
  <img src="/Demo/ChatLogin.png" alt="登錄" style="width: 90%;">
</div>

<div style="display: flex; justify-content: center; margin-bottom: 20px;">
  <img src="/Demo/Profile.png" alt="個人簡介" style="width: 90%;">
</div>

暱稱/簡介可以繼承ID與預設字串，頭像無匿名功能

### 聊天室
可上傳文/圖 ，支援 png , jpg , jpeg
<div style="display: flex; justify-content: center; margin-bottom: 20px;">
  <img src="/sample.png" alt="聊天室" style="width: 40%;">
</div>

> 左選單為收尋功能與用戶列表及小選單(更新簡介)

預設為空，需要找到全名才能加入對話，之後可用模糊收尋

> 右選單為，可以獲取該用戶最近上傳圖片


## 窄版或手機版面的登出在副選單三個點(⋮)那邊

可上傳文/圖 ，支援 png , jpg , jpeg
<div style="display: flex; justify-content: center; margin-bottom: 20px;">
  <img src="/Demo/logout.png" alt="登出" style="width: 90%;">
</div>

