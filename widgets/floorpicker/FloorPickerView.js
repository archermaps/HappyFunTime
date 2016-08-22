/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/*
| Copyright 2016 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
| http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/dom-attr',
    'dojo/query',
    'dojo/on',
    'dojo/NodeList-dom',
    "dojo/topic",
    "dojo/promise/all",

    "dijit/_WidgetBase",
    'dijit/_TemplatedMixin',

    "esri/views/layers/LayerView",

    'dojo/text!./FloorPickerView.html'],

function(declare, lang, dom, domConstruct, domStyle, domClass, domAttr, dojoQuery, dojoOn, nld, topic, all,
    _WidgetBase, _TemplatedMixin,
    LayerView,
    template) {

    return declare([_WidgetBase, _TemplatedMixin], {

        templateString: template,
        baseClass: 'vertical',
        id: 'floorPicker',
        availFloors: ['1', '2', '3', 'All'] ,

        constructor: function(options) {
            this.inherited(arguments);
            this.view = options.view;
            this.map = this.view.map;
            this.config = options.config;
            this.containerDiv = options.containerDiv;
            this.grpLayerViewsInfo = {};
            this.floorLayerPromises = [];
        },

        postCreate: function() {
            this.inherited(arguments);
            this.constructUI();
            this._getLayerInfo();
        },

        _getLayerInfo: function() {
            var self = this;

            var grp = this.config.groupLayers;
            var flrNamesArr = Object.keys(grp).map(function (key) {
                return grp[key].toLowerCase();
            });

            var allLyrs = this.view.map.layers.items;
            for (var i = 0; i < allLyrs.length; i++) {
                var lyrInfo = allLyrs[i];
                //group layer
                if (lyrInfo.hasOwnProperty('layers')) {
                    // group floor lyr
                    if (flrNamesArr.indexOf(lyrInfo.title.toLowerCase()) > -1) {
                        // moving promise to another function - not good to create any functions [ then() etc] within loop
                        this._handleLayerViewPromises(lyrInfo);
                    }
                }
            }

            all(self.floorLayerPromises).then(function(lyrViewsArr) {
                lyrViewsArr.forEach(function(lyrView) {
                    // store the layerviews with the floor numbers
                    for (var flr in grp){
                        if (grp.hasOwnProperty(flr)) {
                            var grpName = grp[flr].toLowerCase();
                            if (grpName === lyrView.layer.title.toLowerCase()) {

                                self.grpLayerViewsInfo[flr] = lyrView;
                                break;
                            }
                        }
                    }
                });
              }, function(err) {
                console.log(err);
              });
        },

        _handleLayerViewPromises: function(lyrInfo) {
            //layerView may not be initialized - also add to 'promises' array to get consolidated results
            this.floorLayerPromises.push(
                this.view.whenLayerView(lyrInfo)
                    .then(function(layerView) {
                        return layerView;
                    } , function(error) {
                        console.log("error " + error);
                    })
            );
        },

        startup: function() {
            this.inherited(arguments);
            this.placeAt(this.containerDiv);
            //this.addEventListeners();
        },

        constructUI: function() {
            var self = this;

            // clear existing picker
            domConstruct.empty(this.floorsDiv);

            if (this.availFloors.length > 5) {
                domClass.remove(this.scrollUp, 'hide disabled');
                domClass.remove(this.scrollDown, 'hide disabled');
                domClass.add(this.domNode, 'set-height');
            } else {
                domClass.add(this.scrollUp, 'hide');
                domClass.add(this.scrollDown, 'hide');
                domClass.remove(this.domNode, 'set-height');
            }

            // construct button for each floor
            for (var i = 0 ; i < this.availFloors.length ; i++) {
                var floorNum = this.availFloors[i];

                domConstruct.create('div', {
                    'class': i === this.availFloors.length - 1 ? 'btn is-selected' : 'btn',
                    'innerHTML': floorNum,
                    'data-floornum': floorNum,
                    'click': lang.hitch(self, self.floorButtonClick, floorNum)
                }, self.floorsDiv, 'first');
            }

        },

        floorButtonClick: function(flr) {
            // highlight selected button
            this.updateHighlightedFloor(flr);

            topic.publish("update-nonFloorLayers");

            for (var i in this.grpLayerViewsInfo){
                if (this.grpLayerViewsInfo.hasOwnProperty(i)) {

                    if ((flr === 'All') || (flr === i)) {
                        // make it visible
                        this.grpLayerViewsInfo[i].visible = true;
                        this.cascadeGroupSettings(this.grpLayerViewsInfo[i], 'visible', true);
                    } else {
                        this.grpLayerViewsInfo[i].visible = false;
                        this.cascadeGroupSettings(this.grpLayerViewsInfo[i], 'visible', false);
                    }
                }
            }
        },


        //temp function until 4.1
        cascadeGroupSettings: function(groupLayerView, prop, val) {
            groupLayerView.layerViews.forEach(function(lyr){
                lyr[prop] = val;
            });

        },

        updateHighlightedFloor: function(flr) {
            // highlight selected button
            dojoQuery('.floors-div .btn').forEach(function(node) {
                domClass.toggle(node, 'is-selected', domAttr.get(node, 'data-floornum') === flr);
            });
        }

    });
});
