require([      
    "esri/config",     

    "js/controller",
    "config/config",

    "dojo/domReady!"
], function(esriConfig, controller, config) {    

    function init(config) { 
        controller.startup(config);
    }

    init(config);

});
