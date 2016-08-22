define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',
    'dojo/on',

     "esri/widgets/Search",
     "esri/layers/FeatureLayer"
    ],
    function(
        declare, lang, topic, on,
        esriSearch, FeatureLayer
        ) {

        return declare([], {

            constructor: function(options) {
                this.config = options.config;
                this.sceneView = options.view;
                this.map = this.sceneView.map;
                this.containerDiv = options.containerDiv;
                // this.searchName = options.searchName;

                this.searchWidget = new esriSearch({
                    view: this.sceneView,
                    allPlaceholder: this.config.allPlaceholder,
                    sources:[{
                      featureLayer: new FeatureLayer({
                        url: this.config.primaryQueryUrl,
                      }),
                      searchFields: this.config.primaryQueryFields,
                      exactMatch: false,
                      outFields: this.config.primaryOutFields,
                      placeholder: this.config.primaryPlaceholder,
                      name: this.config.primaryName,
                      popupEnabled: false,
                      popupOpenOnSelect: false,
                      //resultGraphicEnabled: true,
                      autoNavigate: false,
                      suggestionTemplate: this.config.primarysuggestionTemplate,
                      searchQueryParams:  { returnGeometry:true , returnZ: true} ,
                      zoomScale: this.config.viewZoom
                    }]
                  }, this.containerDiv);

                this.attachEventListeners();
            },

            startup: function() {
                this.searchWidget.startup();
            },

            attachEventListeners: function() {
                this.searchWidget.on("search-complete", function(evt){
                    // The results are stored in the evt Object[]
                    //console.log("Results of the search: ", evt);
                    topic.publish("search/complete", evt);
                });
          }

        });

    });
