# 🏗️ Technical Architecture - LocalStorage System

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   HTML   │  │   CSS    │  │    JS    │  │  Preview │       │
│  │  Editor  │  │  Editor  │  │  Editor  │  │  iframe  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────▲─────┘       │
│       │             │             │             │               │
│       └─────────────┴─────────────┴─────────────┘               │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                             │
├─────────────────────────────────────────────────────────────────┤
│  • currentProject (object)                                      │
│  • projects (array)                                             │
│  • isModified (boolean)                                         │
│  • autoSaveTimer (timeout)                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOCALSTORAGE API                             │
├─────────────────────────────────────────────────────────────────┤
│  Key: "codepen_projects"                                        │
│  Value: JSON Array of Project Objects                          │
│                                                                 │
│  Key: "codepen_current_project"                                 │
│  Value: Current Project ID (string)                            │
│                                                                 │
│  Key: "liveloom_appearance"                                     │
│  Value: light | dark | eco | neon                               │
└─────────────────────────────────────────────────────────────────┘
```

## 🗄️ LocalStorage Structure

### Storage Keys
```javascript
STORAGE_KEY = 'codepen_projects'                // Existing projects array
CURRENT_PROJECT_KEY = 'codepen_current_project' // Last opened project ID
THEME_STORAGE_KEY = 'liveloom_appearance'       // Separate appearance preference
```

### Project Object Schema
```javascript
{
  id: "1234567890abc",              // Unique identifier
  name: "My Awesome Project",       // User-defined name
  html: "<h1>Hello</h1>",          // HTML code
  css: "h1 { color: blue; }",      // CSS code
  js: "console.log('Hi');",        // JavaScript code
  created: "2024-01-15T10:30:00Z", // ISO timestamp
  lastModified: "2024-01-15T14:45:00Z"  // ISO timestamp
}
```

### Storage Example
```javascript
// localStorage['codepen_projects']
[
  {
    id: "abc123",
    name: "Todo App",
    html: "...",
    css: "...",
    js: "...",
    created: "2024-01-15T10:00:00Z",
    lastModified: "2024-01-15T15:30:00Z"
  },
  {
    id: "def456",
    name: "Color Generator",
    html: "...",
    css: "...",
    js: "...",
    created: "2024-01-14T09:00:00Z",
    lastModified: "2024-01-14T11:20:00Z"
  }
]

// localStorage['codepen_current_project']
"abc123"
```

## 🔄 Operation Flow

### 1. Create New Project
```
User clicks "+ New"
    ↓
Check if current project has unsaved changes
    ↓
If modified → Show confirmation modal
    ↓
Clear all editors
    ↓
Set currentProject = null
    ↓
Update UI indicators
```

### 2. Save Project
```
User clicks "Save" or Ctrl+S
    ↓
Get project name from input (or use "Untitled Project")
    ↓
Create/Update project object with current code
    ↓
If existing project → Update in array
If new project → Add to beginning of array
    ↓
Save array to localStorage['codepen_projects']
    ↓
Save project ID to localStorage['codepen_current_project']
    ↓
Update UI (project list, indicators)
    ↓
Show success notification
```

### 3. Load Project
```
User clicks project in sidebar
    ↓
Check if current project has unsaved changes
    ↓
If modified → Show confirmation modal
    ↓
Load project data into editors
    ↓
Update currentProject reference
    ↓
Save project ID to localStorage['codepen_current_project']
    ↓
Update UI (active state, indicators)
    ↓
Close sidebar
```

### 4. Delete Project
```
User clicks "Delete" on project
    ↓
Show confirmation modal
    ↓
User confirms
    ↓
Filter project from array
    ↓
Save updated array to localStorage
    ↓
If deleted project was current → Clear editors
    ↓
Update project list UI
    ↓
Show deletion notification
```

### 5. Auto-Save
```
User types in any editor
    ↓
Set isModified = true
    ↓
Update file indicators (red dots)
    ↓
Clear existing autoSaveTimer
    ↓
Set new timer (3 seconds)
    ↓
Timer expires
    ↓
If project exists AND isModified → Save automatically
```

### 6. Export Project
```
User clicks "Export" or Ctrl+E
    ↓
Get current HTML, CSS, JS code
    ↓
Create complete HTML document with embedded CSS/JS
    ↓
Create Blob object
    ↓
Generate download URL
    ↓
Trigger download
    ↓
Clean up URL
    ↓
Show success notification
```

## 🔧 Key Functions

### Core Functions
```javascript
init()                    // Initialize app on load
loadProjects()           // Load all projects from localStorage
saveToLocalStorage()     // Save projects array to localStorage
loadLastProject()        // Load last opened project on startup
```

### Project Management
```javascript
createNewProject()       // Create new empty project
saveCurrentProject()     // Save current project to localStorage
loadProject(project)     // Load specific project
deleteProject(id, event) // Delete project by ID
clearAllProjects()       // Delete all projects
exportProject()          // Export as HTML file
```

### UI Updates
```javascript
renderProjectsList()     // Render all projects in sidebar
updateFileIndicators()   // Update save/modified indicators
updatePreview()          // Update iframe preview
```

### Utilities
```javascript
generateId()             // Generate unique project ID
autoSave()              // Auto-save current project
showModal()             // Show confirmation dialog
showNotification()      // Show toast notification
toggleSidebar()         // Open/close sidebar
```

## ⚡ Real-Time Synchronization

### Editor → Preview Flow
```
User types in HTML/CSS/JS editor
    ↓
'input' event triggered
    ↓
Set isModified = true
    ↓
Update file indicators
    ↓
Call updatePreview()
    ↓
Get current code from all editors
    ↓
Wrap CSS in <style> tag
    ↓
Wrap JS in <script> tag with error handling
    ↓
Get iframe document
    ↓
Write complete HTML to iframe
    ↓
Preview updates instantly
    ↓
Start auto-save timer (3 seconds)
```

### Preview Rendering
```javascript
// Actual code in updatePreview()
const html = htmlCode.value;
const css = `<style>${cssCode.value}</style>`;
const js = `<script>
    try {
        ${jsCode.value}
    } catch(e) {
        // Display error in preview
    }
</script>`;

previewDocument.open();
previewDocument.write(html + css + js);
previewDocument.close();
```

## 🏷️ HTML Editor Auto-Closing (`autoclose.js`)

A small, self-contained module that enhances the HTML editor only. It attaches a
`keydown` listener to `htmlCode` from `setupEventListeners()` in `script.js` and
never touches the CSS or JavaScript editors.

### Keystroke Flow
```
User types ">" in the HTML editor
    ↓
Read the unfinalised tag before the caret ("<div class=\"box\"")
    ↓
Is it a real opening tag?         (no → let the browser insert ">")
Is it a void element?             (<br>, <img>… → let the browser insert ">")
Self-closing syntax?              ("<br/" → let the browser insert ">")
Caret inside an attribute value?  (odd number of quotes → let the browser insert ">")
Is the tag's ">" already ahead?   (yes → preventDefault, move the caret past it)
    ↓
preventDefault()
    ↓
Insert ">" + "</div>" via the native insertText command
    ↓
Place the caret between the two tags
    ↓
The browser fires "input" → script.js marks the file modified and refreshes the preview
```

### Why `insertText`
The native `document.execCommand('insertText', …)` command is used instead of
assigning to `textarea.value` because it keeps the browser's undo history intact
and raises a real `input` event, so auto-save, the modified indicator, and the live
preview all keep working without extra wiring. A `setRangeText` fallback (which
dispatches `input` manually) covers browsers that refuse the command.

### Deliberate Non-Goals
- Never auto-closes void elements, comments, doctypes, or `</closing>` tags
- Never rewrites text when an attribute string is still open
- Never interferes with the CSS and JavaScript editors
- Never duplicates a closing tag or a `>` that is already present

## 🛡️ Safety Features

### 1. Unsaved Changes Protection
- Tracks modifications with `isModified` flag
- Shows confirmation before:
  - Creating new project
  - Loading different project
  - Closing browser (browser default)

### 2. Auto-Save System
- Debounced save (3 seconds after last edit)
- Only saves existing projects
- Prevents data loss from accidental closure

### 3. Confirmation Dialogs
- Delete project confirmation
- Clear all projects confirmation
- Unsaved changes warnings

### 4. Error Handling
- JavaScript errors caught in preview
- Displayed as error messages in iframe
- Doesn't crash the editor

## 📈 Performance Considerations

### Optimization Techniques
1. **Debounced Auto-Save**: Prevents excessive localStorage writes
2. **Efficient Preview Updates**: Direct iframe document manipulation
3. **Minimal DOM Updates**: Only update what changed
4. **Event Delegation**: Efficient event handling for project list

### LocalStorage Limits
- **Size**: ~5-10MB per domain (browser-dependent)
- **Storage**: Synchronous API (blocks main thread)
- **Persistence**: Survives browser restarts
- **Scope**: Per origin (protocol + domain + port)

### Best Practices Implemented
✅ JSON serialization for complex objects
✅ Error handling for localStorage operations
✅ Unique IDs for each project
✅ Timestamp tracking for sorting
✅ Efficient array operations

## 🔐 Data Persistence

### What Gets Saved
✅ All project code (HTML, CSS, JS)
✅ Project names
✅ Creation timestamps
✅ Last modified timestamps
✅ Current project ID

### What Doesn't Get Saved
❌ UI state (sidebar open/closed)
❌ Cursor positions in editors
❌ Undo/redo history
❌ Preview scroll position

## 🚀 Scalability

### Current Capacity
- **Projects**: Unlimited (within localStorage limit)
- **Code Size**: ~5-10MB total across all projects
- **Performance**: Instant for <100 projects

### Future Enhancements
- IndexedDB for larger storage
- Compression for code storage
- Cloud sync capabilities
- Version control system
- Collaborative editing

## 📊 State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION STATE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  currentProject: {                                          │
│    id: "abc123",                                            │
│    name: "My Project",                                      │
│    html: "...",                                             │
│    css: "...",                                              │
│    js: "...",                                               │
│    created: "...",                                          │
│    lastModified: "..."                                      │
│  }                                                          │
│                                                             │
│  projects: [                                                │
│    { id: "abc123", ... },                                   │
│    { id: "def456", ... },                                   │
│    { id: "ghi789", ... }                                    │
│  ]                                                          │
│                                                             │
│  isModified: true/false                                     │
│  autoSaveTimer: timeoutId                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    ┌────────┐          ┌────────┐          ┌────────┐
    │  UI    │          │ Local  │          │Preview │
    │ Update │          │Storage │          │ Render │
    └────────┘          └────────┘          └────────┘
```

## 🎯 Summary

LiveLoom uses a LocalStorage-based architecture that:
- ✅ Persists all projects across browser sessions
- ✅ Provides real-time preview updates
- ✅ Implements auto-save for data protection
- ✅ Handles multiple projects efficiently
- ✅ Offers export functionality for backups
- ✅ Maintains clean separation of concerns
- ✅ Scales well for typical use cases

The system is designed to be simple, reliable, and performant for local web development and experimentation!
