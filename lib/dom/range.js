
// WARNING
//  By and large this has been implemented as support for other parts of the system,
//  it has not been implemented by slavishly following the specification [TODO].
//  Also note that when running in a browser it uses the browser's implementation

(function () {
    var helpers = typeof window === "undefined" ? Inception.Helpers : require("../helpers")
    ,   range = helpers.defineNS("Inception.DOM.Range", exports);
    ;
    if (helpers.inBrowser) {
        range.makeRange = function (doc) {
            return (doc || document).createRange();
        };
    }
    else {
        function Range (doc) {
            this._doc = doc;
            this.startContainer = null;
            this.startOffset = 0;
            this.endContainer = null;
            this.endOffset = 0;
        }
        Range.prototype = {
            setStart:   function (node, offset) {
                this.startContainer = node;
                this.startOffset = offset;
            }
        ,   setEnd:   function (node, offset) {
                this.endContainer = node;
                this.endOffset = offset;
            }
        };
        range.makeRange = function (doc) {
            return new Range(doc);
        };
    }
}());


// interface Range {
//   readonly attribute Node startContainer;
//   readonly attribute unsigned long startOffset;
//   readonly attribute Node endContainer;
//   readonly attribute unsigned long endOffset;
//   readonly attribute boolean collapsed;
//   readonly attribute Node commonAncestorContainer;
// 
//   void setStart(Node refNode, unsigned long offset);
//   void setEnd(Node refNode, unsigned long offset);
//   void setStartBefore(Node refNode);
//   void setStartAfter(Node refNode);
//   void setEndBefore(Node refNode);
//   void setEndAfter(Node refNode);
//   void collapse(boolean toStart);
//   void selectNode(Node refNode);
//   void selectNodeContents(Node refNode);
// 
//   const unsigned short START_TO_START = 0;
//   const unsigned short START_TO_END = 1;
//   const unsigned short END_TO_END = 2;
//   const unsigned short END_TO_START = 3;
//   short compareBoundaryPoints(unsigned short how, Range sourceRange);
// 
//   void deleteContents();
//   DocumentFragment extractContents();
//   DocumentFragment cloneContents();
//   void insertNode(Node node);
//   void surroundContents(Node newParent);
// 
//   Range cloneRange();
//   void detach();
// 
//   boolean isPointInRange(Node node, unsigned long offset);
//   short comparePoint(Node node, unsigned long offset);
// 
//   boolean intersectsNode(Node node);
// 
//   stringifier;
// };