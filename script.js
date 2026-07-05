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
