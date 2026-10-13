/**
 * Temporary verification harness for autoclose.js.
 *
 * Drives the real module through a stubbed DOM so the tag auto-close rules can
 * be checked deterministically for both insertion paths (the native
 * `insertText` command and the `setRangeText` fallback). Not part of the app.
 *
 * A `|` inside the expected string marks where the caret must end up.
 *
 * Run with: node autoclose.check.js
 */

const MODULE_PATH = require.resolve('./autoclose.js');

const VARIANTS = [
    { label: 'native insertText', nativeInsert: true },
    { label: 'setRangeText fallback', nativeInsert: false }
];

const failures = [];

function createEditor(value, caret) {
    return {
        value,
        selectionStart: caret,
        selectionEnd: caret,
        keydownHandlers: [],
        dispatchedEvents: [],
        addEventListener(type, handler) {
            if (type === 'keydown') {
                this.keydownHandlers.push(handler);
            }
        },
        dispatchEvent(event) {
            this.dispatchedEvents.push(event);
        },
        setRangeText(text, start, end) {
            this.value = this.value.slice(0, start) + text + this.value.slice(end);
            this.selectionStart = this.selectionEnd = start + text.length;
        }
    };
}

function loadAutoClose(nativeInsert) {
    delete require.cache[MODULE_PATH];

    let activeEditor = null;

    global.window = {};
    global.Event = function Event(type, init) {
        this.type = type;
        this.bubbles = Boolean(init && init.bubbles);
    };
    global.document = {
        execCommand(command, ui, text) {
            if (!nativeInsert || command !== 'insertText') {
                throw new Error('insertText is not supported');
            }
            activeEditor.setRangeText(text, activeEditor.selectionStart, activeEditor.selectionEnd, 'end');
            return true;
        }
    };

    require(MODULE_PATH);

    return function attach(editor) {
        activeEditor = editor;
        global.window.setupHtmlAutoClose(editor);
    };
}

function pressKey(editor, key, modifiers) {
    const event = {
        key,
        ctrlKey: Boolean(modifiers && modifiers.ctrlKey),
        metaKey: Boolean(modifiers && modifiers.metaKey),
        altKey: Boolean(modifiers && modifiers.altKey),
        currentTarget: editor,
        defaultPrevented: false,
        preventDefault() {
            this.defaultPrevented = true;
        }
    };

    editor.keydownHandlers.forEach(handler => handler(event));

    if (!event.defaultPrevented) {
        editor.setRangeText(key, editor.selectionStart, editor.selectionEnd, 'end');
    }
}

function typeText(editor, text) {
    for (const char of text.split('')) {
        pressKey(editor, char);
    }
}

/** Splits `'<div>|</div>'` into the text and the caret index. */
function splitCaret(marked) {
    const caret = marked.indexOf('|');
    return { text: marked.replace('|', ''), caret: caret === -1 ? marked.length : caret };
}

function expect(label, actual, expected) {
    if (actual === expected) {
        console.log(`  ok    ${label}`);
        return;
    }
    failures.push(`${label}\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`);
    console.log(`  FAIL  ${label}`);
}

function buildEditor(startMarked, startRange) {
    const start = splitCaret(startMarked === undefined ? '' : startMarked);
    const editor = createEditor(start.text, start.caret);
    if (startRange) {
        editor.selectionStart = startRange[0];
        editor.selectionEnd = startRange[1];
    }
    return editor;
}

/** Types `keys` into a fresh editor and compares value plus caret. */
function typeCase(variant, { label, keys, marked, startMarked, startRange }) {
    const attach = loadAutoClose(variant.nativeInsert);
    const editor = buildEditor(startMarked, startRange);
    attach(editor);

    typeText(editor, keys);

    const expected = splitCaret(marked);
    expect(`${label} -> value`, editor.value, expected.text);
    expect(`${label} -> caret`, editor.selectionStart, expected.caret);

    return editor;
}

const TYPE_CASES = [
    {
        label: 'closes a bare opening tag',
        keys: '<div>',
        marked: '<div>|</div>'
    },
    {
        label: 'closes a tag with attributes',
        keys: '<div class="box">',
        marked: '<div class="box">|</div>'
    },
    {
        label: 'closes an attribute written with single quotes',
        keys: "<div class='box'>",
        marked: "<div class='box'>|</div>",
        startMarked: ''
    },
    {
        label: 'leaves void elements alone',
        keys: '<br>',
        marked: '<br>|'
    },
    {
        label: 'leaves void elements with attributes alone',
        keys: '<img src="a.png">',
        marked: '<img src="a.png">|'
    },
    {
        label: 'leaves self-closing syntax alone',
        keys: '<br/>',
        marked: '<br/>|'
    },
    {
        label: 'leaves closing tags alone',
        keys: '</p>',
        marked: '</p>|'
    },
    {
        label: 'leaves comments alone',
        keys: '<!-- note -->',
        marked: '<!-- note -->|'
    },
    {
        label: 'leaves doctypes alone',
        keys: '<!DOCTYPE html>',
        marked: '<!DOCTYPE html>|'
    },
    {
        label: 'nests inside an auto-closed element',
        keys: '<div class="box"><p>',
        marked: '<div class="box"><p>|</p></div>'
    },
    {
        label: 'nests several levels deep',
        keys: '<ul><li><a href="#">',
        marked: '<ul><li><a href="#">|</a></li></ul>'
    },
    {
        label: 'keeps the case the author typed',
        keys: '<SECTION>',
        marked: '<SECTION>|</SECTION>'
    },
    {
        label: 'keeps a custom element name intact',
        keys: '<my-widget data-id="7">',
        marked: '<my-widget data-id="7">|</my-widget>'
    },
    {
        label: 'ignores a caret inside an attribute string',
        keys: '<a title="unfinished>',
        marked: '<a title="unfinished>|'
    },
    {
        label: 'ignores a less-than that is not a tag',
        keys: 'total < 3 and <span>',
        marked: 'total < 3 and <span>|</span>'
    },
    {
        label: 'closes a tag after a comment',
        keys: '<!-- hi --><p>',
        marked: '<!-- hi --><p>|</p>'
    },
    {
        label: 'closes a tag written with a trailing space',
        keys: '<div class="box" >',
        marked: '<div class="box" >|</div>'
    },
    {
        label: 'closes a tag on a fresh line of an existing document',
        keys: '<p>',
        startMarked: '<div>\n  |\n</div>',
        marked: '<div>\n  <p>|</p>\n</div>'
    },
    {
        label: 'adds an attribute to an existing tag then steps over its end',
        keys: ' class="new">',
        startMarked: '<div|></div>',
        marked: '<div class="new">|</div>'
    },
    {
        label: 'adds an attribute after existing text stays untouched',
        keys: ' id="a">',
        startMarked: '<span|></span>',
        marked: '<span id="a">|</span>'
    }
];

const KEY_CASES = [
    {
        label: 'steps over the end of an existing tag',
        key: '>',
        startMarked: '<div class="old"|></div>',
        marked: '<div class="old">|</div>'
    },
    {
        label: 'steps over an existing tag end typed straight after the name',
        key: '>',
        startMarked: '<div|></div>',
        marked: '<div>|</div>'
    },
    {
        label: 'steps over an existing tag end with whitespace',
        key: '>',
        startMarked: '<div class="old"|></div >',
        marked: '<div class="old">|</div >'
    },
    {
        label: 'leaves Ctrl+> to the browser',
        key: '>',
        modifiers: { ctrlKey: true },
        startMarked: '<div|',
        marked: '<div>|'
    },
    {
        label: 'leaves a selection for the browser to replace',
        key: '>',
        startMarked: '<div class="a">box</div>',
        startRange: [15, 18],
        marked: '<div class="a">>|</div>'
    }
];

function runVariant(variant) {
    console.log(`\n=== ${variant.label} ===`);
    TYPE_CASES.forEach(testCase => typeCase(variant, testCase));
    KEY_CASES.forEach(testCase => keyCase(variant, testCase));
}

function keyCase(variant, { label, key, modifiers, startMarked, startRange, marked }) {
    const attach = loadAutoClose(variant.nativeInsert);
    const editor = buildEditor(startMarked, startRange);
    attach(editor);

    pressKey(editor, key, modifiers);

    const expected = splitCaret(marked);
    expect(`${label} -> value`, editor.value, expected.text);
    expect(`${label} -> caret`, editor.selectionStart, expected.caret);

    return editor;
}

function runDocumentFlow(variant) {
    console.log(`\n=== ${variant.label}: authoring a whole document ===`);
    const attach = loadAutoClose(variant.nativeInsert);
    const editor = createEditor('', 0);
    attach(editor);

    typeText(editor, '<section class="hero">');
    typeText(editor, '\n  ');
    typeText(editor, '<h1>');
    typeText(editor, 'Hello');
    editor.selectionStart = editor.selectionEnd = editor.value.indexOf('</section>');
    typeText(editor, '\n');

    const expected = splitCaret('<section class="hero">\n  <h1>Hello</h1>\n|</section>');
    expect('document -> value', editor.value, expected.text);
    expect('document -> caret', editor.selectionStart, expected.caret);
}

function runInputEventContract(variant) {
    console.log(`\n=== ${variant.label}: input event contract ===`);
    const attach = loadAutoClose(variant.nativeInsert);
    const editor = createEditor('', 0);
    attach(editor);

    typeText(editor, '<div>');

    const inputEvents = editor.dispatchedEvents.filter(event => event.type === 'input');
    const expected = variant.nativeInsert ? 0 : 1;
    expect('auto-close fires exactly one input event', inputEvents.length, expected);
}

VARIANTS.forEach(variant => {
    runVariant(variant);
    runDocumentFlow(variant);
    runInputEventContract(variant);
});

console.log(`\n${failures.length === 0 ? 'ALL CHECKS PASSED' : `${failures.length} CHECK(S) FAILED`}`);
failures.forEach(failure => console.log(`\n- ${failure}`));
process.exit(failures.length === 0 ? 0 : 1);
