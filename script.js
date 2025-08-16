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
const bootstrapModeCheckbox = document.getElementById('bootstrapMode');
const mediaSettingsDiv = document.getElementById('mediaSettings');

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
    
    // Установка стандартного содержимого и атрибутов
    if (elementType === 'img') {
        newElement.src = "https://via.placeholder.com/150";
    } else if (['video', 'audio'].includes(elementType)) {
        newElement.controls = true;
        newElement.style.width = '200px';
        newElement.style.height = '150px';
    } else if (elementType === 'canvas') {
        newElement.width = 150;
        newElement.height = 100;
        newElement.textContent = "Canvas";
        const ctx = newElement.getContext('2d');
        ctx.fillStyle = '#007bff';
        ctx.fillRect(0, 0, 150, 100);
    } else {
        newElement.textContent = `Новый ${elementType}`;
    }

    // Применение стилей Bootstrap
    if (bootstrapModeCheckbox.checked) {
        if (elementType === 'button') {
            newElement.className = 'btn btn-primary';
        } else if (elementType === 'input' || elementType === 'textarea') {
            newElement.className = 'form-control';
        } else if (elementType === 'img') {
            newElement.className = 'img-fluid';
        } else if (elementType === 'h1' || elementType === 'p') {
            newElement.className = 'my-3';
        }
    }

    newElement.classList.add('draggable');
    newElement.style.left = '50px';
    newElement.style.top = '50px';
    newElement.style.minWidth = '50px';
    newElement.style.minHeight = '50px';

    workspace.appendChild(newElement);

    makeDraggableAndResizable(newElement);
    newElement.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        activeElement = newElement;
        openElementSettings(newElement);
    });
    
    closeModal('createElementModal');
});

// Функции перетаскивания и изменения размера (для мыши и тач-устройств)
function makeDraggableAndResizable(element) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startWidth, startHeight, dragOffsetX, dragOffsetY;

    function startAction(e) {
        e.stopPropagation();
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        const rect = element.getBoundingClientRect();
        
        const resizerSize = 10;
        if (clientX > rect.right - resizerSize && clientY > rect.bottom - resizerSize) {
            isResizing = true;
            startX = clientX;
            startY = clientY;
            startWidth = rect.width;
            startHeight = rect.height;
            document.body.style.cursor = 'se-resize';
        } else {
            isDragging = true;
            dragOffsetX = clientX - rect.left;
            dragOffsetY = clientY - rect.top;
            document.body.style.cursor = 'grabbing';
        }
        element.style.zIndex = 10;
    }

    function doAction(e) {
        if (!isDragging && !isResizing) return;
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        if (isDragging) {
            let newX = clientX - dragOffsetX;
            let newY = clientY - dragOffsetY;
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        }
        
        if (isResizing) {
            let newWidth = startWidth + (clientX - startX);
            let newHeight = startHeight + (clientY - startY);
            if (newWidth > 50) element.style.width = `${newWidth}px`;
            if (newHeight > 50) element.style.height = `${newHeight}px`;
        }
    }

    function endAction() {
        isDragging = false;
        isResizing = false;
        document.body.style.cursor = 'default';
        element.style.zIndex = 1;
    }

    element.addEventListener('mousedown', startAction);
    document.addEventListener('mousemove', doAction);
    document.addEventListener('mouseup', endAction);
    element.addEventListener('touchstart', startAction);
    document.addEventListener('touchmove', doAction);
    document.addEventListener('touchend', endAction);
}

// Открытие окна настроек элемента
function openElementSettings(element) {
    activeElement = element;
    const elementType = element.tagName.toLowerCase();
    
    // Заполняем общие поля
    document.getElementById('widthInput').value = element.style.width;
    document.getElementById('heightInput').value = element.style.height;
    document.getElementById('zIndexInput').value = element.style.zIndex;
    document.getElementById('opacityInput').value = element.style.opacity || '1';
    document.getElementById('bgColorInput').value = rgbToHex(element.style.backgroundColor);
    document.getElementById('animationSelect').value = element.style.animation;
    document.getElementById('bootstrapClassesInput').value = element.className;
    
    // Скрываем или показываем медиа-поля
    mediaSettingsDiv.style.display = (['img', 'video', 'audio'].includes(elementType)) ? 'block' : 'none';

    // Заполняем специфические поля
    if (elementType === 'img') {
        document.getElementById('contentInput').value = element.src;
        document.getElementById('bgImageInput').value = element.style.backgroundImage.slice(5, -2);
    } else if (['video', 'audio'].includes(elementType)) {
        document.getElementById('mediaUrlInput').value = element.src;
    } else if (elementType === 'a') {
        document.getElementById('contentInput').value = element.textContent;
    } else {
        document.getElementById('contentInput').value = element.textContent;
    }
    
    jsCodeEditor.value = element.jsCode || '';
    openModal('elementSettingsModal');
}

applySettingsBtn.addEventListener('click', () => {
    if (!activeElement) return;

    activeElement.style.width = document.getElementById('widthInput').value;
    activeElement.style.height = document.getElementById('heightInput').value;
    activeElement.style.zIndex = document.getElementById('zIndexInput').value;
    activeElement.style.opacity = document.getElementById('opacityInput').value;
    activeElement.style.backgroundColor = document.getElementById('bgColorInput').value;
    activeElement.style.animation = document.getElementById('animationSelect').value;
    activeElement.className = document.getElementById('bootstrapClassesInput').value;
    
    const bgImage = document.getElementById('bgImageInput').value;
    activeElement.style.backgroundImage = bgImage ? `url("${bgImage}")` : 'none';

    const elementType = activeElement.tagName.toLowerCase();
    const content = document.getElementById('contentInput').value;
    const mediaUrl = document.getElementById('mediaUrlInput').value;

    if (elementType === 'img') {
        activeElement.src = content;
    } else if (['video', 'audio'].includes(elementType)) {
        activeElement.src = mediaUrl;
    } else if (elementType === 'a') {
        activeElement.textContent = content;
        activeElement.href = content;
    } else {
        activeElement.textContent = content;
    }

    activeElement.jsCode = jsCodeEditor.value;
    try {
        eval(activeElement.jsCode);
    } catch (error) {
        alert('Ошибка в JS-коде: ' + error.message);
    }
    closeModal('elementSettingsModal');
});

// Загрузка локального файла для медиа
document.getElementById('mediaFileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target.result;
            if (activeElement) {
                activeElement.src = url;
                document.getElementById('mediaUrlInput').value = url;
            }
        };
        reader.readAsDataURL(file);
    }
});

// Вспомогательная функция для конвертации RGB в Hex
function rgbToHex(rgb) {
    if (!rgb || rgb === 'none' || rgb === 'transparent' || rgb.includes('rgba(0, 0, 0, 0)')) return '#ffffff';
    const hex = n => ('0' + parseInt(n).toString(16)).slice(-2);
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    return '#' + hex(r) + hex(g) + hex(b);
}

// Логика для кнопок настроек проекта
document.getElementById('addLibraryBtn').addEventListener('click', () => {
    const url = document.getElementById('libraryUrlInput').value;
    if (url) {
        if (url.endsWith('.css')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            document.head.appendChild(link);
        } else if (url.endsWith('.js')) {
            const script = document.createElement('script');
            script.src = url;
            document.body.appendChild(script);
        }
        alert('Библиотека успешно добавлена!');
        document.getElementById('libraryUrlInput').value = '';
    }
});

// Код для кнопок сохранения/загрузки/показа кода... (не изменился)
document.getElementById('saveProjectBtn').addEventListener('click', () => {
    const projectData = { html: workspace.innerHTML };
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
                    makeDraggableAndResizable(el);
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
