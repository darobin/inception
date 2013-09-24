/*global Inception*/

(function ($) {
    var $results = $("#results");
    $("#run").click(function () {
        $results.empty();
        render($($("#ruby").val()), $results);
    });
    $("#run").click();

    function render ($ruby, $cont) {
        $cont.append("<h2>Results</h2>");
        $cont.append("<h3>Ruby</h3>");
        $cont.append($ruby);
        // don't use this one, as it'll blow up
        // ,   data = Inception.Elements.Ruby.segmentAndCategoriseRubyElement($ruby[0])
        var data = Inception.Elements.Ruby.newSegmentAndCategoriseRubyElement($ruby[0]);
        console.log(data);
        
        // home made rendering
        var $rootTable = $("<table class='rubyRuns'></table>")
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
            ,   $table = $("<table class='run'></table>")
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
                    $td.find("rp").css({ color: "#ddd", fontSize: "10px", verticalAlign: "super" });
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
        $cont.append("<h3>Table Rendering</h3>");
        $rootTable.appendTo($cont);

        // simple dump
        var $pre = $("<pre></pre>");
        $pre.text(dump(data));
        $cont.append("<h3>Data Model Dump</h3>");
        $pre.appendTo($cont);
    }
    function ssn (str) {
        return str.replace(/\n/g, "\\n");
    }
    function dump (runs) {
        var str = "";
        for (var i = 0, n = runs.length; i < n; i++) {
            var run = runs[i];
            str += "Run " + i + "\n";
            str += "    \u2022 bases:\n";
            for (var j = 0, m = run.bases.length; j < m; j++) {
                str += "        - <<" + ssn(run.bases[j].range.toString()) + ">>\n";
            }
            str += "    \u2022 baseRange: <<" + ssn(run.baseRange.toString()) + ">>\n";
            str += "    \u2022 first compound annotation:\n";
            if (run.firstCompoundAnnotations) {
                str += "        . annotations:\n";
                for (var j = 0, m = run.firstCompoundAnnotations.annotations.length; j < m; j++) {
                    str += "            - <<" + ssn(run.firstCompoundAnnotations.annotations[j].range.toString()) + ">>\n";
                }
                str += "        . annotationsRange: <<" + ssn(run.firstCompoundAnnotations.range.toString()) + ">>\n";
            }
            else {
                str += "        null\n";
            }
            str += "    \u2022 second compound annotation:\n";
            if (run.secondCompoundAnnotations) {
                str += "        . annotations:\n";
                for (var j = 0, m = run.secondCompoundAnnotations.annotations.length; j < m; j++) {
                    str += "            - <<" + ssn(run.secondCompoundAnnotations.annotations[j].range.toString()) + ">>\n";
                }
                str += "        . annotationsRange: <<" + ssn(run.secondCompoundAnnotations.range.toString()) + ">>\n";
            }
            else {
                str += "        null\n";
            }
        }
        return str;
    }
}(jQuery));



