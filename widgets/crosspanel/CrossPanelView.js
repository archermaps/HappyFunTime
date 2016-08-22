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
    'dojo/mouse',
    'dojo/keys',

    "dijit/_WidgetBase",
    'dijit/_TemplatedMixin',

    'dojo/text!./CrossPanelView.html'],

function(declare, lang, array, dom, domConstruct, domStyle, domClass, domAttr, dojoQuery, dojoManip, dojoOn, nld, topic, mouse, keys,
    _WidgetBase, _TemplatedMixin,
    template) {

    return declare([_WidgetBase, _TemplatedMixin], {

        templateString: template,
        id: 'cross-panel',

        constructor: function(options) {
            this.inherited(arguments);
            this.view = options.view;
            // this.map = this.view.map;
            this.containerDiv = options.containerDiv;
        },

        postCreate: function() {
            this.inherited(arguments);
        },

        startup: function() {
            this.inherited(arguments);
            this.placeAt(this.containerDiv);

            this._setupSlides();
            this._setDimensions();
            this._noticeReveal();
        },

        // function that runs calculations for dynamic height and length of Cross Panel
        _setDimensions: function() {
            // Cross panel height
            var crossPanel = dojoQuery('.js-cross-panel'),
                crossPanelHeight = 115,

                // Vertical Dimensions
                layerMenu = dojoQuery('.js-layer-menu'),
                layers = dojoQuery('.js-layer-item'),
                layerHeight = 50,
                layerMenuHeight = layerHeight * layers.length,

                // Horizontal Dimensions
                slideBar = dojoQuery('.js-slide-bar'),
                slides = dojoQuery('.js-slide-item'),
                slideWidth = 85,
                slideBarWidth = slideWidth * slides.length,
                slideBarPad = slides.length <= 2 ? 1 : 3,

                crossPanelArrows = dojoQuery('.js-cp-arrow');

            if (layerMenuHeight === 0) {
                layerMenuHeight = 100;
            }

            // Set Height/Width scaling event
            crossPanel.on(mouse.enter, function() {
                //crossPanel.style('padding-right', (slideBarWidth + slideBarPad * slides.length) + 'px');
                crossPanel.style('padding-right', '300px');
                //crossPanel.style('padding-top', layerMenuHeight + 'px');
                crossPanel.style('padding-top', '200px');

                //layerMenu.style('height', layerMenuHeight + 'px');
                layerMenu.style('height', '200px');

                //slideBar.style('width', (slideBarWidth + 5 * slides.length) + 'px');
                slideBar.style('width', '300px');

                crossPanelArrows.addClass('is-hidden');

            });

            // Return the Cross Panel dimensions to the default
            crossPanel.on(mouse.leave, function() {
                crossPanel.style('padding', '6px 32px 6px 6px');
                layerMenu.style('height', '0');
                slideBar.style('width', '0');
                crossPanelArrows.removeClass('is-hidden');

            });
        },

        _setDimensionHeight: function() {
            // Vertical Dimensions
            var layerMenu = dojoQuery('.js-layer-menu'),
            layers = dojoQuery('.js-layer-item'),
            layerHeight = 50,
            layerMenuHeight = layerHeight * layers.length;

            //layerMenu.style('height', layerMenuHeight + 'px');
            layerMenu.style('height', '200px');
        },

        // function that runs the initial reveal of the arrows
        _noticeReveal: function() {
            var crossPanelArrows = dojoQuery('.js-cp-arrow');

            setTimeout(function() {
                crossPanelArrows.addClass('is-revealed');
            }, 1000);

            setTimeout(function() {
                crossPanelArrows.addClass('is-faded');
            }, 2000);
        },

        _setupSlides: function() {
            var slideText = dojoQuery('.js-selected-slide-text'),
                slideImg = dojoQuery('.js-selected-slide-img'),
                slides = this.view.map.presentation.slides;
            //loop through each slide in the collection
            slides.forEach(lang.hitch(this, function(slide, i) {

                domConstruct.create("li", {
                    id: slide.id,
                    class: "cp-slide__item js-slide-item"
                }, this.cpSlideList);

                domConstruct.create("p", {
                    innerHTML: slide.title.text,
                    class: "cp-slide__text"
                }, dom.byId(slide.id));


                domConstruct.create("img", {
                    //src: 'images/ext-layer.jpg',
                    src: slide.thumbnail.url,
                    //style: { background: 'url(slide.thumbnail.url)' },
                    id: slide.id + "_img",
                    title: slide.title.text,
                    class:"cp-slide__img"
                }, dom.byId(slide.id)); //Place the image inside the new <span> element
                //dom.byId(slide.id).innerHTML += "<br>";


                dojoOn(dom.byId(slide.id), "click", lang.hitch(this, this._clickSlide));

                //Change the cursor to a pointer style when hovering the mouse
                //over a slide's thumbnail image.
                // on(dom.byId(slide.id), "mouseover", function() {
                //     dom.byId(slide.id).style.cursor = "pointer";
                // });

                // Set the initial slide text/img in the panel
                if (i === 0) {
                    slideText.innerHTML(slide.title.text);
                    slideImg.attr('src', slide.thumbnail.url);
                }
            }));
           // console.log(slides);
           this._changeLayers(slides.items[0].title.text);

        },

        _clickSlide: function(clickEvt) {
            var slideId = clickEvt.currentTarget.id;
            this._changeSlide(slideId);
        },

        _changeSlide: function(slideId) {
            var slideText = dojoQuery('.js-selected-slide-text'),
                slideImg = dojoQuery('.js-selected-slide-img');

            var slide = this.view.map.presentation.slides.find(function(item){
                if(item.id.toLowerCase().indexOf(slideId.toLowerCase()) > -1) {
                    return item;
                }
            });

            slide.applyTo(this.view);
            this._changeLayers(slide.title.text);

            slideText.innerHTML(slide.title.text);
            slideImg.attr('src', slide.thumbnail.url);

        },

        _changeLayers: function(slideText) {

            var layerList = dojoQuery('.js-layer-menu');
            //  console.log(layerList);

            domConstruct.empty(this.cpLayerList);

            var lyrsWebSlide = this.config.layersForWebSlide[slideText];

            if (lyrsWebSlide) {
                layerList.removeClass('is-hidden');

                //lyrsWebSlide is an array of objects with layername/fields
                lyrsWebSlide.forEach(lang.hitch(this,function(item) {
                    var lyrName = item['label'];
                    var flds = item['fields'];

                    var orderFlds = {};
                    flds.forEach(function(fld,idx) {
                        orderFlds[idx] = fld;
                    });

                    var lyrInfo = { 'fields': orderFlds, 'url': item['url'] };

                    domConstruct.create("li", {
                                    id: lyrName,
                                    class: "cp-layer__item js-layer-item",
                                    innerHTML: lyrName
                                }, this.cpLayerList, 'first');

                    dojoOn(dom.byId(lyrName), "click", lang.hitch(this, this._clickLayer, lyrInfo));

                }));
            } else {
                layerList.addClass('is-hidden');
            }

            this._setDimensionHeight();
            this._setDimensions();
        },

        _clickLayer: function(lyrInfo) {
            // var layerName = clickEvt.currentTarget.id;
            // console.log(layerName);
            topic.publish('crosspanel/layer-click', lyrInfo);
        }

    });
});
