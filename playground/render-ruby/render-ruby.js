/*global Inception*/

(function ($) {
    function render ($el) {
        var $ruby = $el.find("ruby").first()
        ,   $cont = $ruby.parent()
        // don't use this one, as it'll blow up
        // ,   data = Inception.Elements.Ruby.segmentAndCategoriseRubyElement($ruby[0])
        ,   data = Inception.Elements.Ruby.newSegmentAndCategoriseRubyElement($ruby[0])
        ;
        console.log(data);
        
        // simple dump
        var $pre = $("<pre></pre>");
        $pre.text(dump(data));
        $pre.insertAfter($cont);
    }
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



