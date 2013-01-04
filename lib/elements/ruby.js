/*jshint boss:true */
/*global Inception*/

(function () {
    var helpers = typeof window !== "undefined" ? Inception.Helpers : require("../helpers")
    ,   ruby = helpers.defineNS("Inception.Elements.Ruby") || exports
    ,   range = helpers.load("Inception.DOM.Range")
    ;
    

    // WARNING
    //  This is the algorithm as defined in the spec as per 2013-01-03 (W3C and WHATWG)
    //  Do NOT use this. It will go into an infinite loop even on the most trivial content.
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
        ,   makeAnnotationSegment = function (range) {
                return {
                    range:              range
                ,   baseTextSegment:    null
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
        // ,   parentStartIndex = null // XXX this is in spec but never used
        ,   currentBaseText = null
        ,   lookAheadIndex = null // XXX this is not in spec
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

        // When the steps above say to pop a ruby level, it means to run the following steps at
        // that point in the algorithm:
        var popRubyLevel = function () {
            // Let index be the position of current parent in root.
            index = 0;
            while (currentParent = currentParent.previousSibling) index++;
            // Let current parent be root.
            currentParent = root;
            // Increment index by one.
            index++;
            // Set start index to the value of saved start index.
            startIndex = savedStartIndex;
            // Let saved start index be null.
            savedStartIndex = null;
        };
        
        // When the steps above say to set the current base text, it means to run the
        // following steps at that point in the algorithm:
        var setCurrentBaseText = function () {
            // Let text range a DOM range whose start is the boundary point (current parent,
            //   start index) and whose end is the boundary point (current parent, index).
            var textRange = range.makeRange();
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
        
        // When the steps above say to push a ruby annotation, it means to run the following
        // steps at that point in the algorithm:
        var pushRubyAnnotation = function () {
            // Let rt be the rt element that is the indexth node of current parent.
            // XXX the spec is missing a "be" there
            // Let annotation range a DOM range whose start is the boundary point (current parent,
            //   index) and whose end is the boundary point (current parent, index plus one) (i.e. that
            //   contains only rt).
            // var rt = currentParent.childNodes.item(index); // XXX this is in spec but never used
            var annotationRange = range.makeRange();
            annotationRange.setStart(currentParent, index);
            annotationRange.setEnd(currentParent, index + 1);
            // Let new annotation segment be an annotation segment described by the range annotation range.
            var newAnnotationSegment = makeAnnotationSegment(annotationRange);
            // If current base text is not null, associate new annotation segment with current base text.
            if (currentBaseText !== null) newAnnotationSegment.baseTextSegment = currentBaseText;
            // Add new annotation segment to annotation segments.
            ret.annotationSegments.push(newAnnotationSegment);
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

        // Base mode post-increment: If index is equal to or greater than the number of child
        // nodes in current parent, then jump to the step labeled end mode.
        var baseModePostIncrement = function () {
            if (index >= currentParent.childNodes.length) return endMode();
            // Jump back to the step labeled base mode.
            return baseMode();
        };

        // Annotation mode: If the indexth node in current parent is an rt element, then push a ruby
        // annotation and jump to the step labeled annotation mode increment.
        var annotationMode = function () {
            var ni = currentParent.childNodes.item(index);
            if (helpers.isElementCalled(ni, "rt")) {
                pushRubyAnnotation();
                return annotationModeIncrement();
            }
            // If the indexth node in current parent is an rp element, jump to the step
            // labeled annotation mode increment.
            if (helpers.isElementCalled(ni, "rp")) return annotationModeIncrement();
            // If the indexth node in current parent is not a Text node, or is a Text node that
            // is not inter-element whitespace, then jump to the step labeled base mode.
            if (ni.nodeType !== helpers.TEXT_NODE || !helpers.isInterElementWhitespace(ni)) return baseMode();
        };

        // Annotation mode increment: Let lookahead index be index plus one.
        var annotationModeIncrement = function () {
            lookAheadIndex = index + 1;
            return annotationModeWhitespaceSkipper();
        };

        // Annotation mode white-space skipper: If lookahead index is equal to the number of
        // child nodes in current parent then jump to the step labeled end mode.
        var annotationModeWhitespaceSkipper = function () {
            if (lookAheadIndex === currentParent.childNodes.length) return endMode();
            // If the lookahead indexth node in current parent is an rt element or an rp element,
            // then set index to lookahead index and jump to the step labeled annotation mode.
            var ni = currentParent.childNodes.item(lookAheadIndex);
            if (helpers.isElementCalled(ni, "rt") || helpers.isElementCalled(ni, "rp")) {
                index = lookAheadIndex;
                return annotationMode();
            }
            // If the lookahead indexth node in current parent is not a Text node, or is a Text node
            // that is not inter-element whitespace, then jump to the step labeled base mode (without
            // further incrementing index, so the inter-element whitespace seen so far becomes part of
            // the next base text segment).
            if (ni.nodeType !== helpers.TEXT_NODE || !helpers.isInterElementWhitespace(ni)) return baseMode();
            // Increment lookahead index by one.
            lookAheadIndex++;
            // Jump to the step labeled annotation mode white-space skipper.
            return annotationModeWhitespaceSkipper();
        };

        // End mode: If current parent is not the same element as root, then pop a ruby level and
        // jump to the step labeled base mode post-increment.
        var endMode = function () {
            if (currentParent !== root) {
                popRubyLevel();
                return baseModePostIncrement();
            }
            return end();
        };

        // End: Return base text segments and annotation segments. Any content of the ruby element
        // not described by segments in either of thost lists is implicitly in an ignored segment.
        var end = function () {
            // XXX compute ignored segments?
            return ret;
        };

        return startMode();
    };

    // new variant
    ruby.newSegmentAndCategoriseRubyElement = function (el) {
        var runs = []
        ,   root = el
        ,   index = 0
        ,   currentAutomaticBaseNodes = []
        ,   currentAutomaticBaseRangeStart = null
        ,   currentAutomaticAnnotationNodes = []
        ,   currentAutomaticAnnotationRangeStart = null
        ,   currentBases = []
        ,   currentBasesRangeStart = 0
        ,   currentBasesRange = null
        ,   currentAnnotations = []
        ,   currentAnnotationsRangeStart = 0
        ,   currentAnnotationsRange = null
        ,   currentCompoundAnnotations = []
        ;
        
        // if it isn't a ruby element, return
        if (!helpers.isElementCalled(el, "ruby")) return;
        // if it has a ruby ancestor, return
        if (helpers.getAncestor(root, "ruby")) return;
        
        
        // commit a run
        // Data model:
        //  - the root ruby contains a sequence of ruby runs
        //  - a ruby run contains:
        //      - a run of zero or more bases and their intervening space (some of those bases may be automatic)
        //      - between zero and two compound annotations (zero or one of which may be automatic)
        // - a run is described by:
        //      - a list of bases (each of which is linked to an annotation if applicable)
        //      - a range representing the bases run (this includes white space and rp)
        //      - a first compound annotation
        //      - a second compound annotation
        // - a compound annotation is described by:
        //      - a list of annotations (some of which may be automatic)
        //      - a range representing that compound annotation (including spaces and rp)
        var commitRun = function () {
            if (currentAutomaticBaseNodes.length === 0 &&
                currentAutomaticAnnotationNodes.length === 0 &&
                currentBases.length === 0 &&
                currentAnnotations.length === 0 &&
                currentCompoundAnnotations.length === 0) return;
            commitAutomatics();
            if (currentBases.length && !currentBasesRange) {
                currentBasesRange = makeRange(root, currentBasesRangeStart, index);
            }
            if (currentAnnotations.length && !currentAnnotationsRange) {
                currentAnnotationsRange = makeRange(root, currentAnnotationsRangeStart, index);
            }
            if (currentAnnotations.length) {
                currentCompoundAnnotations.push({
                    annotations:    currentAnnotations
                ,   range:          currentAnnotationsRange
                });
            }
            runs.push({
                bases:                      currentBases
            ,   baseRange:                  currentBasesRange
            ,   firstCompoundAnnotations:   currentCompoundAnnotations[0] || null
            ,   secondCompoundAnnotations:  currentCompoundAnnotations[1] || null
            });
            currentBases = [];
            currentBasesRangeStart = index + 1;
            currentBasesRange = null;
            currentAnnotations = [];
            currentAnnotationsRangeStart = index + 1;
            currentAnnotationsRange = null;
            currentCompoundAnnotations = [];
        };

        // commit automatics (either one)
        var commitAutomatics = function () {
            if (currentAutomaticBaseNodes.length) commitAutomaticBase();
            if (currentAutomaticAnnotationNodes.length) commitAutomaticAnnotation();
        };

        // commit an automatic base
        // if the whole content is IEWS nothing happens
        var commitAutomaticBase = function () {
            // check that we have something that's not IEWS
            if (!currentAutomaticBaseNodes.every(helpers.isInterElementWhitespace)) {
                if (!currentBases.length) currentBasesRangeStart = currentAutomaticBaseRangeStart;
                currentBases.push({ range: makeRange(root, currentAutomaticBaseRangeStart, index) });
            }
            currentAutomaticBaseNodes = [];
            currentAutomaticBaseRangeStart = null;
        };

        // commit an automatic annotation
        // same as above
        var commitAutomaticAnnotation = function () {
            // check that we have something that's not IEWS
            if (!currentAutomaticAnnotationNodes.every(helpers.isInterElementWhitespace)) {
                if (!currentAnnotations.length) currentAnnotationsRangeStart = currentAutomaticAnnotationRangeStart;
                currentAnnotations.push({ range: makeRange(root, currentAutomaticAnnotationRangeStart, index) });
            }
            currentAutomaticAnnotationNodes = [];
            currentAutomaticAnnotationRangeStart = null;
        };

        // helper to make ranges
        var makeRange = function (el, start, end) {
            var newRange = range.makeRange();
            newRange.setStart(el, start);
            newRange.setEnd(el, end);
            return newRange;
        };

        // what happens when we reach the end
        var endMode = function () {
            commitRun();
            return runs;
        };

        // process each child of the ruby element in turn
        var processRubyChild = function () {
            if (root.childNodes.length === index) return endMode();
            var currentChild = root.childNodes.item(index);

            // rp
            // This just gets skipped which causes it to show up in whatever range we
            // are currently processing. This is deliberate.
            if (helpers.isElementCalled(currentChild, "rp")) {
                index++;
                return processRubyChild();
            }

            // rt
            if (helpers.isElementCalled(currentChild, "rt")) {
                commitAutomatics();
                // if there are two compounds already, commit the run
                if (currentCompoundAnnotations.length === 2) commitRun();
                // add an annotation
                currentAnnotations.push({ range: makeRange(root, index, index + 1) });
                index++;
                return processRubyChild();
            }

            // rtc
            if (helpers.isElementCalled(currentChild, "rtc")) {
                commitAutomatics();
                // XXX if there are current annotations, commit them to a coumpound
                // if there are two compounds already, commit the run
                if (currentCompoundAnnotations.length === 2) commitRun();
                // XXX add a compound
                //  this involves processing its children to produce a list of annotations as ranges

                // yes, we do this again (same check, different situation)
                if (currentCompoundAnnotations.length === 2) commitRun();
                index++;
                return processRubyChild();
            }


            // for the following we need to commit the run if there are two compounds already
            // if rt, commit current base, add annotation, inc, iterate
            // XXX
            // for rtc we need to look inside of it to generate a list of annotations
            // if rtc, commit current base, add rtc as range(rtcStartIndex, index) and rtc, rtcStartIndex = index + 1
            // XXX
        
            // anything else is candidate to be part of the base
            // if we've already seen annotations and what we have is inter-element WS then don't push to currentBase
            // if rb, commit current base, add both bases, inc, iterate
            if (helpers.isElementCalled(currentChild, "rb")) {
            }
            // note that this causes rp to be part of the base, but we don't care since it's ignored
            // currentBase.push(currentChild);
            index++;
            return processRubyChild();
        };
        return processRubyChild();

        // XXX
        // we need to associate runs of consecutive bases with runs of consecutive annotations
        // we need to ignore automatic bases that are only inter-element white space, but they
        // need to be present in the base *runs* (even if the run contains just one base).
        //
        // the following:
        //      rb, rt, rtc, rt
        // needs to generate a ruby run with two compound annotations followed by a ruby run
        // with an empty base and a single annotation
        //
        // we need to make is so that whenever a base is found, if there are any current annotations
        // then a run is committed
        // likewise when we reach the end
        // we probably need to drop rp
        //
        // okay, there's another problem
        //  - for a ruby run, there can be two annotation runs
        //  - at least one of them has to be explicitly triggered by an <rtc> but conceptually
        //    a sequence of <rt> not contained in an <rtc> is actually an automatic <rtc>
        //  - this means that <rb><rb><rtc></><rt><rt> and <rb><rb><rt><rt><rtc> are equivalent.
        //  - an <rtc> can contain <rt>. These need to be associated with bases just the same
        //
        // these are equivalent:
        // <ruby>
        //  <rb>FOO<rb>BAR
        //  <rt>baz1<rt>baz2
        //  <rtc>aka fubar
        //  <rb>FOO2<rb>BAR2
        //  <rt>baz3<rt>baz4
        //  <rtc>aka bazbaz
        // and
        // <ruby>
        //  <rb>FOO<rb>BAR
        //  <rtc><rt>baz1<rt>baz2
        //  <rtc>aka fubar
        //  <rb>FOO2<rb>BAR2
        //  <rtc><rt>baz3<rt>baz4
        //  <rtc>aka bazbaz
        //
        // we need to make rt implied inside of <rtc> so that
        // <rtc>Foo<rt>bar
        // actually creates two annotations in the annotation run
        // this entails that we also need a range for each (abstract) rtc
        
        
        // var commitCurrentBase = function () {
        //     if (!currentBase.length) return;
        //     var baseRange = range.makeRange();
        //     baseRange.setStart(root, helpers.indexOfNodeInParent(currentBase[0], root));
        //     baseRange.setEnd(root, helpers.indexOfNodeInParent(currentBase[currentBase.length - 1], root));
        //     ret.baseTextSegments.push(makeBaseTextSegment(baseRange));
        //     currentBase = [];
        // };
        //
        // var endMode = function () {
        //     // XXX here we need to clean up whatever's left, notably anything that might still be a
        //     // base (or maybe we just don't care)
        //     return ret;
        // };
        // return processRubyChild();
    };

    
}());

