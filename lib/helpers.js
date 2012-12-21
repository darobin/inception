

(function () {
    var inBrowser = typeof window == "undefined"
    ,   defineNS = function (ns, exp) {
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
            return exp;
        }
    ,   helpers = defineNS("Inception.Helpers", exports)
    ;
    helpers.defineNS = defineNS;
}());


