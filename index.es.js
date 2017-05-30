/**
 * In surplus, directives run when a node is created, meaning before it has usually
 * been inserted into the document.  This causes a problem for the @focus directive, as only
 * elements that are in the document (and visible) are focusable.  As a hack, we delay
 * the focus event until the next animation frame, thereby giving htmlliterals a chance
 * to get the node into the document.  If it isn't in by then (or if the user tried to focus
 * a hidden node) then we give up.
 */
var nodeToFocus = null, startPos = NaN, endPos = NaN, scheduled = false;
export default function focus(flag, start, end) {
    var _start = arguments.length > 1 ? start : NaN, _end = arguments.length > 2 ? end : _start, length;
    return function focus(node) {
        if (!node.focus) {
            throw new Error("@focus can only be applied to an element that has a .focus() method, like <input>, <select>, <textarea>, etc.");
        }
        if (flag) {
            length = node.textContent ? node.textContent.length : 0;
            nodeToFocus = node;
            startPos = _start < 0 ? Math.max(0, length + _start) : Math.min(length, _start);
            endPos = _end < 0 ? Math.max(startPos, length + _end) : Math.min(length, _end);
            if (!scheduled) {
                scheduled = true;
                window.requestAnimationFrame(focuser);
            }
        }
        else {
            node.blur();
        }
    };
}
;
function focuser() {
    scheduled = false;
    if (nodeToFocus === null)
        return;
    var trange, range, sel;
    nodeToFocus.focus();
    if (!isNaN(startPos)) {
        if (hasSetSelectionRange(nodeToFocus)) {
            nodeToFocus.setSelectionRange(startPos, endPos);
        }
        else if (hasCreateTextRnage(nodeToFocus)) {
            trange = nodeToFocus.createTextRange();
            trange.moveEnd('character', endPos);
            trange.moveStart('character', startPos);
            trange.select();
        }
        else if (nodeToFocus.isContentEditable && nodeToFocus.childNodes.length > 0) {
            range = document.createRange();
            range.setStart(nodeToFocus.childNodes[0], startPos);
            range.setEnd(nodeToFocus.childNodes[0], endPos);
            sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}
function hasSetSelectionRange(node) {
    return !!node.setSelectionRange;
}
function hasCreateTextRnage(node) {
    return !!node.createTextRange;
}
