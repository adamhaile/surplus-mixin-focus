/**
 * In surplus, directives run when a node is created, meaning before it has usually
 * been inserted into the document.  This causes a problem for the @focus directive, as only
 * elements that are in the document (and visible) are focusable.  As a hack, we delay
 * the focus event until the next animation frame, thereby giving htmlliterals a chance
 * to get the node into the document.  If it isn't in by then (or if the user tried to focus
 * a hidden node) then we give up.
 */
var nodeToFocus = null as HTMLElement | null,
    startPos = NaN,
    endPos = NaN,
    scheduled = false;

export default function focus(flag : boolean, start? : number, end? : number) {
    var _start = arguments.length > 1 ? start! : NaN,
        _end = arguments.length > 2 ? end! : _start,
        length : number;
    
    return function focus(node : HTMLElement) {
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
        } else {
            node.blur();
        }
    };
};

function focuser() {
    scheduled = false;

    if (nodeToFocus === null) return;
    
    var trange : CreateTextRangeRange,
        range : Range, 
        sel : Selection;
    
    nodeToFocus.focus();
    
    if (!isNaN(startPos)) {
        if (hasSetSelectionRange(nodeToFocus)) {
            nodeToFocus.setSelectionRange(startPos, endPos);
        } else if (hasCreateTextRnage(nodeToFocus)) {
            trange = nodeToFocus.createTextRange();
            trange.moveEnd('character', endPos);
            trange.moveStart('character', startPos);
            trange.select();
        } else if (nodeToFocus.isContentEditable && nodeToFocus.childNodes.length > 0) {
            range = document.createRange();
            range.setStart(nodeToFocus.childNodes[0], startPos);
            range.setEnd(nodeToFocus.childNodes[0], endPos);
            sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}

// input & textArea
interface NodeWithSetSelectionRange extends Node {
    setSelectionRange(start : number, end : number) : void
}

function hasSetSelectionRange(node : Node) : node is NodeWithSetSelectionRange {
    return !!(node as any).setSelectionRange;
}

// Used by IE
interface NodeWithCreateTextRange extends Node {
    createTextRange() : CreateTextRangeRange;
}

interface CreateTextRangeRange {
    moveEnd(type: 'character', end : number) : void;
    moveStart(type : 'character', start : number) : void;
    select() : void;
}

function hasCreateTextRnage(node : Node) : node is NodeWithCreateTextRange {
    return !!(node as any).createTextRange;
}