// DOM Elements
const htmlCode = document.getElementById('html-code');
const cssCode = document.getElementById('css-code');
const jsCode = document.getElementById('js-code');
const preview = document.getElementById('preview');
const projectNameInput = document.getElementById('project-name');
const currentProjectSpan = document.getElementById('current-project');
const appearanceSelect = document.getElementById('appearance-select');
const saveStatus = document.getElementById('save-status');
const sidebar = document.getElementById('sidebar');
const projectsList = document.getElementById('projects-list');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');

// State Management
let currentProject = null;
let projects = [];
let isModified = false;
let autoSaveTimer = null;

// Keep these keys to retain access to existing saved projects.
const STORAGE_KEY = 'codepen_projects';
const CURRENT_PROJECT_KEY = 'codepen_current_project';
const THEME_STORAGE_KEY = 'liveloom_appearance';
const AVAILABLE_THEMES = new Set(['light', 'dark', 'eco', 'neon']);

// Initialize
function init() {
    initializeAppearance();
    loadProjects();
    loadLastProject();
    setupEventListeners();
    updatePreview();
    updateSaveStatus();
}

// LocalStorage Operations
function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function loadProjects() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        projects = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Could not load saved projects:', error);
        projects = [];
    }

    renderProjectsList();
}

function loadLastProject() {
    const lastProjectId = localStorage.getItem(CURRENT_PROJECT_KEY);
    const project = projects.find(item => item.id === lastProjectId);

    if (project) {
        applyProject(project);
        return;
    }

    currentProject = null;
    currentProjectSpan.textContent = 'New project';
    updateSaveStatus();
}

// Appearance preference: stored separately from project data.
function initializeAppearance() {
    let savedTheme = 'dark';
    try {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (AVAILABLE_THEMES.has(storedTheme)) {
            savedTheme = storedTheme;
        }
    } catch (error) {
        // Keep the app usable when browser storage is unavailable.
    }

    applyTheme(savedTheme, false);
}

function applyTheme(theme, persist = false) {
    const selectedTheme = AVAILABLE_THEMES.has(theme) ? theme : 'dark';
    document.documentElement.dataset.theme = selectedTheme;
    appearanceSelect.value = selectedTheme;

    const pageColor = getComputedStyle(document.documentElement).getPropertyValue('--page').trim();
    document.querySelector('meta[name="theme-color"]').content = pageColor;

    if (persist) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
        } catch (error) {
            // The selected theme still applies for this session.
        }
    }
}

// Project Management
function createNewProject() {
    if (isModified) {
        showModal(
            'Unsaved changes',
            'Save your changes before creating a new project?',
            () => {
                saveCurrentProject();
                clearEditors();
            },
            clearEditors,
            'Save & continue',
            'Discard'
        );
    } else {
        clearEditors();
    }
}

function clearEditors() {
    clearTimeout(autoSaveTimer);
    htmlCode.value = '';
    cssCode.value = '';
    jsCode.value = '';
    projectNameInput.value = '';
    currentProject = null;
    currentProjectSpan.textContent = 'New project';
    localStorage.removeItem(CURRENT_PROJECT_KEY);
    isModified = false;
    updateFileIndicators();
    updateSaveStatus();
    updatePreview();
}

function saveCurrentProject(showFeedback = true) {
    const projectName = projectNameInput.value.trim() || 'Untitled Project';
    const now = new Date().toISOString();
    const projectData = {
        id: currentProject?.id || generateId(),
        name: projectName,
        html: htmlCode.value,
        css: cssCode.value,
        js: jsCode.value,
        lastModified: now,
        created: currentProject?.created || now
    };

    if (currentProject) {
        const index = projects.findIndex(project => project.id === currentProject.id);
        if (index !== -1) {
            projects[index] = projectData;
        } else {
            projects.unshift(projectData);
        }
    } else {
        projects.unshift(projectData);
    }

    currentProject = projectData;
    projectNameInput.value = projectName;
    currentProjectSpan.textContent = projectName;
    saveToLocalStorage();
    localStorage.setItem(CURRENT_PROJECT_KEY, currentProject.id);
    isModified = false;
    updateFileIndicators();
    updateSaveStatus();
    renderProjectsList();

    if (showFeedback) {
        showNotification('Project saved successfully.');
    }
}

function loadProject(project) {
    if (isModified) {
        showModal(
            'Unsaved changes',
            'Save your changes before loading another project?',
            () => {
                saveCurrentProject();
                applyProject(project);
            },
            () => applyProject(project),
            'Save & open',
            'Discard'
        );
    } else {
        applyProject(project);
    }
}

function applyProject(project) {
    clearTimeout(autoSaveTimer);
    currentProject = project;
    htmlCode.value = project.html || '';
    cssCode.value = project.css || '';
    jsCode.value = project.js || '';
    projectNameInput.value = project.name || '';
    currentProjectSpan.textContent = project.name || 'Untitled Project';
    localStorage.setItem(CURRENT_PROJECT_KEY, project.id);
    isModified = false;
    updateFileIndicators();
    updateSaveStatus();
    updatePreview();
    renderProjectsList();
    closeSidebar();
}

function deleteProject(projectId, event) {
    event.stopPropagation();

    const project = projects.find(item => item.id === projectId);
    if (!project) return;

    showModal(
        'Delete project?',
        `Delete “${project.name}”? This cannot be undone.`,
        () => {
            projects = projects.filter(item => item.id !== projectId);
            saveToLocalStorage();
            renderProjectsList();

            if (currentProject?.id === projectId) {
                clearEditors();
            }

            showNotification('Project deleted.');
        },
        undefined,
        'Delete project',
        'Cancel'
    );
}

function exportProject() {
    if (!currentProject && !htmlCode.value && !cssCode.value && !jsCode.value) {
        showNotification('Nothing to export.', 'error');
        return;
    }

    const projectName = projectNameInput.value.trim() || 'project';
    const html = htmlCode.value;
    const css = cssCode.value;
    const js = jsCode.value;
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(projectName)}</title>
    <style>
${css}
    </style>
</head>
<body>
${html}
    <script>
${js}
    <\/script>
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.html`;
    link.click();
    URL.revokeObjectURL(url);

    showNotification('Project exported as HTML.');
}

function clearAllProjects() {
    showModal(
        'Clear all projects?',
        'This permanently deletes every saved project from this browser. This cannot be undone.',
        () => {
            projects = [];
            saveToLocalStorage();
            localStorage.removeItem(CURRENT_PROJECT_KEY);
            renderProjectsList();
            clearEditors();
            showNotification('All projects cleared.');
        },
        undefined,
        'Clear all',
        'Cancel'
    );
}

// UI Updates
function renderProjectsList() {
    projectsList.replaceChildren();

    if (projects.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No projects yet. Create your first project!';
        projectsList.appendChild(emptyState);
        return;
    }

    projects.forEach(project => {
        const item = document.createElement('div');
        item.className = 'project-item';
        if (currentProject?.id === project.id) {
            item.classList.add('active');
        }

        const openButton = document.createElement('button');
        openButton.className = 'project-item-open';
        openButton.type = 'button';
        openButton.setAttribute('aria-label', `Open project ${project.name || 'Untitled Project'}`);

        const name = document.createElement('span');
        name.className = 'project-item-name';
        name.textContent = project.name || 'Untitled Project';

        const date = document.createElement('span');
        date.className = 'project-item-date';
        const modified = project.lastModified ? new Date(project.lastModified) : null;
        date.textContent = modified && !Number.isNaN(modified.getTime())
            ? `${modified.toLocaleDateString()} ${modified.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Saved project';

        const deleteButton = document.createElement('button');
        deleteButton.className = 'project-item-delete';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.setAttribute('aria-label', `Delete project ${project.name || 'Untitled Project'}`);
        deleteButton.addEventListener('click', event => deleteProject(project.id, event));

        openButton.append(name, date);
        openButton.addEventListener('click', () => loadProject(project));
        item.append(openButton, deleteButton);
        projectsList.appendChild(item);
    });
}

function updateFileIndicators() {
    document.querySelectorAll('.file-info').forEach(indicator => {
        indicator.classList.toggle('modified', isModified);
    });
}

function updateSaveStatus() {
    if (!saveStatus) return;

    const status = isModified
        ? 'Unsaved changes'
        : currentProject
            ? 'Saved locally'
            : 'Not saved';

    saveStatus.textContent = status;
    document.querySelectorAll('.editor-save-state').forEach(state => {
        state.textContent = isModified ? 'Edited' : currentProject ? 'Saved' : 'Not saved';
    });
}

function updatePreview() {
    try {
        const html = htmlCode.value;
        const cssTokens = getComputedStyle(document.documentElement);
        const css = `<style>
${cssCode.value}
.liveloom-preview-error {
    background: ${cssTokens.getPropertyValue('--error-bg').trim()};
    color: ${cssTokens.getPropertyValue('--error-text').trim()};
    padding: 16px;
    margin: 16px;
    border: 1px solid ${cssTokens.getPropertyValue('--line-strong').trim()};
    border-radius: ${cssTokens.getPropertyValue('--radius-sm').trim()};
    font: 13px/1.5 ui-monospace, monospace;
}
</style>`;
        const js = `<script>
            try {
                ${jsCode.value}
            } catch (error) {
                console.error('Error in your code:', error);
                const message = document.createElement('div');
                message.className = 'liveloom-preview-error';
                message.textContent = 'Error: ' + error.message;
                document.body.appendChild(message);
            }
        <\/script>`;

        const previewDocument = preview.contentDocument || preview.contentWindow.document;
        previewDocument.open();
        previewDocument.write(html + css + js);
        previewDocument.close();
    } catch (error) {
        console.error('Preview error:', error);
    }
}

// Modal Functions
function showModal(title, message, onConfirm, onCancel, confirmLabel = 'Continue', cancelLabel = 'Cancel') {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalConfirm.textContent = confirmLabel;
    modalCancel.textContent = cancelLabel;
    modal.classList.add('active');

    modalConfirm.onclick = () => {
        if (onConfirm) onConfirm();
        closeModal();
    };

    modalCancel.onclick = () => {
        if (onCancel) onCancel();
        closeModal();
    };

    modalConfirm.focus();
}

function closeModal() {
    modal.classList.remove('active');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification${type === 'error' ? ' is-error' : ''}`;
    notification.setAttribute('role', type === 'error' ? 'alert' : 'status');
    notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('is-leaving');
        setTimeout(() => notification.remove(), 200);
    }, 3000);
}

// Sidebar Functions
function toggleSidebar() {
    const isOpen = sidebar.classList.toggle('active');
    sidebar.setAttribute('aria-hidden', String(!isOpen));
    sidebar.inert = !isOpen;
    document.getElementById('toggle-sidebar').setAttribute('aria-expanded', String(isOpen));
}

function closeSidebar() {
    sidebar.classList.remove('active');
    sidebar.setAttribute('aria-hidden', 'true');
    sidebar.inert = true;
    document.getElementById('toggle-sidebar').setAttribute('aria-expanded', 'false');
}

function setMobileView(view) {
    document.body.dataset.mobileView = view;
    document.querySelectorAll('.workspace-view-button').forEach(button => {
        const isActive = button.dataset.view === view;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function autoSave() {
    if (isModified && currentProject) {
        saveCurrentProject(false);
    }
}

// Event Listeners
function setupEventListeners() {
    [htmlCode, cssCode, jsCode].forEach(editor => {
        editor.addEventListener('input', () => {
            isModified = true;
            updateFileIndicators();
            updateSaveStatus();
            updatePreview();
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(autoSave, 3000);
        });
    });

    document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar);
    document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
    document.getElementById('new-project').addEventListener('click', createNewProject);
    document.getElementById('save-project').addEventListener('click', () => saveCurrentProject());
    document.getElementById('export-project').addEventListener('click', exportProject);
    document.getElementById('clear-all').addEventListener('click', clearAllProjects);
    document.getElementById('refresh-preview').addEventListener('click', updatePreview);

    projectNameInput.addEventListener('input', () => {
        isModified = true;
        updateFileIndicators();
        updateSaveStatus();
    });

    appearanceSelect.addEventListener('change', () => {
        applyTheme(appearanceSelect.value, true);
    });

    document.querySelectorAll('.workspace-view-button').forEach(button => {
        button.addEventListener('click', () => setMobileView(button.dataset.view));
    });

    setupResizer();

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            saveCurrentProject();
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
            event.preventDefault();
            createNewProject();
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') {
            event.preventDefault();
            exportProject();
        }
    });

    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    [htmlCode, cssCode, jsCode].forEach(editor => {
        editor.addEventListener('keydown', event => {
            if (event.key !== 'Tab') return;

            event.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.setRangeText('    ', start, end, 'end');
            editor.dispatchEvent(new Event('input', { bubbles: true }));
        });
    });

    setupHtmlAutoClose(htmlCode);
}

// Desktop split resizing
function setupResizer() {
    const resizer = document.getElementById('resizer');
    const leftPanel = document.getElementById('left-panel');
    const container = document.querySelector('.container');
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    resizer.addEventListener('mousedown', event => {
        isResizing = true;
        startX = event.clientX;
        startWidth = leftPanel.offsetWidth;
        resizer.classList.add('resizing');
        document.body.classList.add('resizing');
        event.preventDefault();
    });

    document.addEventListener('mousemove', event => {
        if (!isResizing) return;

        const newWidth = startWidth + event.clientX - startX;
        const containerWidth = container.offsetWidth;
        const minWidth = 200;
        const maxWidth = containerWidth - 200 - resizer.offsetWidth;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            const percentage = (newWidth / containerWidth) * 100;
            leftPanel.style.width = `${percentage}%`;
            resizer.setAttribute('aria-valuenow', String(Math.round(percentage)));
        }
    });

    resizer.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;

        event.preventDefault();
        const containerWidth = container.offsetWidth;
        const step = event.shiftKey ? 5 : 1;
        const currentWidth = leftPanel.offsetWidth;
        const nextWidth = currentWidth + (event.key === 'ArrowRight' ? step : -step) * containerWidth / 100;
        const minWidth = 200;
        const maxWidth = containerWidth - 200 - resizer.offsetWidth;

        if (nextWidth >= minWidth && nextWidth <= maxWidth) {
            const percentage = (nextWidth / containerWidth) * 100;
            leftPanel.style.width = `${percentage}%`;
            resizer.setAttribute('aria-valuenow', String(Math.round(percentage)));
        }
    });

    document.addEventListener('mouseup', () => {
        if (!isResizing) return;
        isResizing = false;
        resizer.classList.remove('resizing');
        document.body.classList.remove('resizing');
    });
}

// Initialize app
init();

// Retained for compatibility with existing project-list integrations.
window.deleteProject = deleteProject;
