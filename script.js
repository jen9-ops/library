// Получение элементов DOM
const workspace = document.getElementById('workspace');
const createElementBtn = document.getElementById('createElementBtn');
const createElementModal = document.getElementById('createElementModal');
const elementList = document.getElementById('elementList');
const settingsBtn = document.getElementById('settingsBtn');
const projectSettingsModal = document.getElementById('projectSettingsModal');
const elementSettingsModal = document.getElementById('elementSettingsModal');
const applySettingsBtn = document.getElementById('applySettingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const jsCodeEditor = document.getElementById('jsCodeEditor');

let activeElement = null;

// Открытие и закрытие модальных окон
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

createElementBtn.addEventListener('click', () => openModal('createElementModal'));
settingsBtn.addEventListener('click', () => openModal('projectSettingsModal'));

document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal').id));
});

window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
});

// Создание элемента на рабочей области
elementList.addEventListener('click', (event) => {
    const elementType = event.target.getAttribute('data-element');
    if (!elementType) return;

    const newElement = document.createElement(elementType);
    
    // Установка стандартного содержимого
    if (elementType === 'img') {
        newElement.src = "https://via.placeholder.com/150";
        newElement.alt = "Изображение";
    } else if (elementType === 'a') {
        newElement.href = "#";
        newElement.textContent = "Ссылка";
    } else {
        newElement.textContent = `Новый ${elementType}`;
    }

    const wrapper = document.createElement('div');
    wrapper.classList.add('draggable');
    wrapper.style.left = '50px';
    wrapper.style.top = '50px';
    wrapper.style.width = '150px';
    wrapper.style.height = '100px';

    wrapper.appendChild(newElement);
    workspace.appendChild(wrapper);

    makeDraggable(wrapper);
    wrapper.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        activeElement = wrapper;
        openElementSettings(wrapper);
    });
    
    closeModal('createElementModal');
});

// Функция перетаскивания для мыши и тач-устройств
function makeDraggable(element) {
    let isDragging = false;
    let startX, startY;
    let offsetX, offsetY;

    function startDrag(e) {
        isDragging = true;
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        const rect = element.getBoundingClientRect();
        
        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;
        
        element.style.zIndex = 10;
        document.body.style.cursor = 'grabbing';
    }

    function doDrag(e) {
        if (!isDragging) return;
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        let newX = clientX - offsetX;
        let newY = clientY - offsetY;
        
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
    }

    function endDrag() {
        isDragging = false;
        element.style.zIndex = 1;
        document.body.style.cursor = 'default';
    }

    element.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', endDrag);

    element.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', doDrag);
    document.addEventListener('touchend', endDrag);
}

// Открытие окна настроек элемента
function openElementSettings(element) {
    const innerElement = element.firstElementChild;
    settingsPanel.innerHTML = ''; // Очищаем панель

    // Добавляем стандартные поля
    const commonSettings = `
        <label>Ширина:</label>
        <input type="text" id="widthInput" value="${element.style.width}"><br>
        <label>Высота:</label>
        <input type="text" id="heightInput" value="${element.style.height}"><br>
        <label>Цвет фона:</label>
        <input type="color" id="bgColorInput" value="${rgbToHex(element.style.backgroundColor)}"><br>
        <label>Цвет текста:</label>
        <input type="color" id="textColorInput" value="${rgbToHex(element.style.color)}"><br>
        <label>Анимация (CSS):</label><br>
        <input type="text" id="animationInput" placeholder="например: 'shake 1s infinite'" value="${element.style.animation}"><br>
    `;
    settingsPanel.innerHTML += commonSettings;

    // Добавляем специфичные для элемента поля
    if (innerElement.tagName === 'IMG') {
        settingsPanel.innerHTML += `
            <label>URL изображения:</label>
            <input type="text" id="contentInput" value="${innerElement.src || ''}"><br>
        `;
    } else if (innerElement.tagName === 'A') {
        settingsPanel.innerHTML += `
            <label>Текст ссылки:</label>
            <input type="text" id="contentInput" value="${innerElement.textContent || ''}"><br>
            <label>URL ссылки (href):</label>
            <input type="text" id="urlInput" value="${innerElement.href || ''}"><br>
        `;
    } else {
        settingsPanel.innerHTML += `
            <label>Текст:</label>
            <input type="text" id="contentInput" value="${innerElement.textContent || ''}"><br>
        `;
    }

    // Заполняем поле JS-кода
    jsCodeEditor.value = element.jsCode || '';

    openModal('elementSettingsModal');
}

applySettingsBtn.addEventListener('click', () => {
    if (!activeElement) return;

    const innerElement = activeElement.firstElementChild;
    
    activeElement.style.width = document.getElementById('widthInput').value;
    activeElement.style.height = document.getElementById('heightInput').value;
    activeElement.style.backgroundColor = document.getElementById('bgColorInput').value;
    activeElement.style.color = document.getElementById('textColorInput').value;
    activeElement.style.animation = document.getElementById('animationInput').value;

    const contentInput = document.getElementById('contentInput');
    if (contentInput) {
        if (innerElement.tagName === 'IMG') {
            innerElement.src = contentInput.value;
        } else if (innerElement.tagName === 'A') {
            innerElement.textContent = contentInput.value;
            innerElement.href = document.getElementById('urlInput').value;
        } else {
            innerElement.textContent = contentInput.value;
        }
    }

    activeElement.jsCode = jsCodeEditor.value;
    try {
        eval(activeElement.jsCode);
    } catch (error) {
        alert('Ошибка в JS-коде: ' + error.message);
    }

    closeModal('elementSettingsModal');
});

// Вспомогательная функция для конвертации RGB в Hex
function rgbToHex(rgb) {
    if (!rgb || rgb === 'none' || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#ffffff';
    const hex = n => ('0' + parseInt(n).toString(16)).slice(-2);
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    return '#' + hex(r) + hex(g) + hex(b);
}

// Логика для кнопок настроек проекта (сохранить, открыть, показать код, Bootstrap)
document.getElementById('saveProjectBtn').addEventListener('click', () => {
    const projectData = {
        html: workspace.innerHTML,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'web-project.json';
    a.click();
    URL.revokeObjectURL(url);
    alert('Проект сохранён как web-project.json');
});

document.getElementById('openLocalProjectBtn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const projectData = JSON.parse(event.target.result);
                workspace.innerHTML = projectData.html;
                Array.from(workspace.children).forEach(el => {
                    makeDraggable(el);
                    el.addEventListener('dblclick', (e) => {
                         e.stopPropagation();
                         activeElement = el;
                         openElementSettings(el);
                    });
                });
                alert('Проект успешно загружен!');
            } catch (error) {
                alert('Ошибка при загрузке файла: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

document.getElementById('showCodeBtn').addEventListener('click', () => {
    const htmlCode = `
<!DOCTYPE html>
<html>
<head>
    <title>Мой проект</title>
    <style>
        .draggable {
            position: absolute;
            box-sizing: border-box;
            user-select: none;
        }
    </style>
</head>
<body>
    ${workspace.innerHTML}
</body>
</html>
    `;
    const codeWindow = window.open('', '_blank');
    codeWindow.document.write(`<pre>${htmlCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`);
});

document.getElementById('toggleBootstrapBtn').addEventListener('click', () => {
    const linkId = 'bootstrapLink';
    let link = document.getElementById(linkId);
    if (link) {
        link.remove();
        alert('Bootstrap отключен.');
        document.getElementById('toggleBootstrapBtn').textContent = 'Подключить Bootstrap';
    } else {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
        document.head.appendChild(link);
        alert('Bootstrap подключен. Используйте классы, например "btn btn-primary"');
        document.getElementById('toggleBootstrapBtn').textContent = 'Отключить Bootstrap';
    }
});
