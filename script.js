console.log("程式開始執行了！");

// 讓程式與 Firebase 建立聯繫
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

// 啟動 Firebase 的身分認證服務
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// 啟動資料庫服務，用來讀寫資料
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Firebase 設定檔
const firebaseConfig = {
    apiKey: "AIzaSyD1a4TBPMnK3OdZ_qZV_e0QS9OR-NKdGu4",
    authDomain: "mypetgame666.firebaseapp.com",
    projectId: "mypetgame666",
    storageBucket: "mypetgame666.firebasestorage.app",
    messagingSenderId: "740973406240",
    appId: "1:740973406240:web:e9e88aa4b56c1e5ae4b445",
    measurementId: "G-XYTPCMD7KQ"
};

const app = initializeApp(firebaseConfig);

// 負責管理身分認證的物件
const auth = getAuth(app);
const provider = new GoogleAuthProvider(); // 登入方式的設定檔（使用 Google 帳號）

// 負責儲存遊戲進度的雲端櫃子
const db = getFirestore(app);

// Attributes
let pet = {
    name: "Name",
    level: 1,
    exp: 0,
    health: 100,
    hunger: 80,
    energy: 80,
    happiness: 80,
    cleanliness: 80
}

let isDirty = false; // 預設為 false，代表沒資料需要同步
let isDead = false; // 鼠掉旗標
let isBorn = false; // 遊戲狀態

// 存檔邏輯
async function saveGameData(uid, petData) {
    // 檢查：如果沒有變動，就直接跳出，不浪費流量
    if (!isDirty) {
        console.log("資料沒有變動，跳過這次同步。");
        return; 
    }
    
    const user = auth.currentUser;
    if (!user) return; // 若無使用者則不執行

    try {
        // 存入的資料結構，將帳號資訊與寵物數值包在一起
        const dataToSave = {
            userEmail: user.email, // Google 帳號 Email
            userName: user.displayName, // Google 帳號名稱

            gameState:{
                isBorn: isBorn,
                isDead: isDead
            },

            pet: {
                name: petData.name,
                level: petData.level,
                exp: petData.exp,
                health: petData.health,
                hunger: petData.hunger,
                energy: petData.energy,
                happiness: petData.happiness,
                cleanliness: petData.cleanliness
            },
            lastSaved: new Date().toISOString() // 存檔時間紀錄
        };

        await setDoc(doc(db, "users", uid), dataToSave);
        isDirty = false; // 存檔成功後，將旗標歸零
        console.log("進度已同步到雲端。");
    } catch (e) {
        console.error("儲存失敗:", e);
    }
}

// 監聽網頁離開/重新整理事件 (離開時同步)
document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="hidden"){
        const user=auth.currentUser;

        if(user){
            saveGameData(user.uid,pet);
        }
    }
});

// 定期同步
setInterval(() => {
    const user = auth.currentUser;
    if (user) {
        console.log("觸發定期自動存檔...");
        saveGameData(user.uid, pet);
    }
}, 300000);

// 讀取遊戲進度（對應資料庫屬性抓取資料）
async function loadGameData(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("讀取到進度:", data);
        return data; // 回傳寵物數值
    } else {
        console.log("這是一個新玩家，建立初始進度...");
        return {
            pet:{
                name:"Name",
                level:1,
                exp:0,
                health:100,
                hunger:80,
                energy:80,
                happiness:80,
                cleanliness:80
            },

            gameState:{
                isBorn:false,
                isDead:false
            }
        }; // 預設初始值
    }
}

// 設定登入時的提示訊息，讓使用者可以選擇帳號
provider.setCustomParameters({
    prompt: 'select_account'
});

const loginBtn = document.getElementById("loginBtn");

// 登入按鈕
loginBtn.addEventListener("click", () => {
    const user = auth.currentUser;
    
    if (user) {
        // 如果目前有使用者，執行登出
        signOut(auth).catch((error) => console.error("登出失敗:", error));
    } else {
        // 如果目前沒使用者，執行登入
        signInWithPopup(auth, provider).catch((error) => console.error("登入失敗:", error));
    }
});

// 自動監聽登入狀態（網頁載入時自動執行）
onAuthStateChanged(auth, async(user) => {
    if (user) {
        // 切換帳號時，這裡重新執行
        console.log("偵測到使用者已登入，開始讀取資料...", user.uid);

        // 將按鈕變為登出狀態
        loginBtn.textContent = "Logout";
    
        const data = await loadGameData(user.uid);
    
        // 把讀到的資料更新到遊戲變數中
        updateGameVariables(data); 

        if(data.gameState){
            isBorn = data.gameState.isBorn;
            isDead = data.gameState.isDead;
        }

        // 先判斷死亡
        if(isDead || pet.health <= 0){
            isDead = true;

            showGameScreen();
            playSprite("dead", null, 500);

            setTimeout(() => {
                gameOverScreen.classList.add("show");
            }, 3000);
        }
        // 再判斷是否出生
        else if(isBorn){
            showGameScreen();
            playSprite("idle",null,400,0,true);
        }
        // 還沒出生
        else{
            showBirthScreen();
            petElement.style.backgroundPosition="-350px 0px";
        }

        checkHealth();
    
        console.log("遊戲數值已更新為帳號資料");

    } else {
        // 如果登出或沒有使用者
        console.log("使用者已登出，重置遊戲數值為預設值");

        // 將按鈕變為登入狀態
        loginBtn.textContent = "Login";

        resetGameVariables(); 

        // 登出時強制把畫面刷成預設值
        updateScreen(); 
        
        // 確保 isDirty 變回 false，避免下次登入誤判
        isDirty = false;
    }
});

// 更新遊戲畫面
function updateGameVariables(data) {
    // 使用 Object.assign 或直接覆蓋來更新你的 pet 物件
    Object.assign(pet, data.pet); 
    
    // 呼叫 UI 更新函式，確保畫面數值同步
    updateScreen(); 
    console.log("本地 pet 物件已更新:", pet);
}

function resetGameVariables() {
    pet = {
        name: "Name",
        level: 1,
        exp: 0,
        health: 100,
        hunger: 80,
        energy: 80,
        happiness: 80,
        cleanliness: 80
    };
    renderGameUI();

    updateScreen(); 
    console.log("遊戲狀態已重置為預設值");
}

function renderGameUI() {
    const nameDisplay = document.getElementById("pet-name");
    const levelDisplay = document.getElementById("pet-level");
    const hungerDisplay = document.getElementById("pet-hunger");
    
    // 如果找到了對應的 HTML 元素，就更新裡面的文字
    if (nameDisplay) nameDisplay.innerText = pet.name;
    if (levelDisplay) levelDisplay.innerText = "Level: " + pet.level;
    if (hungerDisplay) hungerDisplay.innerText = "Hunger: " + pet.hunger;
    
    console.log("UI 已根據 pet 物件更新");
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

const header = document.querySelector(".header");
const status = document.querySelector(".status");
const leftArrow = document.querySelectorAll(".arrow-btn")[0];
const rightArrow = document.querySelectorAll(".arrow-btn")[1];

// 點擊筆圖示：隱藏文字，顯示輸入框
editBtn.addEventListener("click", () => {
    nameContainer.style.display = "none";
    editArea.style.display = "block";
    nameInput.value = pet.name; // 把舊名字填入輸入框
    nameInput.focus();          // 自動選取輸入框
});

// 儲存姓名
async function saveName() {
    const newName = nameInput.value.trim();
    if (newName !== "") {
        pet.name = newName;
        nameText.textContent = pet.name;
    }
    
    // 無論是用按鈕還是 Enter，執行完都切回顯示模式
    nameContainer.style.display = "block";
    editArea.style.display = "none";

    isDirty = true; // 標記資料已變動

    // 執行存檔
    const user = auth.currentUser;
    if (user) await saveGameData(user.uid, pet);
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
setInterval(async() => {
    if(!isBorn || isDead){
        return;
    }

    const randomIndex = Math.floor(Math.random() * statuskeys.length);
    const randomKey = statuskeys[randomIndex];
    const decreaseAmount = Math.floor(Math.random() * 5) + 1;

    console.log(`正在扣除：${randomKey}，減少數值：${decreaseAmount}，目前值：${pet[randomKey]}`);

    pet[randomKey] = Math.max(0, pet[randomKey] - decreaseAmount); // 限制不能是負數

    checkHealth();
    isDirty = true; // 標記資料已變動
    checkPetStatus();
    updateScreen();

    console.log(`更新後 ${randomKey} 為：${pet[randomKey]}`);

    // 執行存檔
    const user = auth.currentUser;
    if (user) await saveGameData(user.uid, pet);

}, 60000); // 每 60 秒執行一次

// 出生
function showBirthScreen(){

    header.style.display = "none";
    status.style.display = "none";

    actionText.style.display = "none";
    leftArrow.style.display = "none";
    rightArrow.style.display = "none";

    yesBtn.textContent = "孵化";

}

// 正常遊戲
function showGameScreen(){

    header.style.display = "";
    status.style.display = "";

    actionText.style.display = "";
    leftArrow.style.display = "";
    rightArrow.style.display = "";

    yesBtn.textContent = "YES";

}

function checkHealth() {
    // 數值歸零後的反應
    // 檢查每一個狀態
    const statusKeys = ["hunger", "energy", "happiness", "cleanliness"];
    
    // 只要有任何一個狀態是 0，就扣一次健康值
    let hasZeroStatus = false;
    
    statusKeys.forEach(key => {
        if (pet[key] === 0) {
            hasZeroStatus = true;
        }
    });

    if (hasZeroStatus) {
        pet.health = Math.max(0, pet.health - 10);
        console.log("警告：有狀態為 0。健康值持續下降中... 目前健康值:", pet.health);
        isDirty = true;
        updateScreen();
        checkPetStatus();
    }
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

// 升等
function addExp(amount){
    pet.exp += amount;

    while(pet.exp >=100){
        pet.exp -= 100;
        pet.level++;
        
        console.log("升等，目前等級：", pet.level);
    }
}

// 取得右下角按鈕
const restartGameBtn = document.getElementById("restartGameBtn");

function restartGame(){

    // 停止目前動畫
    clearInterval(animationTimer);

    resetGameVariables();

    isDead = false;
    isBorn = false;
    
    showBirthScreen();
    // 回到蛋的圖片
    petElement.style.backgroundPosition = "-350px 0px";
    gameOverScreen.classList.remove("show");

    updateScreen();

    // 如果有登入，同步到 Firebase
    if(auth.currentUser){
        isDirty = true;
        saveGameData(auth.currentUser.uid, pet);
    }

    console.log("遊戲已重新開始");
}

// 重新開始按鈕
restartGameBtn.addEventListener("click", () => {
    const ok = confirm("確定要重新開始遊戲嗎？目前進度將會被重置。");
    if(!ok) return;
    restartGame();
});

// 讀取 YES 按鈕
const yesBtn = document.querySelector(".yes-btn");
const petElement = document.getElementById("pet");
let animationTimer = null;

// 所有動畫資料
const spriteAnimations = {

    birth: [

        // 第一列 第6~18格
        [-350,0],
        [-420,0],
        [-490,0],
        [-560,0],
        [-630,0],
        [-700,0],
        [-770,0],
        [-840,0],
        [-910,0],
        [-980,0],
        [-1050,0],
        [-1120,0],
        [-1190,0],

        // 第二列 第6~11格
        [-350,-70],
        [-420,-70],
        [-490,-70],
        [-560,-70],
        [-630,-70],
        [-700,-70]

    ],

    // 站立第一排 1-2格
    idle:[
        [0,0],
        [-70,0]
    ],

    // 滿足第五排 1-7格
    happy:[
        [0,-280],
        [-70,-280],
        [-140,-280],
        [-210,-280],
        [-280,-280],
        [-350,-280],
        [-420,-280]
    ],

    // 餵食第六排 1-15格
    eat:[
        [0,-350],
        [-70,-350],
        [-140,-350],
        [-210,-350],
        [-280,-350],
        [-350,-350],
        [-420,-350],
        [-490,-350],
        [-560,-350],
        [-630,-350],
        [-700,-350],
        [-770,-350],
        [-840,-350],
        [-910,-350],
        [-980,-350]
    ],

    // 洗澡第九排 1-18格
    bath:[
        [0,-560],
        [-70,-560],
        [-140,-560],
        [-210,-560],
        [-280,-560],
        [-350,-560],
        [-420,-560],
        [-490,-560],
        [-560,-560],
        [-630,-560],
        [-700,-560],
        [-770,-560],
        [-840,-560],
        [-910,-560],
        [-980,-560],
        [-1050,-560],
        [-1120,-560],
        [-1190,-560]
    ],

    // 睡覺第十排1-2格
    sleep:[
        [0,-630],
        [-70,-630]
    ],

    // 玩耍跨第七、八排
    play:[
        // 第七排
        ...Array.from({length:20},(_,i)=>[
            -i*70,
            -420
        ]),

        // 第八排
        ...Array.from({length:12},(_,i)=>[
            -i*70,
            -490
        ])
    ],

    // 想睡覺 第一行第3-4格
    sleepy:[
        [ -140,0 ],
        [ -210,0 ]
    ],  

    // 肚子餓 第二行第1-2格
    hungry:[
        [0,-70],
        [-70,-70]
    ],

    // 無聊 第三行第1-2格
    bored:[
        [0,-140],
        [-70,-140]
    ],

    // 髒兮兮 第四行第1-2格
    dirty:[
        [0,-210],
        [-70,-210]
    ],

    // 鼠掉
    dead: [
        [-770, -70],
        [-840, -70]
    ],
};

// 狀態檢查
function checkPetStatus(){

    // 鼠掉
    if (pet.health <= 0) {

        if (!isDead) {
            isDead = true;
            playSprite("dead", null, 500, 0, true);

            // 3 秒後顯示 Game Over
            setTimeout(() => {
                gameOverScreen.classList.add("show");
            }, 3000);
        }

        return;
    }

    // 危險
    if (pet.health < 20) {

        console.warn("危險狀態！請趕快照顧你的寵物！");
    }

    // 活力低於20
    if(pet.energy < 20){
        playSprite("sleepy",null,200, 0, true);
        return;
    }

    if (pet.energy < 40) {
        playSprite("sleepy", null, 500, 0, true);
        return;
    }

    // 飽足低於20
    if(pet.hunger < 20){
        playSprite("hungry",null,200, 0, true);
        return;
    }

    if (pet.hunger < 40) {
        playSprite("hungry", null, 500, 0, true);
        return;
    }


    // 心情低於20
    if(pet.happiness < 20){
        playSprite("bored",null,200, 0, true);
        return;
    }

    if (pet.happiness < 40) {
        playSprite("bored", null, 500, 0, true);
        return;
    }


    // 清潔低於20
    if(pet.cleanliness < 20){
        playSprite("dirty",null,200, 0, true);
        return;
    }

    if (pet.cleanliness < 40) {
        playSprite("dirty", null, 500, 0, true);
        return;
    }

    // 都正常
    playSprite("idle",null,400,0,true);

}

// 動畫播放器
function playSprite(name, next=null, speed=300, loopTime=0, loop=false){

    if(name==="idle"){
        loop=true;
    }

    // 停止上一個動畫
    clearInterval(animationTimer);

    const frames=spriteAnimations[name];
    const [x,y]=frames[0];

    petElement.style.backgroundPosition=
    `${x}px ${y}px`;

    let frame=1;
    const startTime = Date.now();

    animationTimer=setInterval(()=>{
        const [x,y]=frames[frame];

        petElement.style.backgroundPosition=
            `${x}px ${y}px`;

        frame++;

        // 播放完畢
        if(frame>=frames.length){

            // 只有設定 loopTime 才循環
            if(loop || loopTime > 0){
                frame = 0;
            }
            else{
                clearInterval(animationTimer);

                if(name==="birth"){
                    showGameScreen();
                    updateActionText();
                    playSprite("idle",null,400,0,true);
                    return;
                }

                if(name==="dead"){
                    return;
                }

                // 播放下一個動畫
                if(next){
                    playSprite(next);
                }
                else{
                    checkPetStatus();
                }
                return;
            }
        }

        // 循環時間到了
        if(loopTime > 0){

            if(Date.now() - startTime >= loopTime){
                clearInterval(animationTimer);

                if(next){
                    playSprite(next);
                }
                else{
                    playSprite("idle",null,400,0,true);
                }
            }
        }

    },speed);
}

// YES 按鈕點擊事件
yesBtn.addEventListener("click", () => {

    if(!isBorn){
        isBorn = true;
        playSprite("birth");
        return;
    }

    if (isDead) {
        return;
    }

    const action = actions[currentIndex];
    
    switch (action) {

        case "餵食":

            // 更新數值
            pet.hunger = limitValue(pet.hunger + 10);
            addExp(10);
            pet.health = limitValue(pet.health + 10);

            console.log("===== 餵食 =====");
            console.log("hunger +10");
            console.log("health +10");
            console.log("exp +10");

            // 播放動畫
            playSprite("eat","happy", 200);

            isDirty=true;

            if(auth.currentUser){
                saveGameData(auth.currentUser.uid,pet);
            }

            break;

        case "睡覺":

            pet.energy = limitValue(pet.energy + 20);
            addExp(10);
            pet.health = limitValue(pet.health + 10);

            console.log("===== 睡覺 =====");
            console.log("energy +10");
            console.log("health +10");
            console.log("exp +10");

            playSprite("sleep","happy", 500, 3000);

            isDirty=true;

            if(auth.currentUser){
                saveGameData(auth.currentUser.uid,pet);
            }

            break;

        case "玩耍":

            pet.happiness = limitValue(pet.happiness + 15);
            pet.energy = limitValue(pet.energy-10);
            addExp(10);
            pet.health = limitValue(pet.health + 10);

            console.log("===== 玩耍 =====");
            console.log("happiness +15");
            console.log("energy -10");
            console.log("health +10");
            console.log("exp +10");

            playSprite("play","happy", 200);

            isDirty=true;

            if(auth.currentUser){
                saveGameData(auth.currentUser.uid,pet);
            }

            break;

        case "洗澡":

            pet.cleanliness = limitValue(pet.cleanliness + 20);
            addExp(10);
            pet.health = limitValue(pet.health + 10);

            console.log("===== 洗澡 =====");
            console.log("cleanliness +20");
            console.log("health +10");
            console.log("exp +10");

            playSprite("bath","happy", 200);

            isDirty=true;

            if(auth.currentUser){
                saveGameData(auth.currentUser.uid,pet);
            }
            
            break;
    }

    updateScreen();
    isDirty = true;
});

// 鼠掉重新開始按鈕
restartBtn.addEventListener("click", restartGame);

showBirthScreen();
petElement.style.backgroundPosition = "-350px 0px";
updateScreen();
