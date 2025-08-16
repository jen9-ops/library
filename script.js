// Получаем элементы DOM
const workspace = document.getElementById('workspace');
const createElementBtn = document.getElementById('createElementBtn');
const createElementModal = document.getElementById('createElementModal');
const elementList = document.getElementById('elementList');
const settingsBtn = document.getElementById('settingsBtn');
const projectSettingsModal = document.getElementById('projectSettingsModal');

// Открытие модальных окон
createElementBtn.addEventListener('click', () => {
    createElementModal.style.display = 'block';
});

settingsBtn.addEventListener('click', () => {
    projectSettingsModal.style.display = 'block';
});

// Закрытие модальных окон
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Создание элемента
elementList.addEventListener('click', (event) => {
    const selectedElement = event.target.getAttribute('data-element');
    if (selectedElement) {
        const newElement = document.createElement(selectedElement);
        newElement.classList.add('draggable-resizable');
        newElement.textContent = `Новый ${selectedElement}`;
        
        // Установка начальных размеров и позиции
        newElement.style.left = '50px';
        newElement.style.top = '50px';
        newElement.style.width = '150px';
        newElement.style.height = '100px';

        workspace.appendChild(newElement);
        createElementModal.style.display = 'none';

        // Делаем элемент перетаскиваемым и изменяемым
        makeDraggableAndResizable(newElement);
        
        // Добавляем обработчик для двойного клика
        newElement.addEventListener('dblclick', () => {
            openElementSettings(newElement);
        });
    }
});

// Функция для перетаскивания и изменения размера
function makeDraggableAndResizable(element) {
    let isDragging = false;
    let offsetX, offsetY;
    
    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        // Запоминаем смещение курсора относительно элемента
        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;
        element.style.cursor = 'grabbing';
        
        // Приостанавливаем стандартный resize, чтобы не конфликтовал с drag
        element.style.pointerEvents = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const newLeft = e.clientX - offsetX;
        const newTop = e.clientY - offsetY;
        
        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        element.style.cursor = 'grab';
        // Восстанавливаем pointerEvents
        element.style.pointerEvents = 'auto';
    });
}


// Открытие окна настроек элемента
function openElementSettings(element) {
    const settingsModal = document.getElementById('elementSettingsModal');
    const settingsPanel = document.getElementById('settingsPanel');
    const jsCodeEditor = document.getElementById('jsCodeEditor');
    const applySettingsBtn = document.getElementById('applySettingsBtn');

    // Очищаем панель настроек
    settingsPanel.innerHTML = '';
    
    // Добавляем стандартные настройки (ширина, высота, цвет фона)
    settingsPanel.innerHTML += `
        <label>Ширина:</label>
        <input type="text" id="widthInput" value="${element.style.width}">
        <label>Высота:</label>
        <input type="text" id="heightInput" value="${element.style.height}">
        <label>Цвет фона:</label>
        <input type="color" id="bgColorInput" value="${rgbToHex(element.style.backgroundColor)}">
        `;
    
    // Показываем модальное окно
    settingsModal.style.display = 'block';
    
    applySettingsBtn.onclick = () => {
        // Применяем настройки
        element.style.width = document.getElementById('widthInput').value;
        element.style.height = document.getElementById('heightInput').value;
        element.style.backgroundColor = document.getElementById('bgColorInput').value;
        
        // Применяем JS-код
        try {
            eval(jsCodeEditor.value);
            alert('JS-код успешно применён.');
        } catch (error) {
            alert('Ошибка в JS-коде: ' + error.message);
        }
        
        settingsModal.style.display = 'none';
    };
}

// Вспомогательная функция для конвертации RGB в Hex (для input type="color")
function rgbToHex(rgb) {
    if (!rgb || rgb === 'none' || rgb === 'transparent') return '#ffffff';
    const hex = n => ('0' + n.toString(16)).slice(-2);
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    return '#' + hex(r) + hex(g) + hex(b);
}
