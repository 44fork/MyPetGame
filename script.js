console.log("程式開始執行了！");

// Firebase 匿名登入
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

// 匯入認證功能
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// Firebase 設定檔
const firebaseConfig = {
  apiKey: "AIzaSyD1a4TBPMnK3OdZ_qZV_e0QS9OR-NKdGu4",
  projectId: "mypetgame666",
  storageBucket: "mypetgame666.firebasestorage.app",
  messagingSenderId: "740973406240",
  appId: "1:740973406240:web:e9e88aa4b56c1e5ae4b445",
  measurementId: "G-XYTPCMD7KQ"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 啟用認證
const auth = getAuth(app);

// 綁定到 HTML 按鈕
document.getElementById("loginBtn").addEventListener("click", () => {
  const provider = new GoogleAuthProvider();
  signInWithRedirect(auth, provider);
});

// 當網頁重新載入時，Firebase 會自動去檢查是否有剛回傳的登入資訊
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      console.log("登入成功！使用者:", result.user.displayName);
    }
  })
  .catch((error) => {
    console.error("登入失敗:", error.message);
  });



// Attributes
let pet = {
    name: "Name",
    level: 1,
    exp: 0,
    health: 80,
    hunger: 50,
    energy: 100,
    happiness: 80,
    cleanliness: 90,
}


// 取得畫面上的元素
const nameContainer = document.getElementById("nameContainer");
const editArea = document.getElementById("editArea");
const nameText = document.getElementById("nameText");
const nameInput = document.getElementById("nameInput");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn"); 

const levelText = document.getElementById("level");
const expBar = document.getElementById("expBar");
const expValue = document.getElementById("expValue");
const healthBar = document.getElementById("healthBar");
const healthValue = document.getElementById("healthValue");
const hungerBar = document.getElementById("hungerBar");
const hungerValue = document.getElementById("hungerValue");
const happinessBar = document.getElementById("happinessBar");
const happinessValue = document.getElementById("happinessValue");
const energyBar = document.getElementById("energyBar");
const energyValue = document.getElementById("energyValue");
const cleanBar = document.getElementById("cleanBar");
const cleanValue = document.getElementById("cleanValue");

// 點擊筆圖示：隱藏文字，顯示輸入框
editBtn.addEventListener("click", () => {
    nameContainer.style.display = "none";
    editArea.style.display = "block";
    nameInput.value = pet.name; // 把舊名字填入輸入框
    nameInput.focus();          // 自動選取輸入框
});

// 獨立的儲存函式
function saveName() {
    const newName = nameInput.value.trim();
    if (newName !== "") {
        pet.name = newName;
        nameText.textContent = pet.name;
    }
    
    // 無論是用按鈕還是 Enter，執行完都切回顯示模式
    nameContainer.style.display = "block";
    editArea.style.display = "none";
}

// 按鈕直接呼叫函式
saveBtn.addEventListener("click", saveName);

// Enter 鍵也呼叫函式
nameInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        saveName();
    }
});

// 狀態陣列
const statuskeys = ["hunger", "energy", "happiness", "cleanliness"];

// 定時器
setInterval(() => {
    const randomIndex = Math.floor(Math.random() * statuskeys.length);
    const randomKey = statuskeys[randomIndex];

    const decreaseAmount = Math.floor(Math.random() * 5) + 1;

    console.log(`正在扣除：${randomKey}，減少數值：${decreaseAmount}，目前值：${pet[randomKey]}`);

    pet[randomKey] = Math.max(0, pet[randomKey] - decreaseAmount); // 限制不能是負數

    updateScreen();

    console.log(`更新後 ${randomKey} 為：${pet[randomKey]}`);

}, 10000); // 每 30 秒執行一次

// 數值歸零後的反應
// 建立一個包含所有狀態數值的陣列
const currentStatusValues = [pet.hunger, pet.energy, pet.happiness, pet.cleanliness];

// 使用 some() 檢查是否「存在」任何一個數值等於 0
const isAnyStatusZero = currentStatusValues.some(value => value === 0);

if (isAnyStatusZero) {
    pet.health = Math.max(0, pet.health - 2);
    console.log("警告：有狀態已歸零！健康值下降中...");

    updateScreen();
}


// 定義動作列表
const actions = ["餵食", "睡覺", "玩耍", "洗澡"];
let currentIndex = 0;

const actionText = document.querySelector(".action-text");
const leftBtn = document.querySelectorAll(".arrow-btn")[0];
const rightBtn = document.querySelectorAll(".arrow-btn")[1];

// 更新顯示文字
function updateActionText() {
    actionText.textContent = actions[currentIndex];
}

// 點擊左箭頭
leftBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + actions.length) % actions.length;
    updateActionText();
});

// 點擊右箭頭
rightBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % actions.length;
    updateActionText();
});

// 更新畫面
function updateScreen() {
    nameText.textContent = pet.name;
    levelText.textContent = `Lv. ${pet.level}`;

    expBar.style.width = pet.exp + "%"; // style表元素的css屬性
    expValue.textContent = pet.exp + "/100"; // 更新旁邊的文字

    healthBar.style.width = pet.health + "%";
    healthValue.textContent = pet.health + "/100";

    hungerBar.style.width = pet.hunger + "%";
    hungerValue.textContent = pet.hunger + "/100";

    energyBar.style.width = pet.energy + "%";
    energyValue.textContent = pet.energy + "/100";

    happinessBar.style.width = pet.happiness + "%";
    happinessValue.textContent = pet.happiness + "/100";

    cleanBar.style.width = pet.cleanliness + "%";
    cleanValue.textContent = pet.cleanliness + "/100";
}

// 數值限制函式
function limitValue(value) {
    return Math.max(0, Math.min(value, 100)); // 限制數值在 0 到 100 之間
}


updateScreen();
