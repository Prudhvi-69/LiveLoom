/**
 * HTML auto-closing tag support for the HTML editor.
 *
 * Typing `>` at the end of an unfinished opening tag inserts the matching
 * closing tag and leaves the caret between the two:
 *
 *     <div class="box"   +   >   ->   <div class="box">|</div>
 *
 * The handler is deliberately conservative: whenever the tag cannot be parsed
 * with certainty it lets the keystroke through untouched, so the editor never
 * rewrites something the author meant literally. Auto-closing is skipped for
 * void elements, self-closing syntax (`<br/>`), tags that already carry their
 * closing tag, and carets that sit inside an attribute string.
 */

'use strict';

const VOID_ELEMENTS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

const UNFINISHED_TAG = /^<([a-zA-Z][a-zA-Z0-9-]*)([^<>]*)$/;

function parseUnfinishedTag(textBeforeCaret) {
    const tagStart = textBeforeCaret.lastIndexOf('<');
    if (tagStart === -1) return null;
    const match = UNFINISHED_TAG.exec(textBeforeCaret.slice(tagStart));
    return match ? { name: match[1], rest: match[2] } : null;
}

function isInsideAttributeString(rest) {
    const doubleQuotes = (rest.match(/"/g) || []).length;
    const singleQuotes = (rest.match(/'/g) || []).length;
    return (doubleQuotes + singleQuotes) % 2 !== 0;
}

function isSelfClosing(rest) {
    return rest.trimEnd().endsWith('/');
}

function findTagEndOffset(textAfterCaret, tagName) {
    const finishedTag = new RegExp('^\\s*>\\s*</' + tagName + '\\s*>', 'i');
    const match = finishedTag.exec(textAfterCaret);
    return match ? match[0].indexOf('>') + 1 : -1;
}

function insertTextAtCaret(editor, text) {
    let inserted = false;
    try { inserted = document.execCommand('insertText', false, text); } catch {}
    if (inserted) return;
    const caret = editor.selectionStart;
    editor.setRangeText(text, caret, editor.selectionEnd, 'end');
    editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function handleKeydown(event) {
    if (event.key !== '>' || event.ctrlKey || event.metaKey || event.altKey) return;
    const editor = event.currentTarget;
    if (editor.selectionStart !== editor.selectionEnd) return;
    const caret = editor.selectionStart;
    const tag = parseUnfinishedTag(editor.value.slice(0, caret));
    if (!tag) return;
    const tagEndOffset = findTagEndOffset(editor.value.slice(caret), tag.name);
    if (tagEndOffset !== -1) {
        event.preventDefault();
        editor.selectionStart = editor.selectionEnd = caret + tagEndOffset;
        return;
    }
    if (VOID_ELEMENTS.has(tag.name.toLowerCase()) || isSelfClosing(tag.rest) || isInsideAttributeString(tag.rest)) return;
    event.preventDefault();
    insertTextAtCaret(editor, '>' + '</' + tag.name + '>');
    editor.selectionStart = editor.selectionEnd = caret + 1;
}

export function setupHtmlAutoClose(editor) {
    editor.addEventListener('keydown', handleKeydown);
}
