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

(function () {
    'use strict';

    /** Tags that never take a closing tag. */
    const VOID_ELEMENTS = new Set([
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr'
    ]);

    /** Matches `<name` plus whatever was typed after it on the same tag. */
    const UNFINISHED_TAG = /^<([a-zA-Z][a-zA-Z0-9-]*)([^<>]*)$/;

    const TRIGGER_KEY = '>';

    /**
     * Reads the opening tag the caret is currently sitting inside.
     *
     * @param {string} textBeforeCaret everything in the editor before the caret
     * @returns {{name: string, rest: string} | null} the unfinished tag, if any
     */
    function parseUnfinishedTag(textBeforeCaret) {
        const tagStart = textBeforeCaret.lastIndexOf('<');
        if (tagStart === -1) {
            return null;
        }

        const match = UNFINISHED_TAG.exec(textBeforeCaret.slice(tagStart));
        if (!match) {
            return null;
        }

        return { name: match[1], rest: match[2] };
    }

    /**
     * An odd number of quotes means the caret is inside an attribute value, so
     * the text only looks like a tag and must not be auto-closed.
     *
     * @param {string} rest text typed after the tag name
     * @returns {boolean} true when auto-closing is unsafe
     */
    function isInsideAttributeString(rest) {
        const doubleQuotes = (rest.match(/"/g) || []).length;
        const singleQuotes = (rest.match(/'/g) || []).length;
        return (doubleQuotes + singleQuotes) % 2 !== 0;
    }

    /**
     * @param {string} rest text typed after the tag name
     * @returns {boolean} true for `<br/` style self-closing syntax
     */
    function isSelfClosing(rest) {
        return rest.trimEnd().endsWith('/');
    }

    /**
     * Locates the `>` that finishes the tag opened before the caret, e.g. the
     * one in `<div class="box"|></div>`. When it is there the keystroke is
     * consumed and the caret simply steps over it, so editing an existing tag
     * leaves behind neither a stray `>` nor a duplicated closing tag.
     *
     * A bare `</div>` straight after the caret is deliberately *not* this case:
     * it means a new element is being nested inside an auto-closed one and
     * still needs a closing tag of its own.
     *
     * @param {string} textAfterCaret everything in the editor after the caret
     * @param {string} tagName tag name as the author typed it
     * @returns {number} caret offset measured from the current caret, or -1
     *                   when the tag is not already finished ahead of it
     */
    function findTagEndOffset(textAfterCaret, tagName) {
        const finishedTag = new RegExp('^\\s*>\\s*</' + tagName + '\\s*>', 'i');
        const match = finishedTag.exec(textAfterCaret);
        return match ? match[0].indexOf('>') + 1 : -1;
    }

    /**
     * Inserts text at the caret. The native `insertText` command is preferred
     * because it keeps the browser undo history intact and fires an `input`
     * event on its own; `setRangeText` is the fallback for browsers that
     * refuse the command.
     *
     * @param {HTMLTextAreaElement} editor the editor element
     * @param {string} text text to insert at the caret
     */
    function insertTextAtCaret(editor, text) {
        let inserted = false;
        try {
            inserted = document.execCommand('insertText', false, text);
        } catch (error) {
            inserted = false;
        }

        if (inserted) {
            return;
        }

        const caret = editor.selectionStart;
        editor.setRangeText(text, caret, editor.selectionEnd, 'end');
        editor.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * @param {KeyboardEvent} event keydown event on the HTML editor
     */
    function handleKeydown(event) {
        if (event.key !== TRIGGER_KEY || event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }

        const editor = event.currentTarget;
        if (editor.selectionStart !== editor.selectionEnd) {
            return;
        }

        const caret = editor.selectionStart;
        const tag = parseUnfinishedTag(editor.value.slice(0, caret));
        if (!tag) {
            return;
        }

        const tagEndOffset = findTagEndOffset(editor.value.slice(caret), tag.name);
        if (tagEndOffset !== -1) {
            event.preventDefault();
            editor.selectionStart = editor.selectionEnd = caret + tagEndOffset;
            return;
        }

        if (
            VOID_ELEMENTS.has(tag.name.toLowerCase()) ||
            isSelfClosing(tag.rest) ||
            isInsideAttributeString(tag.rest)
        ) {
            return;
        }

        event.preventDefault();
        insertTextAtCaret(editor, TRIGGER_KEY + '</' + tag.name + '>');
        editor.selectionStart = editor.selectionEnd = caret + 1;
    }

    /**
     * Enables auto-closing tags on an editor.
     *
     * @param {HTMLTextAreaElement} editor the editor element to enhance
     */
    function setupHtmlAutoClose(editor) {
        editor.addEventListener('keydown', handleKeydown);
    }

    window.setupHtmlAutoClose = setupHtmlAutoClose;
    export { setupHtmlAutoClose };
})();
