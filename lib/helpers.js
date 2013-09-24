

(function () {
    var inBrowser = typeof window !== "undefined"
    ,   defineNS = function (ns) {
            if (inBrowser) {
                var prevPart = window
                ,   parts = ns.split(".")
                ;
                while (parts.length) {
                    var part = parts.shift();
                    if (!prevPart[part]) prevPart[part] = {};
                    prevPart = prevPart[part];
                }
                return prevPart;
            }
            return false;
        }
    ,   helpers = defineNS("Inception.Helpers")
    ;
    
    // expose runtime
    helpers.inBrowser = inBrowser;
    
    // define a namespace
    helpers.defineNS = defineNS;
    
    // load a class
    helpers.load = function (ns) {
        if (inBrowser) {
            var prevPart = window
            ,   parts = ns.split(".")
            ;
            while (parts.length) prevPart = prevPart[parts.shift()];
            return prevPart;
        }
        else {
            return require("./" + ns.toLowerCase().replace("Inception.", "").replace(/\./g, "/"));
        }
    };
    
    // constants you wouldn't have in Node
    helpers.ELEMENT_NODE = 1;
    helpers.TEXT_NODE = 3;
    
    // check that has an ancestor
    helpers.getAncestor = function (el, name) {
        while (el.parentNode && el.parentNode.nodeType === helpers.ELEMENT_NODE) {
            if (helpers.isElementCalled(el.parentNode.tagName, name)) return el.parentNode;
            el = el.parentNode;
        }
        return;
    };
    
    // check that a node is an element of a given name
    helpers.isElementCalled = function (el, name) {
        return el.nodeType === helpers.ELEMENT_NODE && el.tagName.toLowerCase() === name;
    };
    
    // XXX are these just Text nodes? I wonder if I can make a CDATASectionNode, insert it into
    //     the tree, and see if things work or break here and there
    // Empty Text nodes and Text nodes consisting of just sequences of those characters are
    // considered inter-element whitespace.
    helpers.isInterElementWhitespace = function (node) {
        if (node.nodeType !== helpers.TEXT_NODE) return false;
        if (node.data.length === 0) return true;
        return helpers.isOnlySpaceCharacters(node.data);
    };
    
    // XXX we probably want to build this into an infrastructure module
    // The space characters, for the purposes of this specification, are U+0020 SPACE, "tab" (U+0009),
    // "LF" (U+000A), "FF" (U+000C), and "CR" (U+000D).
    helpers.isOnlySpaceCharacters = function (text) {
        return (/^[\x20\x09\x0a\x0c\x0d]+$/).test(text);
    };
    
    // finds the index of a node in its parent
    helpers.indexOfNodeInParent = function (node, parent) {
        for (var i = 0, n = parent.childNodes.length; i < n; i++) {
            if (parent.childNodes.item(i) === node) return i;
        }
        return null;
    };
}());
