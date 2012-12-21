

(function ($) {
    function render (id) {
        var $el = $("#" + id)
        ,   $ruby = $el.find("ruby").first()
        ,   $cont = $ruby.parent()
        ,   data = Inception.Elements.Ruby.segmentAndCategoriseRubyElement($ruby[0])
        ;
        
        // simple dump
        var $pre = $("<pre></pre>");
        $pre.text(data);
        $pre.after($cont);
    }
    $("#run").click(function () {
        render("simple");
    });
}(jQuery));



