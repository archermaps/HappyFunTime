
  define([
      "dojo/_base/declare",
      "dojo/dom",
      "dojo/on",
      "dojo/topic",
      "dojo/_base/lang",
      "dojo/dom-class",

      "esri/Map",
      "esri/views/MapView",
      "esri/Graphic",
      "esri/layers/GraphicsLayer",
      "esri/geometry/SpatialReference",
      "esri/tasks/support/FeatureSet",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/symbols/SimpleLineSymbol",
      "esri/Color",
      "esri/core/urlUtils",
      "esri/config",
      "esri/symbols/PointSymbol3D",
      "esri/symbols/ObjectSymbol3DLayer",
      "esri/symbols/LineSymbol3D",
      "esri/symbols/PathSymbol3DLayer",
      "esri/geometry/Point",
      "esri/geometry/support/webMercatorUtils",
      "esri/PopupTemplate",
      "esri/geometry/Extent",
      "esri/geometry/Polyline",
      "esri/request",

      "dojo/domReady!"
    ], function(
      declare, dom, on, topic, lang, domClass,
      Map, MapView, Graphic, GraphicsLayer, SpatialReference,
      FeatureSet, SimpleMarkerSymbol, SimpleLineSymbol, Color, urlUtils, esriConfig,
      PointSymbol3D, ObjectSymbol3DLayer,
      LineSymbol3D, PathSymbol3DLayer, Point, webMercatorUtils, PopupTemplate, Extent, Polyline, esriRequest
    ) {

       return declare(null, {

          constructor: function(options) {
            this.inherited(arguments);
            this.config = options.config;
            this.view = options.view;

            this.restrictionValue = "";
            this.routeUrl = this.config.routeTaskUrl + "/solve";
            this.opt = {};

            //The stops and route result will be stored in this layer
            this.gphLyr = new GraphicsLayer({id: 'routeStopsLyr'});
            this.view.map.add(this.gphLyr);

            this.gphLyrView = null;

            this.view.whenLayerView(this.gphLyr)
                        .then(lang.hitch(this, function(layerView) {
                            this.gphLyrView = layerView;
                        }) , function(error) {
                            console.log("error " + error);
                        });
        },

          startup: function() {

            // IF USING PROXY
            // urlUtils.addProxyRule({
            //     urlPrefix: this.config.proxyUrlPrefix,
            //     proxyUrl: this.config.proxyUrl
            // });


            //NOT USING ROUTE TASK - Z BEING DROPPED. USING ESRIREQUEST INSTEAD
            this.opt = {
                useProxy: false,
                query: {
                    f: 'json',
                    returnDirections:false,
                    returnRoutes:true,
                    returnZ:true,
                    returnStops:false,
                    returnBarriers:false,
                    returnPolygonBarriers:false,
                    returnPolylineBarriers:false,
                    outSR:102100,
                    outputLines:'esriNAOutputLineTrueShape',
                    restrictionAttributeNames:'ProhibitElevators'
                }
            };

            this.stopSymbol = new PointSymbol3D({
              symbolLayers: [new ObjectSymbol3DLayer({
                width: this.config.routePointSymWidth,
                height: this.config.routePointSymHeight,
                resource: { primitive: this.config.routePointSymShape },
                material: { color: this.config.routePointSymColor }
              })]
            });

            this.routeStairSymbol = new LineSymbol3D(
              new PathSymbol3DLayer({
                size: this.config.routeStairPathSize,
                material: { color: this.config.routeStairPathColor }
              })
            );

            this.routeElevatorSymbol = new LineSymbol3D(
              new PathSymbol3DLayer({
                size: this.config.routeElevatorPathSize,
                material: { color: this.config.routeElevatorPathColor }
              })
            );

          },

        startRouting: function(startInfo, destinationInfo, elevator) {

            this.clearRouting();

            if (this.gphLyrView.visible === false) {
                this.gphLyrView.visible = true;
            }

            var startPt = this._getProjectedGeom(startInfo.geometry);
            var endPt = this._getProjectedGeom(destinationInfo.geometry);

            var firstStop = new Graphic({
                geometry: startPt,
                symbol: this.stopSymbol
              });
            this.gphLyr.graphics.add(firstStop);

            var lastStop = new Graphic({
                geometry: endPt,
                symbol: this.stopSymbol
              });
            this.gphLyr.graphics.add(lastStop);

            var featSet = new FeatureSet({
                                geometryType:'point',
                                spatialReference: SpatialReference.WebMercator
                            });

            featSet.features.push(firstStop);
            featSet.features.push(lastStop);
            var stopsJson = featSet.toJSON();

            this.opt.query['stops'] = JSON.stringify(stopsJson);

            if (elevator) {
                this.restrictionValue = 'ProhibitStairs';
            } else {
                this.restrictionValue = 'ProhibitElevators';
            }
            this.opt.query['restrictionAttributeNames'] =  this.restrictionValue;
            esriRequest(this.routeUrl, this.opt).then(lang.hitch(this, this.showRoute), this.errRoute);
        },

        //Adds the solved route to the map as a graphic
        showRoute: function(response) {

            var feat = response.data.routes.features[0];

            if (this.gphLyrView.visible === false) {
                this.gphLyrView.visible = true;
            }

            var polyLn = new Polyline({
                                        hasZ: true,
                                        paths: feat.geometry.paths,
                                        spatialReference: SpatialReference.WebMercator
                                    });

            var rte = new Graphic({
                geometry: polyLn
              });

            if (this.restrictionValue === 'ProhibitElevators') {
                rte.symbol = this.routeStairSymbol;
            } else {
                rte.symbol = this.routeElevatorSymbol;
            }
            this.gphLyr.graphics.add(rte);

            var walkTm = feat.attributes.Total_WalkTime.toFixed(2);
            var decSec = walkTm.substring(walkTm.indexOf(".")); //include decimal
            var sec = Math.round(Number(decSec) * 60);

            sec = sec < 10? '0' + sec : sec; //add leading zero

            var min = walkTm.substring(0, walkTm.indexOf("."));

            var attr = { "WalkTime":  min + ":" + sec,
                         "RouteLength" : feat.attributes.Total_Length.toFixed(2)
                        };

            //zoom to route extent
            var ext = polyLn.extent.expand(1.25);
            this.view.goTo({
                  target: ext,
                  tilt : 35
                });

            topic.publish("route/complete", attr);
        },

        _getProjectedGeom: function(geom) {
            var targetGeom = geom;
            if (!targetGeom.spatialReference.isWebMercator) {
                //project
                if (webMercatorUtils.canProject(targetGeom.spatialReference, this.view.spatialReference)) {
                    targetGeom = webMercatorUtils.project(targetGeom , this.view.spatialReference);
               }
            }

            // when POI is projected from wgs84 to mercator, z is dropped
            if (!targetGeom.hasZ) {
                // create new point with only needed properties
                var projPt = new Point({
                                    hasZ: true,
                                    x: targetGeom.x,
                                    y: targetGeom.y,
                                    z: 0,
                                    spatialReference: SpatialReference.WebMercator
                                });
                targetGeom = projPt;
            }

            return targetGeom;

        },

        clearRouting: function() {
            this.gphLyr.removeAll();

        },

        errRoute: function (err) {
            console.log(err);
            topic.publish("route/error", err);
        }
    });
});
