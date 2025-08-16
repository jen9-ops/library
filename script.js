// Получение элементов DOM
const workspace = document.getElementById('workspace');
const createElementBtn = document.getElementById('createElementBtn');
const createElementModal = document.getElementById('createElementModal');
const elementList = document.getElementById('elementList');
const settingsBtn = document.getElementById('settingsBtn');
const projectSettingsModal = document.getElementById('projectSettingsModal');
const elementSettingsModal = document.getElementById('elementSettingsModal');
const applySettingsBtn = document.getElementById('applySettingsBtn');

let activeElement = null; // Элемент, с которым мы сейчас работаем

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
    newElement.textContent = `Новый ${elementType}`;

    const wrapper = document.createElement('div');
    wrapper.classList.add('draggable-resizable');
    wrapper.style.left = '50px';
    wrapper.style.top = '50px';
    wrapper.style.width = '150px';
    wrapper.style.height = '100px';

    wrapper.appendChild(newElement);
    workspace.appendChild(wrapper);

    makeDraggableAndResizable(wrapper);
    wrapper.addEventListener('dblclick', () => {
        activeElement = wrapper;
        openElementSettings(wrapper);
    });
    
    closeModal('createElementModal');
});

// Функции перетаскивания и изменения размера
function makeDraggableAndResizable(element) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    element.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Останавливаем всплытие, чтобы не срабатывал клик по рабочему пространству
        const rect = element.getBoundingClientRect();
        
        // Проверяем, если клик был в области 10px от правого нижнего угла
        if (e.clientX > rect.right - 10 && e.clientY > rect.bottom - 10) {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = rect.width;
            startHeight = rect.height;
            document.body.style.cursor = 'se-resize';
        } else {
            isDragging = true;
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            document.body.style.cursor = 'grabbing';
        }
        
        element.style.zIndex = 10; // Поднимаем активный элемент наверх
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            let newX = e.clientX - startX;
            let newY = e.clientY - startY;
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        }
        
        if (isResizing) {
            let newWidth = startWidth + (e.clientX - startX);
            let newHeight = startHeight + (e.clientY - startY);
            if (newWidth > 50) element.style.width = `${newWidth}px`;
            if (newHeight > 50) element.style.height = `${newHeight}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        document.body.style.cursor = 'default';
        element.style.zIndex = 1; // Возвращаем z-index
    });
}

// Открытие окна настроек элемента
function openElementSettings(element) {
    const innerElement = element.firstElementChild;
    const settingsPanel = document.getElementById('settingsPanel');
    const contentInput = document.getElementById('contentInput');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const bgColorInput = document.getElementById('bgColorInput');
    const textColorInput = document.getElementById('textColorInput');
    const animationInput = document.getElementById('animationInput');
    const jsCodeEditor = document.getElementById('jsCodeEditor');
    
    // Заполняем поля текущими значениями
    if (innerElement.tagName === 'IMG') {
        contentInput.value = innerElement.src;
    } else {
        contentInput.value = innerElement.textContent;
    }
    
    widthInput.value = element.style.width;
    heightInput.value = element.style.height;
    bgColorInput.value = rgbToHex(element.style.backgroundColor);
    textColorInput.value = rgbToHex(element.style.color);
    animationInput.value = element.style.animation;
    jsCodeEditor.value = element.jsCode || '';

    openModal('elementSettingsModal');
}

applySettingsBtn.addEventListener('click', () => {
    if (!activeElement) return;

    const innerElement = activeElement.firstElementChild;
    
    // Применяем настройки
    activeElement.style.width = document.getElementById('widthInput').value;
    activeElement.style.height = document.getElementById('heightInput').value;
    activeElement.style.backgroundColor = document.getElementById('bgColorInput').value;
    activeElement.style.color = document.getElementById('textColorInput').value;
    activeElement.style.animation = document.getElementById('animationInput').value;

    const content = document.getElementById('contentInput').value;
    if (innerElement.tagName === 'IMG') {
        innerElement.src = content;
    } else {
        innerElement.textContent = content;
    }

    // Применяем JS-код
    activeElement.jsCode = document.getElementById('jsCodeEditor').value;
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
                    makeDraggableAndResizable(el);
                    el.addEventListener('dblclick', () => {
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
        .draggable-resizable {
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
