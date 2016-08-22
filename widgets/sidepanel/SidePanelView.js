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
    'dojo/_base/array',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/dom-attr',
    'dojo/query',
    'dojo/NodeList-manipulate',
    'dojo/on',
    'dojo/NodeList-dom',
    "dojo/topic",
    'dojo/fx/easing',
    'dojo/_base/fx',
    'dojo/keys',

    "dijit/_WidgetBase",
    'dijit/_TemplatedMixin',

    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "esri/layers/FeatureLayer",
    "campussearch/CampusSearch",

    'dojo/text!./SidePanelView.html'],

function(declare, lang, array, dom, domConstruct, domStyle, domClass, domAttr, dojoQuery, dojoManip, dojoOn, nld, topic, easing, fx, keys,
    _WidgetBase, _TemplatedMixin, QueryTask, Query, FeatureLayer, CampusSearch,
    template) {

    return declare([_WidgetBase, _TemplatedMixin], {

        templateString: template,
        id: 'side-panel',
        cards: ['building',
                'route',
                'office',
                'poi',
                'info'
               ],
        isRouting: false,
        isElevatorRoute: false,

        constructor: function(options) {
            this.inherited(arguments);
            this.view = options.view;
            this.config = options.config;
            this.containerDiv = options.containerDiv;
            this.currentCard = "";
        },

        postCreate: function() {
            this.inherited(arguments);
            this._addEventListeners();

            this.fromSearch = new CampusSearch({
                    view: this.view,
                    containerDiv: this.route_FromNameNode,
                    config:  this.config
                    });
            this.fromSearch.startup();

            this.toSearch = new CampusSearch({
                    view: this.view,
                    containerDiv: this.route_ToNameNode,
                    config:  this.config
                    });
            this.toSearch.startup();


            // This function is for DEV use only
            this._addDevKeyListeners();
        },

        _addEventListeners: function() {
            var thisNode = this;
            dojoOn(this.domNode, dojoOn.selector(".js-left-panel-close", 'click'), function() {
                thisNode.close('clear');
            });
            dojoOn(this.domNode, dojoOn.selector(".sp-swap-btn", 'click'), lang.hitch(this, this.swapFromTo));

            dojoOn(this.domNode, dojoOn.selector(".js-route-toggle", 'click'), lang.hitch(this, this._toggleRouteType));
        },

        // This function is for DEV use only
        _addDevKeyListeners: function() {
            //var thisNode = this;
            // dojoOn(document, 'keyup', function(event) {
            //     if (event.keyCode === 48) { // '0' key
            //         thisNode.open('building');
            //     } else if (event.keyCode === 49) { // '1' key
            //         thisNode.open('route');
            //     } else if (event.keyCode === 50) { // '2' key
            //         thisNode.open('office');
            //     } else if (event.keyCode === 51) { // '3' key
            //         thisNode.open('poi');
            //     } else if (event.keyCode === 52) { // '4' key
            //         thisNode.showLoading();
            //         thisNode.hideMeasures();
            //     } else if (event.keyCode === 53) { // '5' key
            //         thisNode.hideLoading();
            //         thisNode.showMeasures();
            //     }
            // });
        },

        startup: function() {
            this.inherited(arguments);
            this.placeAt(this.containerDiv);
        },

        // this function will primarily be used by the InfoBtn to open and close correctly during route mode
        toggle: function() {
            var panelNode = this.domNode;

            // decide if we are opening or closing the panel
            if (domClass.contains(panelNode, 'panel-open')) {
                this.close();
            } else {
                this.open('route');
                this.currentCard = 'route';
            }
        },

        // function to open the side panel
        open: function(cardValue) {
            var panelNode = this.domNode,
                panelChildren = dojoQuery('.js-left-panel-move'),
                hiddenSearch = dojoQuery('.js-left-panel-move .esri-search');

            // if the card is NOT Info & NOT Route then we hide the btn
            // Info & Route are special cases that will change the InfoBtn
            if (cardValue !== 'info' && cardValue !== 'route') {
                topic.publish("infoBtn/hide");
                hiddenSearch.removeClass('is-hidden');
                this.isRouting = false;
            }
            // if the card is Route then we need to set the routing flag
            // and call the InfoBtn update
            else if (cardValue === 'route') {
                this.isRouting = true;
                hiddenSearch.addClass('is-hidden');
                topic.publish("infoBtn/routeInProgress", { status: "open" });
            }

            // Check if the panel is open or closed
            // if closed then open it
            if (!domClass.contains(panelNode, 'panel-open')) {
                domClass.add(panelNode, 'panel-open');
                panelChildren.addClass('panel-open');
            } else { // if it's open then switch the card by first clearing out the panel
                array.forEach(this.cards, function(card, i) {
                    dojoQuery('.js-card-' + card).addClass('is-hidden');
                });
            }

            // update the card in the panel
            dojoQuery('.js-card-' + cardValue).removeClass('is-hidden');
        },

        // function to close the side panel
        close: function(status) {
            var hiddenSearch = dojoQuery('.js-left-panel-move .esri-search');

            dojoQuery('.panel-open').removeClass('panel-open');

            // iterate through and hide all the cards
            array.forEach(this.cards, function(card, i) {
                dojoQuery('.js-card-' + card).addClass('is-hidden');
            });

            // if the status is to clear than set the routing flag to false to end routing mode
            if (status === 'clear') {
                topic.publish("infoBtn/routeInProgress", { status: "clear" });
                this.isRouting = false;

                this._clearRoutingInfo();
                this.hideRouteType();

                hiddenSearch.removeClass('is-hidden');
                topic.publish('route/close');

            }

            // if the routing flag is set then when we close the side panel we need to
            // with the expand arrows in info tab otherwise we rest the tab to the i icon
            if (this.isRouting === true) {
                topic.publish("infoBtn/routeInProgress", { status: "close" });
            } else {
                topic.publish("infoBtn/reset");
            }
        },

        handleSearchInfo: function(evt) {
            var results = evt.results[0].results[0].feature;

            switch (evt.srcElement.id) {
                case 'search':
                    this.from_Info = null;
                    this.to_Info = null;

                    this.to_Info = results;
                    this._populateOfficeCard();

                    break;
                case 'fromSearch':
                    this.from_Info = results;
                    this.fromSearch.searchWidget.clear();
                    this._populateRouteCard('from');


                    break;
                case 'toSearch':
                    this.to_Info = results;
                    this.toSearch.searchWidget.clear();
                    this._populateRouteCard('to');
                    break;
            }

        },

        handleClickInfo:  function(feat) {
            this.to_Info = feat;
            if (this.isRouting) {
                this._populateRouteCard('to');
            } else {
                this._populateOfficeCard();
            }
        },

        _populateOfficeCard: function() {

            var values = this.to_Info.attributes;
            this.office_SpaceTypeNode.innerHTML  = values[this.config.officeCardSpaceTypeField];
            this.office_LongNameNode.innerHTML  = values[this.config.officeCardLongNameField];
            this.office_EmployeeNameNode.innerHTML = values[this.config.officeCardEmployeeNameField];
            this.office_EmailNode.innerHTML = values[this.config.officeCardEmailField];
            this.office_EmailNode.href = "mailto:" + values[this.config.officeCardEmailField];
            this.office_ExtensionNode.innerHTML = 'ext. ' + (values[this.config.officeCardExtensionField]? values[this.config.officeCardExtensionField] : "");

            this.open('office');
            this.currentCard = 'office';
        },

        _populateRouteCard: function(flag, altDisplayVal) {

            var fromPlaceholderTxt = dojoQuery('#fromSearch_input'),
                toPlaceholderTxt = dojoQuery('#toSearch_input');

            switch (flag) {

                case 'from':
                    var tmpFrom = this.from_Info.attributes[this.config.fromSearchDisplayField];
                    if (!tmpFrom) {
                        tmpFrom = this.from_Info.attributes[this.config.fromSearchDisplayField_Alternate];
                    }

                    fromPlaceholderTxt.attr("placeholder", tmpFrom);
                    break;
                case 'to':
                    var tmpTo = this.to_Info.attributes[this.config.toSearchDisplayField];
                    if (!tmpTo) {
                        tmpTo = this.to_Info.attributes[this.config.toSearchDisplayField_Alternate];
                    }
                    if (!tmpTo) {
                        tmpTo = altDisplayVal;
                    }

                    toPlaceholderTxt.attr("placeholder", tmpTo);
                    break;
            }

            // as soon as both from/to has been specified , call routing with stairs
            if ((this.from_Info) && (this.to_Info)) {
                this._startRouting(false);
            }

        },

        _office_RouteBtnClick: function() {
            this._populateRouteCard('to');
            this.open('route');
            this.currentCard = 'route';
        },

        _onMyOfficeBtnClick: function() {

        },

        _startRouting:  function(elevator) {
            //true = elevator, false = stair
            topic.publish("route/solve", this.from_Info, this.to_Info, elevator);
            this.showLoading();
            this.hideRouteType();
            this.hideMeasures();
            this.route_Distance.innerHTML = "";
            this.route_Time.innerHTML = "";

        },

        populatePOI: function(lyrInfo) {

            //console.log(lyrInfo);

            // clear old values
            domConstruct.empty(this.poiCardNode);

            var queryTask = new QueryTask({
                    url: lyrInfo['url']
            });

            var query = new Query();
            query.returnGeometry = true;
            query.outFields = ["*"];
            query.where = "1=1";
            //query.returnZ = true;
            query.multipatchOption = "xyFootprint";


            queryTask.execute(query).then(lang.hitch(this, function(result) {

                if (result.features.length > 0) {

                    result.features.forEach(lang.hitch(this, function(feat, idx) {

                         this._populatePOICard(feat, idx, lyrInfo['fields']);
                    }));

                    this.open('poi');
                    this.currentCard = 'poi';
                }
            }));
        },

        _populatePOICard: function(feat, idx, flds) {

            var headingID = "poiHeading_" + idx;
            var collapseID = "poiCollapse_" + idx;

            var mainNode = domConstruct.create("div", {
                class: "panel sp-poi__panel"
            }, this.poiCardNode);

            //header
            var headingNode = domConstruct.create("div", {id: headingID,}, mainNode);
            //domAttr.set(headingNode, "role", "tab");

            var anchorNode = domConstruct.create("a", {
                class: "sp-poi__collapse-btn"
            }, headingNode);

            var poiHeadNode = domConstruct.create("div", {class: "sp-poi__head"}, anchorNode);

            var titleNode = domConstruct.create("h4", {
                class: "sp-info__title sp-info__title--poi",
                innerHTML: feat.attributes[flds[0]]
            }, poiHeadNode);

            //domConstruct.place("<i class='fa fa-laptop'></i>", titleNode, "first");

            //collapse panel
            var collapseNode = domConstruct.create("div", {
                // id: collapseID,
                // class: "",
                // role: "tabpanel",
                // "aria-labelledby": headingID
            }, mainNode);

            var contentNode = domConstruct.create("div", {class: "sp-poi__content"}, collapseNode);

            // domConstruct.create("p", {
            //     innerHTML: feat.attributes[flds[1]],
            //     class: "sp-info__desc"
            // }, contentNode);

            domConstruct.create("button", {
                innerHTML: ' Route',
                id: 'btn' + headingID,
                class: "btn btn-primary sp-btn"
            }, contentNode);

            dojoOn(dom.byId('btn' + headingID), "click", lang.hitch(this, this._clickPOIRoute, feat, feat.attributes[flds[0]]));

        },

        _clickPOIRoute: function (feat, altDisplayFld) {
            this.to_Info = feat;
            this._populateRouteCard('to', altDisplayFld);
            this.open('route');
            this.currentCard = 'route';

        },

        _clearRoutingInfo: function () {
            this.from_Info = null;
            this.to_Info = null;

            var fromPlaceholderTxt = dojoQuery('#fromSearch_input'),
                toPlaceholderTxt = dojoQuery('#toSearch_input');

            if (fromPlaceholderTxt) {
                fromPlaceholderTxt.attr("placeholder", "");
            }

            if (toPlaceholderTxt) {
                toPlaceholderTxt.attr("placeholder", "");
            }

            topic.publish('route/close');
        },

        populateRouteInfo: function(attr) {
            if (attr) {
                var distanceString = attr['RouteLength'].toString() + ' m',
                    timeVals = attr['WalkTime'].toString().split(":"),
                    timeString = timeVals[0] + ' min ' + timeVals[1] + ' sec';

                console.log(timeVals);
                this.route_Distance.innerHTML = distanceString;
                this.route_Time.innerHTML = timeString;
            } else {
                //error in routing
                this.route_Distance.innerHTML = "";
                this.route_Time.innerHTML = "";
            }
            this.hideLoading();
            this.showRouteType();
            this.showMeasures();
        },

        swapFromTo: function () {
            var tmpStart = this.from_Info;
            var tmpDest = this.to_Info;

            // resetting from/to null so that route 'solve' is not called with partially set info
            this.from_Info = null;
            this.to_Info = null;

            this.from_Info = tmpStart;
            this._populateRouteCard('from');
            this.to_Info = tmpDest;
            this._populateRouteCard('to');

        },

        _toggleRouteType: function() {
            var routeTypeBtn = dojoQuery('.js-route-toggle');

            if (this.isElevatorRoute === true) {
                this.isElevatorRoute = false;
                this._startRouting(false); //stairs
                routeTypeBtn.innerHTML('Need an elevator?');
                routeTypeBtn.removeClass('is-selected');
            } else {
                this.isElevatorRoute = true;
                this._startRouting(true);   //elev
                routeTypeBtn.innerHTML('Prefer the stairs?');
                routeTypeBtn.addClass('is-selected');
            }
        },

        showLoading: function() {
            dojoQuery('.js-route-loading').removeClass('is-hidden');
            dojoQuery('.js-route-toggle').attr('disabled', true);
        },

        hideLoading: function() {
            dojoQuery('.js-route-loading').addClass('is-hidden');
            dojoQuery('.js-route-toggle').attr('disabled', false);
        },

        showMeasures: function() {
            dojoQuery('.js-route-measures').removeClass('is-hidden');
        },

        hideMeasures: function() {
            dojoQuery('.js-route-measures').addClass('is-hidden');
        },

        showRouteType: function() {
            dojoQuery('.js-route-toggle').removeClass('is-hidden');
        },

        hideRouteType: function() {
            dojoQuery('.js-route-toggle').addClass('is-hidden');
        }

    });
});
