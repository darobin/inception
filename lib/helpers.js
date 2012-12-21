

(function () {
    var inBrowser = typeof window == "undefined"
    ,   defineNS = function (ns, exp, dfn) {
            if (inBrowser) {
                var prevPart = window
                ,   parts = ns.split(".")
                ;
                while (parts.length) {
                    var part = parts.shift();
                    if (!prevPart[part]) prevPart[part] = (parts.length === 0 && typeof dfn !== "undefined") ? dfn : {};
                    prevPart = prevPart[part];
                }
                return prevPart;
            }
            return exp;
        }
    ,   helpers = defineNS("Inception.Helpers", exports)
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
}());


