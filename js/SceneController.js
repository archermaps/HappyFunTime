define([
    "esri/views/SceneView",
    "esri/widgets/Search/SearchViewModel",
    "esri/portal/PortalItem",
    "esri/WebScene",
    "esri/config",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/symbols/PolygonSymbol3D",
    'esri/symbols/FillSymbol3DLayer',
    'esri/renderers/UniqueValueRenderer',
    "esri/PopupTemplate",
    "esri/layers/SceneLayer",
    "esri/Map",
    "esri/geometry/support/webMercatorUtils",
    "esri/Camera",
    "esri/geometry/Point",
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "esri/layers/FeatureLayer",

    "dojo/_base/declare",
    "dojo/_base/lang",
    'dojo/_base/array',
    "dojo/topic",
    "dojo/Deferred",
    "dojo/dom",
    "dojo/on",
    "dojo/query",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/promise/all",
    "dojo/domReady!"

    ],
    function(
        SceneView, SearchViewModel, PortalItem, WebScene, esriConfig,
        Graphic, GraphicsLayer, PolygonSymbol3D, FillSymbol3DLayer, UniqueValueRenderer, PopupTemplate,
        SceneLayer, Map, webMercatorUtils, Camera, Point, QueryTask, Query, FeatureLayer,
        declare, lang, array, topic, Deferred, dom, on, dojoQuery, domConstruct, domStyle, all
        ) {

        return declare([], {

            constructor: function(options) {
                this.config = options.config;
                this.sceneView = options.view;
                this.map = this.sceneView.map;

                this.containerDiv = options.containerDiv;
                this.slidesDiv = options.slidesDiv;

                this.roomLayerViewsInfo = {};
                this.roomLayerPromises = [];

                this.nonFloorLayerViewsInfo = [];
                this.nonFloorLayerPromises = [];

                this.layersPerWebSlide = {};

                this.currentSlide = null;

            },

            initView: function () {
                this._getLayerInfo();
                this._sceneViewClickHandler();
            },

            _getLayerInfo: function() {
                var self = this;
                var grp = this.config.groupLayers;
                var roomStrId = this.config.roomLayerStringIdentifier.toLowerCase();

                var allLyrs = this.map.layers.items;
                for (var i = 0; i < allLyrs.length; i++) {
                    var lyrInfo = allLyrs[i];
                    //group layer
                    if (lyrInfo.hasOwnProperty('layers')) {

                        //get floor and corresponding room layer
                        for (var flr in grp){
                            if (grp.hasOwnProperty(flr)) {
                                // if FLoor group layer
                                if (grp[flr].toLowerCase() === lyrInfo.title.toLowerCase()) {
                                    // get rooms/spaces layers
                                    var roomLayer = lyrInfo.layers.find(function(lyr){
                                      return (lyr.title.toLowerCase().indexOf(roomStrId) > -1 );
                                    });

                                    roomLayer.popupEnabled = false;
                                    // moving promise to another function - not good to create any functions [ then() etc] within loop
                                    this._handleRoomLayerViewPromises(flr, roomLayer);
                                    break;
                                }
                            }
                        }

                    }  else {
                        // not group layers
                        var lyrTitle = lyrInfo.title.toLowerCase();

                        if ((lyrTitle.indexOf(this.config.treeStringIdentifier.toLowerCase()) > -1) ||
                            (lyrTitle.indexOf(this.config.wireframeStringIdentifier.toLowerCase()) > -1) ||
                            (lyrTitle.indexOf(this.config.textureStringIdentifier.toLowerCase()) > -1) ){

                            // moving promise to another function - not good to create any functions [ then() etc] within loop
                            this._handleNonFloorLayerViewPromises(lyrInfo);
                        }

                    }
                }


                all(self.roomLayerPromises).then(function(resultsArr) {
                    resultsArr.forEach(function(result) {
                        //floor and layerView
                        self.roomLayerViewsInfo[result[0]] = result[1].layer;
                    });
                  }, function(err) {
                    console.log(err);
                  });


                all(self.nonFloorLayerPromises).then(function(lyrViewsArr) {
                    lyrViewsArr.forEach(function(lyrView) {
                        self.nonFloorLayerViewsInfo.push(lyrView);
                    });
                  }, function(err) {
                    console.log(err);
                  });


            },

            _handleRoomLayerViewPromises: function(flr, roomLayer) {
                //layerView may not be initialized - also add to 'promises' array to get consolidated results
                this.roomLayerPromises.push(
                    this.sceneView.whenLayerView(roomLayer)
                        .then(function(layerView) {
                            return [flr, layerView];
                        } , function(error) {
                            console.log("error " + error);
                        })
                );

            },

            _handleNonFloorLayerViewPromises: function(lyrInfo) {
                //layerView may not be initialized - also add to 'promises' array to get consolidated results
                this.nonFloorLayerPromises.push(
                    this.sceneView.whenLayerView(lyrInfo)
                        .then(function(layerView) {
                            return layerView;
                        } , function(error) {
                            console.log("error " + error);
                        })
                );

            },

            _sceneViewClickHandler: function() {
                this.sceneView.on("click", lang.hitch(this, function(evt) {
                     //get screen point and use it in hitTest to get graphic
                    this.sceneView.hitTest(evt.screenPoint).then(lang.hitch(this, function(response) {
                        var result = response.results[0];
                        if ((result.graphic) && (result.graphic.layer.title)) {
                            if(result.graphic.layer.title.toLowerCase().indexOf(this.config.roomLayerStringIdentifier.toLowerCase()) > -1) {
                                this._clickRoom(result);
                            } else {
                                //var template = new PopupTemplate(this.config.treesPopupTemplate);
                            }
                        }
                    }));
                }));
            },

            _clickRoom: function(clickResult) {

                var queryTask = new QueryTask({
                    url: this.config.primaryQueryUrl
                });

                var query = new Query();
                query.returnGeometry = true;
                query.outFields = this.config.primaryOutFields;
                query.where = this.config.primaryObjectIDField + " = " + clickResult.graphic.attributes[this.config.primaryObjectIDField] ;
                query.returnZ = true;
                query.returnGeometry = true;


                queryTask.execute(query).then(
                  lang.hitch(this, function(result) {

                    var targetGeom = result.features[0].geometry;
                    // reproject feature point to same SP as webscene's map
                    if (!targetGeom.spatialReference.isWebMercator) {
                        //project
                        if (webMercatorUtils.canProject(targetGeom.spatialReference, this.sceneView.spatialReference)) {
                            targetGeom = webMercatorUtils.project(targetGeom , this.sceneView.spatialReference);
                            // have to do this as Z gets dropped during reprojection
                            targetGeom.z = result.features[0].geometry.z;
                       }
                    }

                    var gph = new Graphic ({
                        attributes: result.features[0].attributes,
                        geometry:targetGeom
                    });

                    this._setSymbology(gph);
                    topic.publish("room-click", gph);
                  })
                );
            },

            _setSymbology: function (featInfo) {

                var feat = featInfo.attributes;

                var lyrFill = new FillSymbol3DLayer({
                    material: { color: this.config.roomSelectionColor }
                });
                var pSymbolLayers = [lyrFill];

                var polySymbol = new PolygonSymbol3D();
                polySymbol.symbolLayers = pSymbolLayers;

                var uniqRenderer = new UniqueValueRenderer({
                    field: this.config.spaceLayerFieldForRenderer    // CASE-SENSITIVE
                });

                var val = feat[this.config.spaceLayerFieldForRenderer];
                uniqRenderer.addUniqueValueInfo(val, polySymbol);

                // get layer info
                var floor =  feat[this.config.floorField];
                var lyr = this.roomLayerViewsInfo[floor];
                lyr.renderer = uniqRenderer;

                //reproject feature point to same SP as webscene's map
                var featSpatRef = featInfo.geometry.spatialReference;
                var targetGeom;
                if (webMercatorUtils.canProject(featSpatRef, this.sceneView.spatialReference)) {
                    targetGeom = webMercatorUtils.project(featInfo.geometry , this.sceneView.spatialReference);
                } else {
                    targetGeom = featInfo.geometry;
                }

                this.sceneView.goTo({
                    target: targetGeom,
                    tilt: this.config.viewTilt,
                    zoom: this.config.viewZoom
                });

                topic.publish("floorPicker/switchFloors", feat[this.config.floorField]);
            },


            setNonFloorLayersVisibility: function(visibleFlg) {

                this.nonFloorLayerViewsInfo.forEach(lang.hitch(this, function(lyrView) {
                    if (lyrView.layer.title.indexOf(this.config.wireframeStringIdentifier) > -1) {
                        lyrView.visible = !visibleFlg;
                    } else {
                        lyrView.visible = visibleFlg;
                    }
                }));
            },

            zoomToFeature: function(result) {
                this._setSymbology( result.results[0].feature);

            },

            // retrievePOI: function(layerName) {
            //     var lyrInfo = this.layersPerWebSlide[layerName.toLowerCase()];
            //     topic.publish("populate-POI", lyrInfo);
            // },

            supportsSessionStorage: function() {
                if (typeof(window.sessionStorage) !== undefined ) {
                    return true;
                }
                else {
                    return false;
                }
            }

        });

    });

