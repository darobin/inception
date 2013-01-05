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
        ,   currentBases = []
        ,   currentBasesRangeStart = null
        ,   currentBasesRange = null
        ,   currentAnnotations = []
        ,   currentAnnotationsRangeStart = null
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
            commitAutomaticBase();
            if (currentBases.length === 0 &&
                currentAnnotations.length === 0 &&
                currentCompoundAnnotations.length === 0) return;
            commitBaseRange();
            commitAnnotations();
            runs.push({
                bases:                      currentBases
            ,   baseRange:                  currentBasesRange
            ,   firstCompoundAnnotations:   currentCompoundAnnotations[0] || null
            ,   secondCompoundAnnotations:  currentCompoundAnnotations[1] || null
            });
            currentBases = [];
            currentBasesRangeStart = null;
            currentBasesRange = null;
            currentCompoundAnnotations = [];
        };

        // commit annotations to a compound
        var commitAnnotations = function () {
            if (currentAnnotations.length && !currentAnnotationsRange) {
                currentAnnotationsRange = makeRange(root, currentAnnotationsRangeStart, index);
            }
            if (currentAnnotations.length) {
                currentCompoundAnnotations.push({
                    annotations:    currentAnnotations
                ,   range:          currentAnnotationsRange
                });
            }
            currentAnnotations = [];
            currentAnnotationsRangeStart = null;
            currentAnnotationsRange = null;
        };
        
        // commit bases to a range
        var commitBaseRange = function () {
            if (currentBases.length && !currentBasesRange) {
                currentBasesRange = makeRange(root, currentBasesRangeStart, index);
            }
        };

        // commit an automatic base
        // if the whole content is IEWS nothing happens
        var commitAutomaticBase = function () {
            if (!currentAutomaticBaseNodes.length) return;
            // check that we have something that's not IEWS
            if (!currentAutomaticBaseNodes.every(helpers.isInterElementWhitespace)) {
                if (!currentBases.length) currentBasesRangeStart = currentAutomaticBaseRangeStart;
                currentBases.push({ range: makeRange(root, currentAutomaticBaseRangeStart, index) });
            }
            currentAutomaticBaseNodes = [];
            currentAutomaticBaseRangeStart = null;
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

        // XXX this should be fully extracted because in the spec that's how it will be,
        //     as part of the <rtc> element section
        // process an rtc element's children
        // note that for the algorithm this runs in a separate scope
        var processExplicitCompound = function (el) {
            var index = 0
            ,   root = el
            ,   currentAutomaticAnnotationNodes = []
            ,   currentAutomaticAnnotationRangeStart = null
            ,   annotations = []
            ;
            
            // commit an automatic annotation
            var commitAutomaticAnnotation = function () {
                if (!currentAutomaticAnnotationNodes.length) return;
                // check that we have something that's not IEWS
                if (!currentAutomaticAnnotationNodes.every(helpers.isInterElementWhitespace)) {
                    annotations.push({ range: makeRange(root, currentAutomaticAnnotationRangeStart, index) });
                }
                currentAutomaticAnnotationNodes = [];
                currentAutomaticAnnotationRangeStart = null;
            };

            var rtcEndMode = function () {
                commitAutomaticAnnotation();
                return annotations;
            };
            
            var processRTCChild = function () {
                if (root.childNodes.length === index) return rtcEndMode();
                var currentChild = root.childNodes.item(index);
                
                // rt
                if (helpers.isElementCalled(currentChild, "rt")) {
                    commitAutomaticAnnotation();
                    annotations.push({ range: makeRange(root, index, index + 1) });
                    index++;
                    return processRTCChild();
                }
                
                // other children
                if (!currentAutomaticAnnotationNodes.length) currentAutomaticAnnotationRangeStart = index;
                currentAutomaticAnnotationNodes.push(currentChild);
                index++;
                return processRTCChild();
            };
            return processRTCChild();
        };

        // process each child of the ruby element in turn
        var processRubyChild = function () {
            if (root.childNodes.length <= index) return endMode();
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
                // if we have automatic bases, commit them
                commitAutomaticBase();
                // commit base to a range
                commitBaseRange();
                // if there are two compounds already, commit the run
                if (currentCompoundAnnotations.length === 2) commitRun();
                // if we're the first, we start a range
                if (!currentAnnotations.length) currentAnnotationsRangeStart = index;
                // add an annotation
                currentAnnotations.push({ range: makeRange(root, index, index + 1) });
                index++;
                return processRubyChild();
            }

            // rtc
            if (helpers.isElementCalled(currentChild, "rtc")) {
                console.log("runs", runs);
                // if we have automatic bases, commit them
                commitAutomaticBase();
                // commit base to a range
                commitBaseRange();
                // if there are current annotations, commit them to a coumpound
                commitAnnotations();
                // if there are two compounds already, commit the run
                if (currentCompoundAnnotations.length === 2) commitRun();
                // add a compound
                //  this involves processing its children to produce a list of annotations as ranges
                //  inside of this there can be automatic annotations
                var annotations = processExplicitCompound(currentChild);
                currentCompoundAnnotations.push({
                    annotations:    annotations
                ,   range:          makeRange(root, index, index + 1)
                });
                // yes, we do this again (same check, different situation)
                if (currentCompoundAnnotations.length === 2) commitRun();
                index++;
                return processRubyChild();
            }

            // special processing for IEWS
            if (helpers.isInterElementWhitespace(currentChild)) {
                // if we have current annotations, don't start an automatic base
                if (currentAnnotations.length) {
                    index++;
                    return processRubyChild();
                }
                // we can reach this stage if we've just closed an RTC
                // the problem is that IEWS in this position could be the start of a base, in
                // which case it needs to be part of the base (we keep going)
                // or could be proper IEWS before another <rt>, in which case it just needs to
                // be ignored (as in the previous conditional)
                // if we have two compounds already, keep going as this is base material
                if (currentCompoundAnnotations.length !== 2) {
                    var lookaheadIndex = index;
                    // otherwise peek ahead, for each step:
                    var peekAhead = function () {
                        lookaheadIndex++;
                        // if ever the end is reached, keep going it doesn't matter
                        if (root.childNodes.length === lookaheadIndex) return;
                        var peekChild = root.childNodes.item(lookaheadIndex);
                        // if IEWS, then keep peeking
                        if (helpers.isInterElementWhitespace(peekChild)) return peekAhead();
                        // if rt or rtc, drop as above since we don't want an automatic base
                        if (helpers.isElementCalled(peekChild, "rt") || helpers.isElementCalled(peekChild, "rtc")) {
                            index = lookaheadIndex;
                            return processRubyChild();
                        }
                        // else it's text, rb, or an arbitrary element that should go into a base
                        // so we can just let it flow
                    };
                    peekAhead();
                }
            }

            // if there are annotations, commit the run
            if (currentAnnotations.length || currentCompoundAnnotations.length) commitRun();

            // rb
            if (helpers.isElementCalled(currentChild, "rb")) {
                // if we have automatic bases, commit them
                commitAutomaticBase();
                // if we're the first, start a range
                if (!currentBases.length) currentBasesRangeStart = index;
                // add a base
                currentBases.push({ range: makeRange(root, index, index + 1) });
                index++;
                return processRubyChild();
            }

            // all the rest
            // if we're the first, start a range
            if (!currentAutomaticBaseNodes.length) currentAutomaticBaseRangeStart = index;
            // add a node
            currentAutomaticBaseNodes.push(currentChild);
            // anything else is candidate to be part of the base
            index++;
            return processRubyChild();
        };
        return processRubyChild();
    };
    // XXX we don't currently associate bases and annotations, but that can be automatic
    // using position in their respective lists (I assume)
}());
