import { auth, db, signOut, onAuthStateChanged, collection, doc, setDoc, getDocs, deleteDoc }
    from './firebase.js';
import { setupHtmlAutoClose } from './autoclose.js';

// Auth guard — redirect to login if not signed in
onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = 'auth.html';
    } else {
        currentUser = user;
        init();
    }
});

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

// State
let currentUser = null;
let currentProject = null;
let projects = [];
let isModified = false;
let autoSaveTimer = null;

const THEME_STORAGE_KEY = 'liveloom_appearance';
const AVAILABLE_THEMES = new Set(['light', 'dark', 'eco', 'neon']);

// Firestore helpers
function userProjectsRef() {
    return collection(db, 'users', currentUser.uid, 'projects');
}

async function saveToFirestore(projectData) {
    await setDoc(doc(db, 'users', currentUser.uid, 'projects', projectData.id), projectData);
}

async function deleteFromFirestore(projectId) {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'projects', projectId));
}

async function loadFromFirestore() {
    const snapshot = await getDocs(userProjectsRef());
    return snapshot.docs.map(d => d.data()).sort((a, b) =>
        new Date(b.lastModified) - new Date(a.lastModified)
    );
}

// Initialize
async function init() {
    initializeAppearance();
    await loadProjects();
    loadLastProject();
    setupEventListeners();
    updatePreview();
    updateSaveStatus();
}

// Appearance
function initializeAppearance() {
    let savedTheme = 'dark';
    try {
        const t = localStorage.getItem(THEME_STORAGE_KEY);
        if (AVAILABLE_THEMES.has(t)) savedTheme = t;
    } catch {}
    applyTheme(savedTheme, false);
}

function applyTheme(theme, persist = false) {
    const t = AVAILABLE_THEMES.has(theme) ? theme : 'dark';
    document.documentElement.dataset.theme = t;
    appearanceSelect.value = t;
    document.querySelector('meta[name="theme-color"]').content =
        getComputedStyle(document.documentElement).getPropertyValue('--page').trim();
    if (persist) {
        try { localStorage.setItem(THEME_STORAGE_KEY, t); } catch {}
    }
}

// Project Management
async function loadProjects() {
    try {
        projects = await loadFromFirestore();
    } catch (err) {
        console.error('Could not load projects:', err);
        projects = [];
    }
    renderProjectsList();
}

function loadLastProject() {
    const lastId = localStorage.getItem(`liveloom_current_${currentUser.uid}`);
    const project = projects.find(p => p.id === lastId);
    if (project) { applyProject(project); return; }
    currentProject = null;
    currentProjectSpan.textContent = 'New project';
    updateSaveStatus();
}

function createNewProject() {
    if (isModified) {
        showModal('Unsaved changes', 'Save your changes before creating a new project?',
            () => { saveCurrentProject(); clearEditors(); },
            clearEditors, 'Save & continue', 'Discard');
    } else {
        clearEditors();
    }
}

function clearEditors() {
    clearTimeout(autoSaveTimer);
    htmlCode.value = cssCode.value = jsCode.value = '';
    projectNameInput.value = '';
    currentProject = null;
    currentProjectSpan.textContent = 'New project';
    localStorage.removeItem(`liveloom_current_${currentUser.uid}`);
    isModified = false;
    updateFileIndicators();
    updateSaveStatus();
    updatePreview();
}

async function saveCurrentProject(showFeedback = true) {
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

    const index = projects.findIndex(p => p.id === projectData.id);
    if (index !== -1) projects[index] = projectData;
    else projects.unshift(projectData);

    currentProject = projectData;
    projectNameInput.value = projectName;
    currentProjectSpan.textContent = projectName;
    localStorage.setItem(`liveloom_current_${currentUser.uid}`, currentProject.id);
    isModified = false;
    updateFileIndicators();
    updateSaveStatus();
    renderProjectsList();

    try {
        await saveToFirestore(projectData);
        if (showFeedback) showNotification('Project saved successfully.');
    } catch (err) {
        showNotification('Save failed. Check your connection.', 'error');
    }
}

function loadProject(project) {
    if (isModified) {
        showModal('Unsaved changes', 'Save your changes before loading another project?',
            () => { saveCurrentProject(); applyProject(project); },
            () => applyProject(project), 'Save & open', 'Discard');
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
    localStorage.setItem(`liveloom_current_${currentUser.uid}`, project.id);
    isModified = false;
    updateFileIndicators();
    updateSaveStatus();
    updatePreview();
    renderProjectsList();
    closeSidebar();
}

function deleteProject(projectId, event) {
    event.stopPropagation();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    showModal('Delete project?', `Delete "${project.name}"? This cannot be undone.`,
        async () => {
            projects = projects.filter(p => p.id !== projectId);
            renderProjectsList();
            if (currentProject?.id === projectId) clearEditors();
            try {
                await deleteFromFirestore(projectId);
                showNotification('Project deleted.');
            } catch {
                showNotification('Delete failed. Check your connection.', 'error');
            }
        }, undefined, 'Delete project', 'Cancel');
}

function exportProject() {
    if (!currentProject && !htmlCode.value && !cssCode.value && !jsCode.value) {
        showNotification('Nothing to export.', 'error'); return;
    }
    const projectName = projectNameInput.value.trim() || 'project';
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(projectName)}</title>
    <style>\n${cssCode.value}\n    </style>
</head>
<body>
${htmlCode.value}
    <script>\n${jsCode.value}\n    <\/script>
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
    showModal('Clear all projects?',
        'This permanently deletes every saved project. This cannot be undone.',
        async () => {
            const ids = projects.map(p => p.id);
            projects = [];
            renderProjectsList();
            clearEditors();
            try {
                await Promise.all(ids.map(id => deleteFromFirestore(id)));
                showNotification('All projects cleared.');
            } catch {
                showNotification('Some projects could not be deleted.', 'error');
            }
        }, undefined, 'Clear all', 'Cancel');
}

// UI Updates
function renderProjectsList() {
    projectsList.replaceChildren();
    if (projects.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty-state';
        p.textContent = 'No projects yet. Create your first project!';
        projectsList.appendChild(p);
        return;
    }
    projects.forEach(project => {
        const item = document.createElement('div');
        item.className = 'project-item' + (currentProject?.id === project.id ? ' active' : '');

        const openBtn = document.createElement('button');
        openBtn.className = 'project-item-open';
        openBtn.type = 'button';
        openBtn.setAttribute('aria-label', `Open project ${project.name || 'Untitled Project'}`);

        const name = document.createElement('span');
        name.className = 'project-item-name';
        name.textContent = project.name || 'Untitled Project';

        const date = document.createElement('span');
        date.className = 'project-item-date';
        const modified = project.lastModified ? new Date(project.lastModified) : null;
        date.textContent = modified && !isNaN(modified)
            ? `${modified.toLocaleDateString()} ${modified.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Saved project';

        const delBtn = document.createElement('button');
        delBtn.className = 'project-item-delete';
        delBtn.type = 'button';
        delBtn.textContent = 'Delete';
        delBtn.setAttribute('aria-label', `Delete project ${project.name || 'Untitled Project'}`);
        delBtn.addEventListener('click', e => deleteProject(project.id, e));

        openBtn.append(name, date);
        openBtn.addEventListener('click', () => loadProject(project));
        item.append(openBtn, delBtn);
        projectsList.appendChild(item);
    });
}

function updateFileIndicators() {
    document.querySelectorAll('.file-info').forEach(el => el.classList.toggle('modified', isModified));
}

function updateSaveStatus() {
    if (!saveStatus) return;
    saveStatus.textContent = isModified ? 'Unsaved changes' : currentProject ? 'Saved' : 'Not saved';
    document.querySelectorAll('.editor-save-state').forEach(el => {
        el.textContent = isModified ? 'Edited' : currentProject ? 'Saved' : 'Not saved';
    });
}

function updatePreview() {
    try {
        const cssTokens = getComputedStyle(document.documentElement);
        const css = `<style>html{background:#2b2b2b}\n${cssCode.value}\n.liveloom-preview-error{background:${cssTokens.getPropertyValue('--error-bg').trim()};color:${cssTokens.getPropertyValue('--error-text').trim()};padding:16px;margin:16px;border:1px solid ${cssTokens.getPropertyValue('--line-strong').trim()};border-radius:${cssTokens.getPropertyValue('--radius-sm').trim()};font:13px/1.5 ui-monospace,monospace}</style>`;
        const js = `<script>try{${jsCode.value}}catch(e){const m=document.createElement('div');m.className='liveloom-preview-error';m.textContent='Error: '+e.message;document.body.appendChild(m)}<\/script>`;
        const pd = preview.contentDocument || preview.contentWindow.document;
        pd.open(); pd.write(htmlCode.value + css + js); pd.close();
    } catch (err) { console.error('Preview error:', err); }
}

// Modal
function showModal(title, message, onConfirm, onCancel, confirmLabel = 'Continue', cancelLabel = 'Cancel') {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalConfirm.textContent = confirmLabel;
    modalCancel.textContent = cancelLabel;
    modal.classList.add('active');
    modalConfirm.onclick = () => { if (onConfirm) onConfirm(); closeModal(); };
    modalCancel.onclick = () => { if (onCancel) onCancel(); closeModal(); };
    modalConfirm.focus();
}

function closeModal() { modal.classList.remove('active'); }

function showNotification(message, type = 'success') {
    const n = document.createElement('div');
    n.className = 'notification';
    n.setAttribute('role', type === 'error' ? 'alert' : 'status');
    n.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => { n.classList.add('is-leaving'); setTimeout(() => n.remove(), 200); }, 3000);
}

// Sidebar
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
    document.querySelectorAll('.workspace-view-button').forEach(btn => {
        const active = btn.dataset.view === view;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
    });
}

// Utilities
function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function escapeHtml(v) {
    return v.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}
function autoSave() { if (isModified && currentProject) saveCurrentProject(false); }

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
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'auth.html';
    });

    projectNameInput.addEventListener('input', () => {
        isModified = true; updateFileIndicators(); updateSaveStatus();
    });

    appearanceSelect.addEventListener('change', () => applyTheme(appearanceSelect.value, true));

    document.querySelectorAll('.workspace-view-button').forEach(btn => {
        btn.addEventListener('click', () => setMobileView(btn.dataset.view));
    });

    setupResizer();
    setupEditorResizers();

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.classList.contains('active')) { closeModal(); return; }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveCurrentProject(); }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') { event.preventDefault(); createNewProject(); }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') { event.preventDefault(); exportProject(); }
    });

    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    [htmlCode, cssCode, jsCode].forEach(editor => {
        editor.addEventListener('keydown', event => {
            if (event.key !== 'Tab') return;
            event.preventDefault();
            const s = editor.selectionStart, e2 = editor.selectionEnd;
            editor.setRangeText('    ', s, e2, 'end');
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
    let isResizing = false, startX = 0, startWidth = 0;

    resizer.addEventListener('mousedown', e => {
        isResizing = true; startX = e.clientX; startWidth = leftPanel.offsetWidth;
        resizer.classList.add('resizing'); document.body.classList.add('resizing'); e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
        if (!isResizing) return;
        const newWidth = startWidth + e.clientX - startX;
        const max = container.offsetWidth - 200 - resizer.offsetWidth;
        if (newWidth >= 200 && newWidth <= max) {
            leftPanel.style.width = `${(newWidth / container.offsetWidth) * 100}%`;
            resizer.setAttribute('aria-valuenow', String(Math.round((newWidth / container.offsetWidth) * 100)));
        }
    });
    resizer.addEventListener('keydown', e => {
        if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const cw = container.offsetWidth;
        const next = leftPanel.offsetWidth + (e.key === 'ArrowRight' ? step : -step) * cw / 100;
        if (next >= 200 && next <= cw - 200 - resizer.offsetWidth) {
            leftPanel.style.width = `${(next / cw) * 100}%`;
        }
    });
    document.addEventListener('mouseup', () => {
        if (!isResizing) return;
        isResizing = false; resizer.classList.remove('resizing'); document.body.classList.remove('resizing');
    });
}

// Vertical editor resizing
function setupEditorResizers() {
    const leftPanel = document.getElementById('left-panel');
    [['editor-resizer-1', 0, 1], ['editor-resizer-2', 1, 2]].forEach(([id, topIdx, botIdx]) => {
        const resizer = document.getElementById(id);
        const sections = leftPanel.querySelectorAll('.editor-section');
        const top = sections[topIdx], bot = sections[botIdx];
        let isResizing = false, startY = 0, startTopH = 0, startBotH = 0;

        resizer.addEventListener('mousedown', e => {
            isResizing = true; startY = e.clientY;
            startTopH = top.offsetHeight; startBotH = bot.offsetHeight;
            resizer.classList.add('resizing'); document.body.classList.add('resizing-editor'); e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!isResizing) return;
            const delta = e.clientY - startY;
            const newTopH = startTopH + delta, newBotH = startBotH - delta;
            if (newTopH >= 60 && newBotH >= 60) {
                top.style.flex = bot.style.flex = 'none';
                top.style.height = `${newTopH}px`; bot.style.height = `${newBotH}px`;
            }
        });
        document.addEventListener('mouseup', () => {
            if (!isResizing) return;
            isResizing = false; resizer.classList.remove('resizing'); document.body.classList.remove('resizing-editor');
        });
        resizer.addEventListener('keydown', e => {
            if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
            e.preventDefault();
            const step = e.shiftKey ? 20 : 5;
            const delta = e.key === 'ArrowDown' ? step : -step;
            const newTopH = top.offsetHeight + delta, newBotH = bot.offsetHeight - delta;
            if (newTopH >= 60 && newBotH >= 60) {
                top.style.flex = bot.style.flex = 'none';
                top.style.height = `${newTopH}px`; bot.style.height = `${newBotH}px`;
            }
        });
    });
}

window.deleteProject = deleteProject;
