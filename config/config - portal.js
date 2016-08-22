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
        portalUrl: 'http://3dscenedev.esri.com/portal',

        //WEB SCENE ID
        webSceneId: "4862886fe8264e79bbda02c08b4d98c2",

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
        routeTaskUrl: 'http://3dscenedev.esri.com/arcgis/rest/services/CampusViewer3D/CampusRouteLayer1m_Evac_v2/NAServer/Route',

    	//SEARCH INFO
        primaryQueryUrl: 'http://3dscenedev.esri.com/arcgis/rest/services/Hosted/BuildingInteriorSpacePt_ET_Evac_Global2/FeatureServer/0',
        primaryQueryFields: ["longname", "known_as_n"],
        primaryOutFields:["objectid", "longname", "shortname", "floor", "known_as_n", "email", "extension", "location", "building", "spacetype" ],
        primaryPlaceholder: "Search for rooms or people",
        primaryName: "Rooms and People",
        primarysuggestionTemplate: "{known_as_n} ({longname})",
        primaryObjectIDField: "objectid",

        // ANY FIELD NAME REFERENCED IN THE NEXT FOUR SECTIONS IS FOR DISPLAYING INFORMATION ONLY.
        // THE FIELD NAME SHOULD HAVE ALREADY BEEN SPECIFIED IN 'primaryOutFields'
        // IN THE 'SEARCH INFO' SECTION ABOVE.

        // DISPLAY FIELDS FOR SELECTED SEARCH RESULTS
        fromSearchDisplayField: "known_as_n",
        fromSearchDisplayField_Alternate: "longname",

        toSearchDisplayField: "known_as_n",
        toSearchDisplayField_Alternate: "longname",

        // OFFICE CARD INFO
        officeCardSpaceTypeField: "spacetype",
        officeCardLongNameField: "longname",
        officeCardEmployeeNameField: "known_as_n",
        officeCardEmailField: "email",
        officeCardExtensionField: "extension",

        // UNIQUE RENDERER FIELD - this field is used by renderer to highlight the selected result
        spaceLayerFieldForRenderer: "longname",

        // FIELD SPECIFYING FLOOR NUMBER
        floorField: "floor",

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
        // Info about layer and fields to display for a slide in the crossbar
        // slide name: [{layer1 name and fields info} , {layer2 name and fields info}]
        layersForWebSlide: {
            //'Home':
            //'Interior':
            'Visitor': [
                        {   label: 'Points of Interest',
                            url:'http://3dscenedev.esri.com/arcgis/rest/services/Hosted/Visitor_Points_of_Interest_Esri/FeatureServer/0',
                            fields: ["locationname", "locationtype"]
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
                                    url: 'http://3dscenedev.esri.com/arcgis/rest/services/Hosted/EvacuationMeetingLocations/FeatureServer/0',
                                    fields: ['incidentnm']
                                }
                                //add more layers/fields
                             ]
        }


    };
});
