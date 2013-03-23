//
// This module loads all templates via the RequireJS text plugin, compiles them via Underscore and
// exposes them as injectable dependencies for other modules to use.
//
define(["text!templates/yam.html.tpl"], function(yamTemplate) {
    var templates = {
	yam: _.template(yamTemplate)
    };

    return(templates);
})
