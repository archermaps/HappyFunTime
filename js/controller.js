define([
      "esri/views/SceneView",
      "esri/portal/PortalItem",
      "esri/WebScene",
      "esri/config",

      "floorpicker/FloorPickerView",
      "campussearch/CampusSearch",
      "info/InfoView",
      "route/Route",
      "crosspanel/CrossPanelView",
      "sidepanel/SidePanelView",
      "esri/PopupTemplate",
      "esri/layers/Layer",
      "esri/Graphic",
      "esri/layers/GraphicsLayer",
      "./SceneController",

      "dojo/_base/lang",
      "dojo/topic",
      "dojo/domReady!"
    ], function(
      SceneView, PortalItem, WebScene, esriConfig,
      FloorPickerView, CampusSearch, InfoBtn, Route, CrossPanelView, SidePanelView, PopupTemplate, Layer, Graphic, GraphicsLayer, SceneController,
      lang, topic
    ) {

        return {

            startup: function(config) {
                this.config = config;
                this.routingMode = false;

                this.view = null;
                this.initView();

            },

            initView: function() {

                esriConfig.portalUrl =  this.config.portalUrl;
                this.scene = new WebScene({
                    portalItem:       //new PortalItem( - autocasting
                    {
                      id: this.config.webSceneId
                    }
                });

                this.view = new SceneView({
                    map: this.scene,
                    container: "map",
                    popup:null      //no popups for any layer
                });

                this.view.then(lang.hitch(this, function() {
                    //All the resources in the SceneView and the map have loaded.
                    this.sceneController = new SceneController({
                                                  config:this.config,
                                                  view: this.view,
                                                  containerDiv: "map",
                                                  slidesDiv: "slidesDiv"
                                                  });
                    this.sceneController.initView();

                    this.initWidgets();
                    this.handleTopics();

                }), function (error) {
                console.log("The view's resources failed to load: ", error);
                });

            },

            initWidgets: function() {

                this.sidePanel = new SidePanelView({
                    view: this.view,
                    containerDiv: 'left-panel',
                    config: this.config
                });
                this.sidePanel.startup();

                this.infoBtn = new InfoBtn({
                    view: this.view,
                    containerDiv: 'info-btn-tab',
                    config: this.config
                });
                this.infoBtn.startup();

                this.crossPanel = new CrossPanelView({
                    view: this.view,
                    containerDiv: 'layer-slides',
                    config: this.config
                });
                this.crossPanel.startup();

                this.floorPicker = new FloorPickerView({
                    view: this.view,
                    containerDiv: 'floor-picker',
                    config: this.config
                });
                this.floorPicker.startup();

                this.campussearch = new CampusSearch({
                    view: this.view,
                    containerDiv: "search",
                    config:  this.config
                    });
                this.campussearch.startup();

                this.route = new Route({
                    view: this.view,
                    //infoDiv: 'routeInfoDiv',
                    config: this.config
                });
                this.route.startup();

            },

            handleTopics: function() {

                topic.subscribe("sidePanel/open", lang.hitch(this, function(event) {
                    this.sidePanel.open(event.card);
                }));

                topic.subscribe("sidePanel/toggle", lang.hitch(this, function() {
                    this.sidePanel.toggle();
                }));

                topic.subscribe("infoBtn/reset", lang.hitch(this, function() {
                    this.infoBtn.reset();
                }));

                topic.subscribe("infoBtn/hide", lang.hitch(this, function() {
                    this.infoBtn.hide();
                }));

                topic.subscribe("infoBtn/routeInProgress", lang.hitch(this, function(event) {
                    this.infoBtn.routeInProgress(event.status);
                }));

                topic.subscribe("floorPicker/switchFloors", lang.hitch(this, function(floor) {
                    this.floorPicker.floorButtonClick(floor);
                }));

                topic.subscribe("update-nonFloorLayers", lang.hitch(this, function() {
                    this.sceneController.setNonFloorLayersVisibility(false);
                }));

                topic.subscribe("routing-completed", lang.hitch(this, function() {
                    this.routingMode = false;
                }));

                topic.subscribe("init-slides", lang.hitch(this, function(slides) {
                    this.crossPanel.setupSlides(slides);
                }));

                topic.subscribe("search/complete", lang.hitch(this, function(evt) {
                    this.sceneController.zoomToFeature(evt.results[0]);

                    this.sidePanel.handleSearchInfo(evt);
                }));

                topic.subscribe("room-click", lang.hitch(this, function(feat) {
                    this.sidePanel.handleClickInfo(feat);
                }));


                topic.subscribe("route/solve", lang.hitch(this, function(startInfo, destinationInfo, elevator) {
                    this.route.startRouting(startInfo, destinationInfo, elevator);
                }));

                topic.subscribe("route/complete", lang.hitch(this, function(attr) {
                    this.sidePanel.populateRouteInfo(attr);
                }));

                topic.subscribe("route/error", lang.hitch(this, function() {
                    this.sidePanel.populateRouteInfo(null);
                }));

                topic.subscribe("crosspanel/layer-click", lang.hitch(this, function(lyrInfo) {
                    this.sidePanel.populatePOI(lyrInfo);
                }));

                // topic.subscribe("populate-POI", lang.hitch(this, function(lyrInfo) {
                //     this.sidePanel.populatePOI(lyrInfo);
                // }));

                topic.subscribe("route/close", lang.hitch(this, function() {
                    this.route.clearRouting();
                }));
            }
        };

    });
