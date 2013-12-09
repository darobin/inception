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
            ,   compAnns = run.compoundAnnotations
            ,   max = run.bases.length
            ,   $td = $("<td></td>")
            ,   $table = $("<table class='run'></table>")
            ,   $baseTR = $("<tr></tr>")
            ,   annTRs = []
            ;
            if (compAnns) {
                for (var j = 0, m = compAnns.length; j < m; j++) {
                    var anns = compAnns[j].annotations;
                    if (anns.length > max) max = anns.length;
                    annTRs.push($("<tr></tr>"));
                }
            }
            $table.append(annTRs[0] || $("<tr></tr>"));
            $table.append($baseTR);
            for (var j = 1, m = annTRs.length; j < m; j++) $table.append(annTRs[j]);
            
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
                    $td.find("rp").hide();
                    $td.appendTo($tr);
                    if (j === m - 1 && sources.length < max) {
                        $td.attr("colspan", max - (sources.length - 1));
                    }
                }
            };
            processRanges(compAnns[0] ? compAnns[0].annotations : null, annTRs[0]);
            processRanges(run.bases, $baseTR);
            for (var j = 1, m = annTRs.length; j < m; j++) processRanges(compAnns[j].annotations, annTRs[j]);
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
            for (var j = 0, m = run.compoundAnnotations.length; j < m; j++) {
                var ann = run.compoundAnnotations[j];
                str += "    \u2022 compound annotation (" + j + "):\n";
                str += "        . annotations:\n";
                for (var k = 0, p = ann.annotations.length; k < p; k++) {
                    str += "            - <<" + ssn(ann.annotations[k].range.toString()) + ">>\n";
                }
                str += "        . annotationsRange: <<" + ssn(ann.range.toString()) + ">>\n";
            }
        }
        return str;
    }
}(jQuery));



