/*global Inception*/

(function () {
    var helpers = typeof window === "undefined" ? Inception.Helpers : require("../helpers")
    ,   ruby = helpers.defineNS("Inception.Elements.Ruby", exports)
    ,   Range = helpers.load("Inception.DOM.Range")
    ;
    
    ruby.segmentAndCategoriseRubyElement = function (el) {
        // Let base text segments be an empty list of base text segments,
        //   each potentially with a list of base text subsegments.
        // Let annotation segments be an empty list of annotation segments,
        //   each potentially being associated with a base text segment or subsegment.
        var ret = {
                    baseTextSegments:   []
                ,   annotationSegments: []
            }
        ,   makeBaseTextSegment = function (range) {
                return {
                    range:          range
                ,   subsegments:    []
                };
            }
        ;

        // Let root be the ruby element for which the algorithm is being run.
        if (el.tagName.toLowerCase() !== "ruby") return;
        var root = el;
        
        // If root has a ruby element ancestor, then jump to the step labeled end.
        if (helpers.getAncestor(root, "ruby")) return ret;
        
        // Let current parent be root.
        // Let index be 0.
        // Let start index be null.
        // Let parent start index be null.
        // Let current base text be null.
        var currentParent = root
        ,   index = 0
        ,   startIndex = null
        ,   savedStartIndex = null // XXX this not in spec
        ,   parentStartIndex = null
        ,   currentBaseText = null
        ;
                
        // When the steps above say to push a ruby level, it means to run the following 
        // steps at that point in the algorithm:
        var pushRubyLevel = function () {
            // Let current parent be the indexth node in current parent.
            // Let index be 0.
            // Set saved start index to the value of start index.
            // Let start index be null.
            currentParent = currentParent.childNodes.item(index);
            index = 0;
            savedStartIndex = startIndex;
            startIndex = null;
        };
        
        // When the steps above say to set the current base text, it means to run the 
        // following steps at that point in the algorithm:
        var setCurrentBaseText = function () {
            // Let text range a DOM range whose start is the boundary point (current parent, 
            //   start index) and whose end is the boundary point (current parent, index).
            var textRange = new Range();
            textRange.setStart(currentParent, startIndex);
            textRange.setEnd(currentParent, index);

            // XXX the range below is "text range", not annotation range
            // Let new text segment be a base text segment described by the range annotation range.
            var newTextSegment = makeBaseTextSegment(textRange);
            
            // Add new text segment to base text segments.
            ret.baseTextSegments.push(newTextSegment);
            
            // Let current base text be new text segment.
            // Let start index be null.
            currentBaseText = newTextSegment;
            startIndex = null;
        };
        
        
        // Start mode: If index is equal to or greater than the number of child nodes 
        // in current parent, then jump to the step labeled end mode.
        var startMode = function () {
            if (index >= currentParent.childNodes.length) return endMode();
            // If the indexth node in current parent is an rt or rp element, 
            // jump to the step labeled annotation mode.
            var ni = currentParent.childNodes.item(index);
            if (helpers.isElementCalled(ni, "rt") || helpers.isElementCalled(ni, "rp")) return annotationMode();
            // Set start index to the value of index.
            startIndex = index;
            return baseMode();
        };
        
        // Base mode: If the indexth node in current parent is a ruby element,
        // and if current parent is the same element as root, then push a ruby
        // level and then jump to the step labeled start mode.
        var baseMode = function () {
            var ni = currentParent.childNodes.item(index);
            if (helpers.isElementCalled(ni, "ruby") && currentParent === root) {
                pushRubyLevel();
                return startMode();
            }
            // If the indexth node in current parent is an rt or rp element, then set 
            // the current base text and then jump to the step labeled annotation mode.
            if (helpers.isElementCalled(ni, "rt") || helpers.isElementCalled(ni, "rp")) {
                setCurrentBaseText();
                return annotationMode();
            }
            // Increment index by one.
            index++;
            return baseModePostIncrement();
        };


        // Base mode post-increment: If index is equal to or greater than the number of child nodes in current parent, then jump to the step labeled end mode.
        //
        // Jump back to the step labeled base mode.
        //
        // Annotation mode: If the indexth node in current parent is an rt element, then push a ruby annotation and jump to the step labeled annotation mode increment.
        //
        // If the indexth node in current parent is an rp element, jump to the step labeled annotation mode increment.
        //
        // If the indexth node in current parent is not a Text node, or is a Text node that is not inter-element whitespace, then jump to the step labeled base mode.
        //
        // Annotation mode increment: Let lookahead index be index plus one.
        //
        // Annotation mode white-space skipper: If lookahead index is equal to the number of child nodes in current parent then jump to the step labeled end mode.
        //
        // If the lookahead indexth node in current parent is an rt element or an rp element, then set index to lookahead index and jump to the step labeled annotation mode.
        //
        // If the lookahead indexth node in current parent is not a Text node, or is a Text node that is not inter-element whitespace, then jump to the step labeled base mode (without further incrementing index, so the inter-element whitespace seen so far becomes part of the next base text segment).
        //
        // Increment lookahead index by one.
        //
        // Jump to the step labeled annotation mode white-space skipper.
        //
        // End mode: If current parent is not the same element as root, then pop a ruby level and jump to the step labeled base mode post-increment.
        //
        // End: Return base text segments and annotation segments. Any content of the ruby element not described by segments in either of thost lists is implicitly in an ignored segment.
        

        return startMode();
    };
    
}());

