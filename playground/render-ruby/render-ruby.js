/*global Inception*/

(function ($) {
    function render ($el) {
        var $ruby = $el.find("ruby").first()
        ,   $cont = $ruby.parent()
        // don't use this one, as it'll blow up
        // ,   data = Inception.Elements.Ruby.segmentAndCategoriseRubyElement($ruby[0])
        ,   data = Inception.Elements.Ruby.newSegmentAndCategoriseRubyElement($ruby[0])
        ;
        // console.log(data);
        
        // simple dump
        var $pre = $("<pre></pre>");
        $pre.text(dump(data));
        $pre.insertAfter($cont);

        // show source
        var $src = $("<pre></pre>");
        $src.text($ruby.html());
        $src.insertAfter($cont);

        // home made rendering
        var $rootTable = $("<table></table>")
        ,   $rootTR = $("<tr></tr>")
        ;
        $rootTable.append($rootTR);
        for (var i = 0, n = data.length; i < n; i++) {
            var run = data[i]
            ,   anns1 = run.firstCompoundAnnotations ? run.firstCompoundAnnotations.annotations : null
            ,   anns2 = run.secondCompoundAnnotations ? run.secondCompoundAnnotations.annotations : null
            ,   max = Math.max( run.bases.length
                            ,   anns1 ? anns1.length : 0
                            ,   anns2 ? anns2.length : 0 )
            ,   $td = $("<td></td>")
            ,   $table = $("<table></table>")
            ,   $firstAnnTR = $("<tr></tr>")
            ,   $baseTR = $("<tr></tr>")
            ,   $secondAnnTR = $("<tr></tr>")
            ;
            $table.append($firstAnnTR);
            $table.append($baseTR);
            $table.append($secondAnnTR);
            
            var processRanges = function (sources, $tr) {
                if (!sources) {
                    var $td = $("<td>\u00a0</td>");
                    $td.attr("colspan", max);
                    $td.appendTo($tr);
                    return;
                }
                for (var j = 0, m = sources.length; j < m; j++) {
                    var range = sources[j].range
                    ,   $td = $("<td></td>")
                    ;
                    $td.append(range ? range.cloneContents() : "\u00a0");
                    $td.appendTo($tr);
                    if (j === m - 1 && sources.length < max) {
                        $td.attr("colspan", max - (sources.length - 1));
                    }
                }
            };
            processRanges(anns1, $firstAnnTR);
            processRanges(run.bases, $baseTR);
            processRanges(anns2, $secondAnnTR);
            $td.append($table);
            $rootTR.append($td);
        }
        $rootTable.appendTo($cont.parent());
    }
    // XXX
    //  - make this pretty
    //  - use a text area that dumps the output (with several pre-configured sets to try)
    function dump (runs) {
        var str = "";
        for (var i = 0, n = runs.length; i < n; i++) {
            var run = runs[i];
            str += "Run " + i + "\n";
            str += "    \u2022 bases:\n";
            for (var j = 0, m = run.bases.length; j < m; j++) {
                str += "        - " + run.bases[j].range.toString() + "\n";
            }
            str += "    \u2022 baseRange: " + run.baseRange.toString() + "\n";
            str += "    \u2022 first compound annotation:\n";
            if (run.firstCompoundAnnotations) {
                str += "        . annotations:\n";
                for (var j = 0, m = run.firstCompoundAnnotations.annotations.length; j < m; j++) {
                    str += "            - " + run.firstCompoundAnnotations.annotations[j].range.toString() + "\n";
                }
                str += "        . annotationsRange: " + run.firstCompoundAnnotations.range.toString() + "\n";
            }
            else {
                str += "        null\n";
            }
            str += "    \u2022 second compound annotation:\n";
            if (run.secondCompoundAnnotations) {
                str += "        . annotations:\n";
                for (var j = 0, m = run.secondCompoundAnnotations.annotations.length; j < m; j++) {
                    str += "            - " + run.secondCompoundAnnotations.annotations[j].range.toString() + "\n";
                }
                str += "        . annotationsRange: " + run.secondCompoundAnnotations.range.toString() + "\n";
            }
            else {
                str += "        null\n";
            }
        }
        return str;
    }
    
    $(".ruby").each(function () {
        render($(this));
    });
    
    // $("#run").click(function () {
        // render("simple");
    // });
}(jQuery));



