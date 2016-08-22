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
define(function() {

    return {

        //PORTAL URL
        portalUrl: '//www.arcgis.com',

        //WEB SCENE ID
        webSceneId: "65f45cdfd7a04dbb9b0863880fe8c921",

        // PROXY
        // proxyUrlPrefix: "",
        // proxyUrl: "",

        //FLOORPICKER
        groupLayers: {
        	1: "First Floor",
        	2: "Second Floor",
        	3: "Third Floor"
        },

        // ROUTING
        routeTaskUrl: 'http://3dcampus.arcgis.com/arcgis/rest/services/Routing/EsriCampusRouteLayer1m/NAServer/Route',

    	//SEARCH INFO
        primaryQueryUrl: 'http://services2.arcgis.com/z2tnIkrLQ2BRzr6P/arcgis/rest/services/BuildingInteriorSpacePt_ET/FeatureServer/0',
        primaryQueryFields: ["LONGNAME", "KNOWN_AS_N"],
        primaryOutFields:["OBJECTID", "LONGNAME", "SHORTNAME", "FLOOR", "KNOWN_AS_N", "EMAIL", "EXTENSION", "LOCATION", "BUILDING", "SPACETYPE" ],
        primaryPlaceholder: "Search for rooms or people",
        primaryName: "Rooms and People",
        primarysuggestionTemplate: "{KNOWN_AS_N} ({LONGNAME})",
        primaryObjectIDField: "OBJECTID",

        // ANY FIELD NAME REFERENCED IN THE NEXT FOUR SECTIONS IS FOR DISPLAYING INFORMATION ONLY.
        // THE FIELD NAME SHOULD HAVE ALREADY BEEN SPECIFIED IN 'primaryOutFields'
        // IN THE 'SEARCH INFO' SECTION ABOVE.

        // DISPLAY FIELDS FOR SELECTED SEARCH RESULTS
        fromSearchDisplayField: "KNOWN_AS_N",
        fromSearchDisplayField_Alternate: "LONGNAME",

        toSearchDisplayField: "KNOWN_AS_N",
        toSearchDisplayField_Alternate: "LONGNAME",

        // OFFICE CARD INFO
        officeCardSpaceTypeField: "SPACETYPE",
        officeCardLongNameField: "LONGNAME",
        officeCardEmployeeNameField: "KNOWN_AS_N",
        officeCardEmailField: "EMAIL",
        officeCardExtensionField: "EXTENSION",

        // UNIQUE RENDERER FIELD - this field is used by renderer to highlight the selected result
        spaceLayerFieldForRenderer: "LONGNAME",

        // FIELD SPECIFYING FLOOR NUMBER
        floorField: "FLOOR",

        //NAMING CONVENTION FOR INTERIOR SPACES/ROOMS(TO SET POPUPTEMPLATES ONLY FOR ROOMS AND NOT WALLS/DOORS IN A GROUP LAYER)
        roomLayerStringIdentifier: " Spaces",
        wireframeStringIdentifier: "Wireframe",
        treeStringIdentifier: "Tree",
        textureStringIdentifier: "Texture",

        // SYMBOLS
        roomSelectionColor: [231, 76, 60],  //rgb value

        // stairs route
        routeStairPathColor: [0,183,0],
        routeStairPathSize: 0.5,

        // elavator route
        routeElevatorPathColor: [0,0,255],
        routeElevatorPathSize: 0.5,

        // start/stop symbols
        routePointSymShape: "tetrahedron",
        routePointSymColor: [0, 255, 255],
        routePointSymWidth: 1,
        routePointSymHeight: 2,


        // ZOOM-IN LEVEL FOR SEARCH
        viewZoom: 21,
        viewTilt: 35,

        // CROSSBAR SLIDES/LAYERS
        // format is - slide name: array of objects containing layername and its fields
        // // slide name: [{layer1 name and fields info} , {layer2 name and fields info}]
        layersForWebSlide: {
            //'Home':
            //'Interior':
            'Visitor': [
                        {   label: 'Points of Interest',
                            url:'http://services2.arcgis.com/z2tnIkrLQ2BRzr6P/ArcGIS/rest/services/Visitor_Points_of_Interest_Esri/FeatureServer/0',
                            fields: ["LocationName", "LocationType"]
                        }
                        //,
                        // {   label: 'layer1',
                        //     url:"layer1 url",
                        //     fields: "locationname"
                        // }

                        //add more layers/fields
                    ],
            'Evacuation Plan': [
                                {
                                    label: 'Evacuation Locations',
                                    url: 'http://services2.arcgis.com/z2tnIkrLQ2BRzr6P/ArcGIS/rest/services/EvacuationAreaPt/FeatureServer/0',
                                    fields: ['INCIDENTNM']
                                }
                                //add more layers/fields
                             ]
        }


    };
});
