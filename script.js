let shoppingList = JSON.parse(localStorage.getItem('my_shopping_list')) || [];

const todoForm = document.getElementById('todo-form');
const listContainer = document.getElementById('list-container');
const filterKeyword = document.getElementById('filter-keyword'); // 確保這裡成功綁定關鍵字輸入框
const filterLocation = document.getElementById('filter-location');
const filterBuyer = document.getElementById('filter-buyer');
const filterStatus = document.getElementById('filter-status'); 

// 儲存並重新渲染
function saveAndRender() {
    localStorage.setItem('my_shopping_list', JSON.stringify(shoppingList));
    updateBuyerFilterOptions();
    renderList();
}

// 監聽表單提交
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('item-name');
    const buyerInput = document.getElementById('buyer');
    const locationInput = document.getElementById('location');
    const imageInput = document.getElementById('item-image');

    const name = nameInput.value.trim();
    const buyer = buyerInput.value.trim();
    const location = locationInput.value;
    const imageFile = imageInput.files[0];

    const newItem = {
        id: Date.now().toString(),
        name: name,
        buyer: buyer,
        location: location,
        image: "",
        completed: false,
        price: 0
    };

    // 防卡死安全防護：先確認關鍵字搜尋框存在，再重設它
    if (filterKeyword) {
        filterKeyword.value = ""; 
    }
    filterLocation.value = "all";
    filterStatus.value = "all";
    filterBuyer.value = "all";

    // 封裝安全的重置函式，確保在資料「確實存進 LocalStorage」後才清空畫面，防止手機端檔案崩潰
    const safeResetForm = () => {
        nameInput.value = "";   
        buyerInput.value = "";  
        locationInput.value = ""; 
        
        // 圖片欄位安全重建
        const newInput = imageInput.cloneNode(true);
        newInput.value = ""; 
        imageInput.parentNode.replaceChild(newInput, imageInput);
    };

    // 處理圖片與存檔
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            newItem.image = event.target.result;
            shoppingList.push(newItem);
            saveAndRender();  // 1. 確保存檔完成
            safeResetForm();  // 2. 存完才重置畫面
            alert(`🎉 已成功將【${name}】加入預購清單！`); // 💡 新增：成功跳出提示
        };
        reader.readAsDataURL(imageFile);
    } else {
        shoppingList.push(newItem);
        saveAndRender();      // 1. 確保存檔完成
        safeResetForm();      // 2. 存完才重置畫面
        alert(`🎉 已成功將【${name}】加入預購清單！`); // 💡 新增：成功跳出提示
    }
});

// 動態更新「委託人」篩選下拉選單的選項
function updateBuyerFilterOptions() {
    const currentSelected = filterBuyer.value;
    const buyers = [...new Set(shoppingList.map(item => item.buyer))].filter(b => b);
    
    filterBuyer.innerHTML = '<option value="all">全部委託人</option>';
    
    buyers.forEach(buyer => {
        const option = document.createElement('option');
        option.value = buyer;
        option.textContent = buyer;
        filterBuyer.appendChild(option);
    });

    if (buyers.includes(currentSelected)) {
        filterBuyer.value = currentSelected;
    } else {
        filterBuyer.value = "all";
    }
}

// 渲染清單畫面（包含：關鍵字 + 地點 + 委託人 + 狀態 多重複合條件查詢）
function renderList() {
    listContainer.innerHTML = "";
    
    // 💡 安全防護：如果尚未在 HTML 加上關鍵字輸入框，預設為空字串，防止出錯
    const targetKeyword = filterKeyword ? filterKeyword.value.trim().toLowerCase() : ""; 
    const targetLocation = filterLocation.value;
    const targetBuyer = filterBuyer.value;
    const targetStatus = filterStatus.value; 

    // 進行複合過濾
    const filteredList = shoppingList.filter(item => {
        const matchKeyword = item.name.toLowerCase().includes(targetKeyword); 
        const matchLocation = (targetLocation === 'all' || item.location === targetLocation);
        const matchBuyer = (targetBuyer === 'all' || item.buyer === targetBuyer);
        
        let matchStatus = true;
        if (targetStatus === 'completed') {
            matchStatus = item.completed === true;
        } else if (targetStatus === 'uncompleted') {
            matchStatus = item.completed === false;
        }
        
        return matchKeyword && matchLocation && matchBuyer && matchStatus; 
    });

    if (filteredList.length === 0) {
        listContainer.innerHTML = "<p style='color:#888; grid-column: 1/-1; text-align: center;'>沒有符合篩選條件的商品。</p>";
        return;
    }

    filteredList.forEach((item, index) => {
        const cardClass = item.completed ? 'card completed' : 'card';
        const colorClass = `color-${index % 4}`;

        let priceHtml = `<div>💰 價格：尚未購買</div>`;
        if (item.completed) {
            priceHtml = `
                <div>💰 實際價格：$${item.price}</div>
                <div class="charge-info">💸 應向【${item.buyer}】收費 $${item.price}</div>
            `;
        }

        const editBtnHtml = item.completed 
            ? '' 
            : `<button class="btn-delete" style="color: #1A68A6; margin-right: 10px;" onclick="editItem('${item.id}')">編輯</button>`;

        const cardHtml = `
            <div class="${cardClass} ${colorClass}">
                <div>
                    <h3 class="item-title">${item.name}</h3>
                    <div class="item-meta">
                        <div>📍 地點：${item.location}</div>
                        <div>👤 委託人：${item.buyer}</div>
                        ${priceHtml}
                    </div>
                    ${item.image ? `<img src="${item.image}" class="item-img">` : ''}
                </div>
                <div class="card-footer">
                    <label class="checkbox-container">
                        <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleComplete('${item.id}')">
                        購買完成
                    </label>
                    <div>
                        ${editBtnHtml}
                        <button class="btn-delete" onclick="deleteItem('${item.id}')">刪除</button>
                    </div>
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// 監聽所有篩選變更事件
if (filterKeyword) {
    filterKeyword.addEventListener('input', renderList); 
}
filterLocation.addEventListener('change', renderList);
filterBuyer.addEventListener('change', renderList);
filterStatus.addEventListener('change', renderList); 

// 編輯功能
window.editItem = function(id) {
    const item = shoppingList.find(i => i.id === id);
    if (!item) return;

    const newName = prompt(`請輸入新的品名：`, item.name);
    if (newName === null) return; 
    if (newName.trim() === "") {
        alert("品名不能留空！");
        return;
    }

    const newBuyer = prompt(`請輸入新的委託人：`, item.buyer);
    if (newBuyer === null) return; 
    if (newBuyer.trim() === "") {
        alert("委託人不能留空！");
        return;
    }

    item.name = newName.trim();
    item.buyer = newBuyer.trim();
    saveAndRender();
}

// 勾選完成
window.toggleComplete = function(id) {
    const item = shoppingList.find(i => i.id === id);
    if (!item) return;

    if (!item.completed) {
        const userPrice = prompt(`【${item.name}】購買完成！請輸入實際購買價格（向 ${item.buyer} 收費）：`);
        if (userPrice === null) {
            renderList();
            return;
        }
        item.price = userPrice ? parseFloat(userPrice) : 0;
        item.completed = true;
    } else {
        item.completed = false;
        item.price = 0;
    }
    saveAndRender();
}

// 刪除功能
window.deleteItem = function(id) {
    if (confirm("確定要刪除這項商品嗎？")) {
        shoppingList = shoppingList.filter(i => i.id !== id);
        saveAndRender();
    }
}

// 💡 密技：網址最後加上 ?clean=yes 就能幫手機強制清空舊快取資料
if (window.location.search.includes('clean=yes')) {
    localStorage.removeItem('my_shopping_list');
    window.location.href = window.location.origin + window.location.pathname; 
}

// 首次開啟網頁初始化
updateBuyerFilterOptions();
renderList();