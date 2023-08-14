/***
   egd_sliprate.js
***/

var EGD_SLIPRATE = new function () {
    window.console.log("in EGD_SLIPRATE..");

    // complete set of sliprate layers, one marker layer for one site, 
    // setup once from viewer.php
    this.egd_layers;
    this.egd_markerLocations = [];

    // searched layers being actively looked at -- result of a search
    this.egd_active_layers = new L.FeatureGroup();
    this.egd_markerLocations = [];
    this.egd_active_gid = [];

    // selected some layers from active layers
    // to be displayed at the metadata_table
    this.egd_selected_gid = [];

    // locally used, floats
    var egd_minrate_min=undefined;
    var egd_minrate_max=undefined;
    var egd_maxrate_min=undefined;
    var egd_maxrate_max=undefined;

    var site_colors = {
        normal: '#006E90', // original
        selected: '#B02E0C',
        abnormal: '#00FFFF',
    };

    var site_marker_style = {
        normal: {
//          color: site_colors.normal,
            color: "white",
            fillColor: site_colors.normal,
            fillOpacity: 1,
            radius: 3,
            riseOnHover: true,
            weight: 1,
        },
        selected: {
//          color: site_colors.selected,
            color: "white",
            fillColor: site_colors.selected,
            fillOpacity: 1,
            radius: 3,
            riseOnHover: true,
            weight: 1,
        },
        hover: {
            fillOpacity: 1,
            radius: 10,
            weight: 2,
        },
    };

    this.defaultMapView = {
        coordinates: [37.73, -119.89],
        zoom: 6 
    };

    this.searchType = {
        none: 'none',
        faultname: 'faultname',
        sitename: 'sitename',
        latlon: 'latlon',
        minrate: 'minrate',
        maxrate: 'maxrate'
    };

    var sliprate_csv_keys= {
fault_name: 'Fault Name',
fault_id: 'NSHM23 Fault ID',
state: 'State',
site_name: 'Site Name',
egd_id: 'EGD ID',
sliprate_id: 'NSHM23 Slip Rate ID',
longitude: 'Longitude',
latitud: 'Latitude',
dist_to_cfmfault: 'Distance To Nearest CFM Fault (km)',
cfm6_objectname: 'CFM6.0 Object Name',
data_type: 'Data Type',
observation: 'Observation',
pref_rate: 'Preferred Rate',
low_rate: 'Low Rate',
high_rate: 'High Rate',
rate_unct: 'Rate Uncertainty',
rate_type: 'Rate Type',
rept_reint: 'ReptReint',
offset_type: 'Offset Type',
age_type: 'Age Type',
num_events: 'Num Events',
rate_age: 'Rate Age',
q_bin_min: 'Qbin Min',
q_bin_max: 'Qbin Max',
ucerf3_appb: 'UCERF3 AppB',
short_references: 'Short References',
links: 'DOI/Web Links',
full_references: 'Full References'
        };

    this.searchingType=this.searchType.none;

    var tablePlaceholderRow = `<tr id="placeholder-row">
                        <td colspan="8">Metadata for selected sliprate sites will appear here.</td>
                    </tr>`;

    this.activateData = function() {
        activeProduct = Products.SLIPRATE;
        this.showOnMap();
        $("div.control-container").hide();
        $("#egd-controls-container").show();

    };

/********** show layer/select functions *********************/

    function _makeLinks(links) {
        let rc="";
        let terms=links.split("; ");
        let sz=terms.length;
        for(let i=0; i<sz; i++) {
            if(terms[i] == "N/A") {
                rc=rc+"&nbsp;N/A";
                } else {
                rc = rc + "&nbsp;<a href=\""+terms[i]+"\"><span class=\"glyphicon glyphicon-share\"></span></a> ";
            }
        }
        return rc;
    }
    function _makeLinksWithReferences(links,refs) {
        let rc="";
        let terms=links.split("; ");
        let rterms=refs.split(";");
        let sz=terms.length;
        for(let i=0; i<sz; i++) {
            if(i!=0)
		rc=rc+"<br>";

            if(terms[i] == "N/A") {
		rc = rc+rterms[i];
                } else {
                    rc = rc + rterms[i] + "&nbsp;<a href=\""+terms[i]+"\"><span class=\"glyphicon glyphicon-share\"></span></a> ";
            }
        }
        return rc;
    }

// egd_sliprate_site_data is from viewer.php, which is the JSON 
// result from calling php getAllSiteData script
    this.generateLayers = function () {

window.console.log( "generate the initial egd_layers");
        this.egd_layers = [];
        this.egd_markerLocations = [];
        this.egd_active_markerLocations = [];

// SELECT * FROM tb ORDER BY gid ASC;
        for (const index in egd_sliprate_site_data) {
          if (egd_sliprate_site_data.hasOwnProperty(index)) {
                let gid = egd_sliprate_site_data[index].gid;
                let egd_id = egd_sliprate_site_data[index].egdid;
                let sliprate_id = egd_sliprate_site_data[index].sliprateid;
                let longitude = parseFloat(egd_sliprate_site_data[index].longitude);
                let latitude = parseFloat(egd_sliprate_site_data[index].latitude);
                let fault_name = egd_sliprate_site_data[index].faultname;
                let state = egd_sliprate_site_data[index].state;
                let site_name = egd_sliprate_site_data[index].sitename;
                let low_rate = parseFloat(egd_sliprate_site_data[index].lowrate);
                let high_rate = parseFloat(egd_sliprate_site_data[index].highrate);
                let links = egd_sliprate_site_data[index].links;
                let short_references = egd_sliprate_site_data[index].shortreferences;

                let marker = L.circleMarker([latitude, longitude], site_marker_style.normal);

                let site_info = `${fault_name}`;

marker.bindTooltip(site_info).openTooltip();
//https://stackoverflow.com/questions/23874561/leafletjs-marker-bindpopup-with-options
		  //
		 let linkstr= _makeLinks(links); 
marker.bindPopup("<strong>"+site_info+"</strong><br><strong>Low Rate: </strong>"+low_rate+"<br><strong>High Rate: </strong>"+high_rate+"<br><strong>References: </strong>"+linkstr, {maxWidth: 500});

                marker.scec_properties = {
                    idx: index,
                    active: true,
                    selected: false,
                    gid: gid,
                    egd_id: egd_id,
                    sliprate_id:sliprate_id,
                    longitude: longitude,
                    latitude: latitude,
                    fault_name: fault_name,
                    state: state,
                    site_name: site_name,
                    low_rate: low_rate,
                    high_rate: high_rate,
                    short_references: short_references,
                    links: links
		};

// all layers
                this.egd_layers.push(marker);
                this.egd_markerLocations.push(marker.getLatLng())                      
// current active layers
                this.egd_active_layers.addLayer(marker);
                this.egd_active_gid.push(gid);
                this.egd_active_markerLocations.push(marker.getLatLng())                      

                if(egd_minrate_min == undefined) {
                   egd_minrate_min = low_rate;
                   egd_minrate_max = low_rate;
                  } else {
                    if(low_rate < egd_minrate_min) {
                      egd_minrate_min=low_rate;  
                    }
                    if(low_rate > egd_minrate_max) {
                      egd_minrate_max=low_rate;
                    }
                }
                if(egd_maxrate_min == undefined) {
                   egd_maxrate_min = high_rate;
                   egd_maxrate_max = high_rate;
                  } else {
                    if(high_rate < egd_maxrate_min) {
                      egd_maxrate_min=high_rate;  
                    }
                    if(high_rate > egd_maxrate_max) {
                      egd_maxrate_max=high_rate;
                    }
                }
            }
        }

        this.gotZoomed = function (zoom) {
            if(this.egd_active_gid.length == 0) return;
	    this.egd_active_layers.eachLayer(function(layer){
              let normal=3;
              let target = normal;
              if(zoom > 6)  {
                 target = (zoom > 9) ? 7 : (zoom - 6)+target;
              }
              layer.setRadius(target);
              site_marker_style.normal.radius=target;
              site_marker_style.hover.radius = (target *2) ;
            });
        };

        this.egd_active_layers.on('click', function(event) {
            if(activeProduct == Products.SLIPRATE) { 
               EGD_SLIPRATE.toggleSiteSelected(event.layer, true);
            }
        });

        this.egd_active_layers.on('mouseover', function(event) {
            let layer = event.layer;
            layer.setRadius(site_marker_style.hover.radius);
        });

        this.egd_active_layers.on('mouseout', function(event) {
            let layer = event.layer;
            layer.setRadius(site_marker_style.normal.radius);
        });

        // now update the scec_properties's color
        this.makeLayerColors(1);
    };

// recreate a new active_layers using a glist
// glist is a sorted ascending list
// this.egd_layers should be also ascending
    this.createActiveLayerGroupWithGids = function(glist) {

        // remove the old ones and remove from result table
        this.clearAllSelections()
        this.egd_active_layers.remove();
        this.egd_active_layers= new L.FeatureGroup();
        this.egd_active_gid=[];
        this.egd_active_markerLocations = [];

        let gsz=glist.length;
        let lsz= this.egd_layers.length;
        let i_start=0;

        for (let j=0; j<gsz; j++) {
          let gid=glist[j];
          for (let i=i_start; i< lsz; i++) {
            let layer = this.egd_layers[i];
            if (layer.hasOwnProperty("scec_properties")) {
               if (gid == layer.scec_properties.gid) {
                  this.replaceColor(layer);
                  this.egd_active_layers.addLayer(layer);
                  this.egd_active_gid.push(gid);
                  this.egd_active_markerLocations.push(layer.getLatLng())                      
                  i_start=i+1;
                  break;
               }
            }
          }
        }
        replaceResultTableBodyWithGids(glist);
        this.egd_active_layers.addTo(viewermap);

        if(this.egd_active_markerLocations.length > 1) {
          let bounds = L.latLngBounds(this.egd_active_markerLocations);
window.console.log("flyingBounds --new list");
          viewermap.flyToBounds(bounds, {maxZoom:18, padding:[10,10]});
        }
    };

// recreate the original map state
// original state  toOriginal use normal color
    this.recreateActiveLayerGroup = function(toOriginal) {

        if(this.egd_active_gid.length != this.egd_layers.length 
               || this.searchingType == this.searchType.minrate
               || this.searchingType == this.searchType.maxrate) {
          this.egd_active_layers= new L.FeatureGroup();
          this.egd_active_gid=[];
        
          for (let i=0; i< this.egd_layers.length; i++) {
            let marker = this.egd_layers[i];
            if (marker.hasOwnProperty("scec_properties")) {
               let gid = marker.scec_properties.gid;
               if(!toOriginal) {
                 this.replaceColor(marker);
               }
               this.egd_active_layers.addLayer(marker);
               this.egd_active_gid.push(gid);
               this.egd_active_markerLocations.push(marker.getLatLng())                      
            }
          }
          replaceResultTableBodyWithGids(this.egd_active_gid);
          this.egd_active_layers.addTo(viewermap);
          } else {
            this.egd_active_layers.addTo(viewermap);
       }
window.console.log("flyingBounds --recreateActiveLayer");
       let bounds = L.latLngBounds(this.egd_active_markerLocations);
       viewermap.flyToBounds(bounds, {maxZoom:18, padding:[10,10]});
    }

// search for a layer from master list by gid
    this.getLayerByGid = function(gid) {
        let foundLayer = false;
        for (let i=0; i< this.egd_layers.length; i++) {
          let layer = this.egd_layers[i];
          if (layer.hasOwnProperty("scec_properties")) {
             if (gid == layer.scec_properties.gid) {
                 return layer;     
             }
          }
       }
       return foundLayer;
    };


    function _resetRadius(layer) {
      layer.setRadius(site_marker_style.normal.radius);
    }

// select from currently active sites
    this.toggleSiteSelected = function(layer, clickFromMap=false) {

        if (typeof layer.scec_properties.selected === 'undefined') {
            layer.scec_properties.selected = true;
        } else {
            layer.scec_properties.selected = !layer.scec_properties.selected;
        }
        if (layer.scec_properties.selected) {
            this.selectSiteByLayer(layer, clickFromMap);
            if(!clickFromMap) {  
               layer.setRadius(site_marker_style.hover.radius);
               setTimeout(_resetRadius, 500, layer);
            }

        } else {
            this.unselectSiteByLayer(layer);
        }
        return layer.scec_properties.selected;
    };

    this.toggleSiteSelectedByGid = function(gid) {
        let layer = this.getLayerByGid(gid);
        return this.toggleSiteSelected(layer, false);
    };

    this.hoverSiteSelectedByGid = function(gid) {
        let layer = this.getLayerByGid(gid);
        layer.setRadius(site_marker_style.hover.radius);
    };
    this.unhoverSiteSelectedByGid = function(gid) {
        let layer = this.getLayerByGid(gid);
        setTimeout(_resetRadius, 100, layer);

    };

    this.selectSiteByLayer = function (layer, moveTableRow=false) {
        layer.scec_properties.selected = true;
        layer.setStyle(site_marker_style.selected);
        let gid = layer.scec_properties.gid;

        this.upSelectedCount(gid);

        // metatable table
        let $row = $(`tr[sliprate-metadata-gid='${gid}'`);
        let rowHTML = "";
        if ($row.length == 0) {
           this.addToMetadataTable(layer);
        }
        // move row to top
        if (moveTableRow) {
            let $rowHTML = $row.prop('outerHTML');
            $row.remove();
            $("#metadata-table.sliprate tbody").prepend($rowHTML);
        }

        // search result table 
        let label="sliprate-result-gid_"+gid;
        let $elt=$(`#${label}`);
        if ($elt) {
            $elt.addClass('glyphicon-check').removeClass('glyphicon-unchecked');
        }
    };

    this.unselectSiteByLayer = function (layer) {
        layer.scec_properties.selected = false;
	this.replaceColor(layer);
        //layer.setStyle(site_marker_style.normal);

        let gid = layer.scec_properties.gid;

        this.downSelectedCount(gid);

        let $row = $(`tr[sliprate-metadata-gid='${gid}'`);
        if ($row.length != 0) {
           this.removeFromMetadataTable(gid);
        }

        let label="sliprate-result-gid_"+gid;
        let $elt=$(`#${label}`);
        if ($elt) {
            $elt.addClass('glyphicon-unchecked').removeClass('glyphicon-check');
        }
    };

    this.unselectSiteByGid = function (gid) {
        let layer = this.getLayerByGid(gid);
        return this.unselectSiteByLayer(layer);
    };

// selectAll button - toggle
    this.toggleSelectAll = function() {
        var sliprate_object = this;

        let $selectAllButton = $("#egd-allBtn span");
        if (!$selectAllButton.hasClass('glyphicon-check')) {
            this.egd_active_layers.eachLayer(function(layer){
                sliprate_object.selectSiteByLayer(layer);
            });
            $selectAllButton.addClass('glyphicon-check').removeClass('glyphicon-unchecked');
        } else {
            this.clearSelectAll();
        }
    };

// selectAll button  - clear
    this.clearSelectAll = function() {
        this.clearAllSelections();
        let $selectAllButton = $("#egd-allBtn span");
        $selectAllButton.removeClass('glyphicon-check').addClass('glyphicon-unchecked');
    };

// unselect every active layer
    this.clearAllSelections = function() {
        var sliprate_object = this;
        this.egd_active_layers.eachLayer(function(layer){
            sliprate_object.unselectSiteByLayer(layer);
        });
        let $selectAllButton = $("#egd-allBtn span");
        $selectAllButton.removeClass('glyphicon-check').addClass('glyphicon-unchecked');
    };

    this.upSelectedCount = function(gid) {
       let i=this.egd_selected_gid.indexOf(gid); 
       if(i != -1) {
         window.console.log("this is bad.. already in selected list "+gid);
         return;
       }
       this.egd_selected_gid.push(gid);
       updateDownloadCounter(this.egd_selected_gid.length);
    };

    this.downSelectedCount = function(gid) {
       if(this.egd_selected_gid.length == 0) { // just ignore..
         return;
       }
       let i=this.egd_selected_gid.indexOf(gid); 
       if(i == -1) {
         window.console.log("this is bad.. not in selected list "+gid);
         return;
       }
       window.console.log("=====remove from list "+gid);
       this.egd_selected_gid.splice(i,1);
       updateDownloadCounter(this.egd_selected_gid.length);
    };

    this.zeroSelectedCount = function() {
       this.egd_selected_gid = [];
       updateDownloadCounter(0);
    };


/********** search/layer  functions *********************/
    this.showSearch = function (type) {
        const $all_search_controls = $("#egd-sliprate-search-control ul li");
        $all_search_controls.hide();
        switch (type) {
            case this.searchType.faultname:
                $("#egd-fault-name").show();
                break;
            case this.searchType.sitename:
                $("#egd-site-name").show();
                break;
            case this.searchType.latlon:
                $("#egd-latlon").show();
                drawRectangle();
                break;
            case this.searchType.minrate:
                $("#egd-minrate-slider").show();
                showKey(egd_minrate_min, egd_minrate_max, "Min Slip Rate");
                break;
            case this.searchType.maxrate:
                $("#egd-maxrate-slider").show();
                showKey(egd_maxrate_min, egd_maxrate_max, "Max Slip Rate");
                break;
            default:
                // no action
        }
    };

    this.showOnMap = function () {
        this.egd_active_layers.addTo(viewermap);
    };

    this.hideOnMap = function () {
        this.egd_active_layers.remove();
    };

// reset from the reset button
// reset option button, the map to original state
// but leave the external model state the same
    this.reset = function () {

window.console.log("calling reset");
        this.resetSearch();

        if ($("#egd-model-cfm").prop('checked')) {
          CXM.showCFMFaults(viewermap);
          } else {
          CXM.hideCFMFaults(viewermap);
        }

        if ($("#egd-model-gfm").prop('checked')) {
          CXM.showGFMRegions(viewermap);
          } else {
          CXM.hideGFMRegions(viewermap);
        }

        $("#egd-search-type").val("");
        this.searchingType = this.searchType.none;
    };

// reset just the search only
    this.resetSearch = function (){

window.console.log("sliprate calling --->> resetSearch.");

        this.clearAllSelections();

        this.resetMinrate();
        this.resetMaxrate();
        this.resetLatLon();
        this.resetFaultname();
        this.resetSitename();

        this.hideOnMap();
        this.recreateActiveLayerGroup(true);

    };

// a complete fresh search
    this.freshSearch = function (t){

        this.resetSearch();

        const $all_search_controls = $("#egd-controls-container ul li")
window.console.log("sliprate --- calling freshSearch..");
        switch (t) {
            case "faultname": 
               this.searchingType = this.searchType.faultname;
               $all_search_controls.hide();
               $("#egd-fault-name").show();
               break;
            case "sitename": 
               this.searchingType = this.searchType.sitename;
               $all_search_controls.hide();
               $("#egd-site-name").show();
               break;
            case "minrate": 
               this.searchingType = this.searchType.minrate;
               $all_search_controls.hide();
               $("#egd-minrate-slider").show();
               showKey(egd_minrate_min, egd_minrate_max, "Min Slip Rate");
               this.recreateActiveLayerGroup(false);
               break;
            case "maxrate": 
               this.searchingType = this.searchType.maxrate;
               $all_search_controls.hide();
               $("#egd-maxrate-slider").show();
               showKey(egd_maxrate_min, egd_maxrate_max, "Max Slip Rate");
               this.recreateActiveLayerGroup(false);
               break;
            case "latlon": 
               this.searchingType = this.searchType.latlon;
               $all_search_controls.hide();
               $("#egd-latlon").show();
               drawRectangle();
               break;
            default:
               this.searchingType = this.searchType.none;
               break;
        }

        if ($("#egd-model-cfm").prop('checked')) {
          CXM.showCFMFaults(viewermap);
          } else {
          CXM.hideCFMFaults(viewermap);
        }

        if ($("#egd-model-gfm").prop('checked')) {
          CXM.showGFMRegions(viewermap);
          } else {
          CXM.hideGFMRegions(viewermap);
        }
    };

    this.getMarkerBySiteId = function (site_id) {
        for (const index in egd_sliprate_site_data) {
            if (egd_sliprate_site_data[index].egd_id == site_id) {
                return egd_sliprate_site_data[index];
            }
        }

        return [];
    };

    this.startWaitSpin = function() {
      $("#egd-wait-spin").css('display','');
    }
    this.removeWaitSpin = function() {
      $("#egd-wait-spin").css('display','none');
    }

    this.search = function(type, criteria) {

        if(type != this.searchingType)
          return;

        EGD_SLIPRATE.startWaitSpin();

        $searchResult = $("#searchResult");
        if (!type || !criteria) {
            $searchResult.html("");
        }
        if (!Array.isArray(criteria)) {
            criteria = [criteria];
        }

        let JSON_criteria = JSON.stringify(criteria);

        $.ajax({
            url: "php/search.php",
            data: {t: type, q: JSON_criteria},
        }).done(function(sliprate_result) {
            let glist=[];
            if(sliprate_result === "[]") {
window.console.log("Did not find any PHP result");
              EGD_SLIPRATE.removeWaitSpin();
            } else {
                let tmp=JSON.parse(sliprate_result); 
                if(type == EGD_SLIPRATE.searchType.faultname
                     ||  type == EGD_SLIPRATE.searchType.sitename
                     ||  type == EGD_SLIPRATE.searchType.minrate
                     ||  type == EGD_SLIPRATE.searchType.maxrate
                     ||  type == EGD_SLIPRATE.searchType.latlon) {
//expected [{'gid':'2'},{'gid':'10'}]
                    let sz=tmp.length;
                    for(let i=0; i<sz; i++) {
                        let gid= parseInt(tmp[i]['gid']); 
                        glist.push(gid);
                    }
                    } else {
window.console.log( "BAD, unknown search type \n");
                }
            }

            EGD_SLIPRATE.createActiveLayerGroupWithGids(glist);
            EGD_SLIPRATE.removeWaitSpin();
        });
    };

    // special case, Latlon can be from text inputs or from the map
    // fromWhere=0 is from text
    // fromWhere=1 from drawRectangle call
    this.searchLatlon = function (fromWhere, rect) {
        let criteria = [];
        if( fromWhere == 0) {
            let lat1=$("#egd-firstLatTxt").val();
            let lon1=$("#egd-firstLonTxt").val();
            let lat2=$("#egd-secondLatTxt").val();
            let lon2=$("#egd-secondLonTxt").val();
            if(lat1=='' || lon1=='' || lat2=='' || lon2=='') return;
            remove_bounding_rectangle_layer();
            add_bounding_rectangle(lat1,lon1,lat2,lon2);
            criteria.push(lat1);
            criteria.push(lon1);
            criteria.push(lat2);
            criteria.push(lon2);
            } else {
                var loclist=rect[0];
                var sw=loclist[0];
                var ne=loclist[2];
                criteria.push(sw['lat']);
                criteria.push(sw['lng']);
                criteria.push(ne['lat']);
                criteria.push(ne['lng']);
window.console.log("HERE, making a box from map..");

                $("#egd-firstLatTxt").val(criteria[0]);
                $("#egd-firstLonTxt").val(criteria[1]);
                $("#egd-secondLatTxt").val(criteria[2]);
                $("#egd-secondLonTxt").val(criteria[3]);
        }
                 
        this.search(EGD_SLIPRATE.searchType.latlon, criteria);

        let markerLocations = [];
        markerLocations.push(L.latLng(criteria[0],criteria[1]));
        markerLocations.push(L.latLng(criteria[2],criteria[3]));
        let bounds = L.latLngBounds(markerLocations);
window.console.log("flyingBounds --latlon");
        viewermap.flyToBounds(bounds, {maxZoom:18, padding:[10,10]});
//        setTimeout(skipRectangle, 500);
    };

/********** metadata  functions *********************/
/* create a metadata list using selected gid list
FaultName,FaultID,State,SiteName,EGDId,SliprateId,Longitude,Latitude,DistToCFMFault,CFM6ObjectName,DataType,Observation,PrefRate,LowRate,HighRate,RateUnct,RateType,ReptReint,OffsetType,AgeType,NumEvents,RateAge,QbinMin,QbinMax,
UCERF3AppB
ShortReferences,Links,FullReferences

gid
faultname
faultid
state
sitename
egdid
sliprateid
longitude
latitud
disttocfmfault
cfm6objectname
datatype
observation
prefrate
lowrate
highrate
rateunct
ratetype
reptreint
offsettype
agetype
numevents
rateage
qbinmin
qbinmax
ucerf3appb
shortreferences
links
fullreferences
*/
    function createMetaData(properties) {
        var meta={};
        meta.fault_name = properties.faultname;
        meta.fault_id = properties.faultid;
        meta.state = properties.state;
        meta.site_name = properties.sitename;
        meta.egd_id= properties.egdid;
        meta.sliprate_id= properties.sliprateid;
        meta.longitude = properties.longitude;
        meta.latitude = properties.latitude;
        meta.dist_to_cfmfault = properties.disttocfmfault;
        meta.cfm6_objectname = properties.cfm6objectname;
        meta.data_type = properties.datatype;
        meta.observation = properties.observation;
        meta.pref_rate = properties.prefrate;
        meta.low_rate = properties.lowrate;
        meta.high_rate = properties.highrate;
        meta.rate_unct = properties.rateunct;
        meta.rate_type = properties.ratetype;
        meta.rept_reint = properties.reptreint;
        meta.offset_type = properties.offsettype;
        meta.age_type = properties.agetype;
        meta.num_events = properties.numevents;
        meta.rate_age = properties.rateage;
        meta.q_bin_min = properties.qbinmin;
        meta.q_bin_max = properties.qbinmax;
        meta.ucerf3_appb = properties.ucerf3appb;
        meta.short_references = properties.shortreferences;
        meta.links = properties.links;
        meta.full_references = properties.fullreferences;
        return meta;
    }

    this.addToMetadataTable = function(layer) {
        let $table = $("#metadata-table.sliprate tbody");
        let gid = layer.scec_properties.gid;
        if ($(`tr[sliprate-metadata-gid='${gid}'`).length > 0) {
            return;
        }
        let html = generateMetadataTableRow(layer);
        $table.prepend(html);
    };

    this.removeFromMetadataTable = function (gid) {
        $(`#metadata-table tbody tr[sliprate-metadata-gid='${gid}']`).remove();
    };

    var generateMetadataTableRow = function(layer) {
        let $table = $("#metadata-table");
        let html = "";
        let reflinkstr= _makeLinksWithReferences(layer.scec_properties.links,layer.scec_properties.short_references);

        html += `<tr sliprate-metadata-gid="${layer.scec_properties.gid}">`;

        html += `<td><button class=\"btn btn-sm cxm-small-btn\" id=\"button_meta_${layer.scec_properties.gid}\" title=\"remove the site\" onclick=EGD_SLIPRATE.unselectSiteByGid("${layer.scec_properties.gid}") onmouseover=EGD_SLIPRATE.hoverSiteSelectedByGid("${layer.scec_properties.gid}") onmouseout=EGD_SLIPRATE.unhoverSiteSelectedByGid("${layer.scec_properties.gid}") ><span id=\"sliprate_metadata_${layer.scec_properties.gid}\" class=\"glyphicon glyphicon-trash\"></span></button></td>`;
        html += `<td class="meta-data">${layer.scec_properties.egd_id}</td>`;
        html += `<td class="meta-data" onmouseover=EGD_SLIPRATE.hoverSiteSelectedByGid("${layer.scec_properties.gid}") onmouseout=EGD_SLIPRATE.unhoverSiteSelectedByGid("${layer.scec_properties.gid}")>${layer.scec_properties.fault_name} </td>`;
        html += `<td class="meta-data">${layer.scec_properties.site_name}</td>`;

        html += `<td class="meta-data" >${layer.scec_properties.low_rate} </td>`;
        html += `<td class="meta-data" >${layer.scec_properties.high_rate}</td>`;
        html += `<td class="meta-data">${reflinkstr}</td>`;

        html += `<td class="meta-data"></td>`;
        html += `</tr>`;
        return html;
    };

    var generateMetadataTable = function (results) {
window.console.log("generateMetadataTable..");
            var html = "";
            html+=`
<thead>
<tr>
        <th class="text-center button-container" style="width:2rem">
        </th>
        <th class="hoverColor" style="width:4rem" >Id&nbsp<span></span></th>
        <th class="hoverColor" onClick="sortMetadataTableByRow(2,'a')" style="width:10rem">Fault Name&nbsp<span id='sortCol_2' class="fas fa-angle-down"></span></th>
        <th class="hoverColor" onClick="sortMetadataTableByRow(3,'a')" style="width:10rem">Site Name&nbsp<span id='sortCol_3' class="fas fa-angle-down"></span></th>
        <th class="hoverColor" onClick="sortMetadataTableByRow(4,'n')" style="width:4rem;">Low Rate<br>(mm/yr)&nbsp<span id='sortCol_6' class="fas fa-angle-down"></span></th>
        <th class="hoverColor" onClick="sortMetadataTableByRow(5,'n')" style="width:4rem">High Rate<br>(mm/yr)&nbsp<span id='sortCol_7' class="fas fa-angle-down"></span></th>
        <th class="hoverColor" onClick="sortMetadataTableByRow(6,'a')" style="width:16rem">References&nbsp<span id='sortCol_8' class="fas fa-angle-down"></span></th>
        <th style="width:12rem;"><div class="text-center">
<!--download all -->
                <div class="btn-group download-now">
                    <button id="download-all" type="button" class="btn btn-dark" value="metadata"
		            style="padding:0 0.5rem 0 0.5rem;" 
                            onclick="EGD_SLIPRATE.downloadURLsAsZip(this.value);" disabled>
                            DOWNLOAD&nbsp<span id="download-counter"></span>
                    </button>
<!--
                    <button id="download-all" type="button" class="btn btn-dark dropdown-toggle" data-toggle="dropdown"
                            aria-haspopup="true" aria-expanded="false" disabled>
                            DOWNLOAD&nbsp<span id="download-counter"></span>
                    </button>
                    <div class="dropdown-menu dropdown-menu-right">
                       <button class="dropdown-item" type="button" value="metadata"
                            onclick="EGD_SLIPRATE.downloadURLsAsZip(this.value);">metadata
                       </button>
                    </div>
-->
                </div>
        </th>
</tr>
</thead>
<tbody>`;

            for (let i = 0; i < results.length; i++) {
                html += generateMetadataTableRow(results[i]);
            }
            if (results.length == 0) {
                html += tablePlaceholderRow;
            }
            html=html+"</tbody>";
            return html;
        };

       var changeMetadataTableBody = function (results) {

            var html = "";
            for (let i = 0; i < results.length; i++) {
                html += generateMetadataTableRow(results[i]);
            }
            if (results.length == 0) {
                html += tablePlaceholderRow;
            }
            return html;
        };

   
        this.replaceMetadataTableBody = function(results) {
            $("#metadata-table tbody").html(changeMetadataTableBody(results));
        };

        this.replaceMetadataTable = function(results) {
            $("#metadata-table").html(generateMetadataTable(results));
        };

/********************* reset functions **************************/
        this.toDraw = function () {
          if( this.searchingType == this.searchType.latlon) { 
            return true;
          }
          return false;
        }

        this.resetLatLon = function () {
          if( this.searchingType != this.searchType.latlon) return;
          $("#egd-firstLatTxt").val("");
          $("#egd-firstLonTxt").val("");
          $("#egd-secondLatTxt").val("");
          $("#egd-scecondLonTxt").val("");
          skipRectangle();
          remove_bounding_rectangle_layer();
          $("#egd-latlon").hide();
        }
        this.clearLatLon = function () {
          if( this.searchingType != this.searchType.latlon) return;
          $("#egd-firstLatTxt").val("");
          $("#egd-firstLonTxt").val("");
          $("#egd-secondLatTxt").val("");
          $("#egd-scecondLonTxt").val("");
        }

        this.resetFaultname = function () {
          if( this.searchingType != this.searchType.faultname) return;
          $("#egd-faultnameTxt").val("");
          $("#egd-fault-name").hide();
        }
        this.resetSitename = function () {
          if( this.searchingType != this.searchType.sitename) return;
          $("#egd-sitenameTxt").val("");
          $("#egd-site-name").hide();
        }

        this.resetMinrate = function () {
          if( this.searchingType != this.searchType.minrate) return;
          this.resetMinrateSlider();
          resetMinrateRangeColor(egd_minrate_min, egd_minrate_max);
          removeKey(); 
	  $("#egd-minrate-slider").hide();
        }

        this.resetMaxrate = function () {
          if( this.searchingType != this.searchType.maxrate) return;
          this.resetMaxrateSlider();
          resetMaxrateRangeColor(egd_maxrate_min, egd_maxrate_max);
          removeKey();
	  $("#egd-maxrate-slider").hide();
        }

        var resetMinrateRangeColor = function (target_min, target_max){
          let minRGB= makeRGB(target_min, egd_minrate_max, egd_minrate_min );
          let maxRGB= makeRGB(target_max, egd_minrate_max, egd_minrate_min );
          let myColor="linear-gradient(to right, "+minRGB+","+maxRGB+")";
          $("#slider-minrate-range .ui-slider-range" ).css( "background", myColor );
        }

        this.resetMinrateSlider = function () {
          if( this.searchingType != this.searchType.minrate) return;
          $("#slider-minrate-range").slider('values', 
                              [egd_minrate_min, egd_minrate_max]);
          $("#egd-minMinrateSliderTxt").val(egd_minrate_min);
          $("#egd-maxMinrateSliderTxt").val(egd_minrate_max);
        }

        var resetMaxrateRangeColor = function (target_min, target_max){
          let minRGB= makeRGB(target_min, egd_maxrate_max, egd_maxrate_min );
          let maxRGB= makeRGB(target_max, egd_maxrate_max, egd_maxrate_min );
          let myColor="linear-gradient(to right, "+minRGB+","+maxRGB+")";
          $("#slider-maxrate-range .ui-slider-range" ).css( "background", myColor );
        }

        this.resetMaxrateSlider = function () {
          if( this.searchingType != this.searchType.maxrate) return;
          $("#slider-maxrate-range").slider('values', 
                              [egd_maxrate_min, egd_maxrate_max]);
          $("#egd-minMaxrateSliderTxt").val(egd_maxrate_min);
          $("#egd-maxMaxrateSliderTxt").val(egd_maxrate_max);
        }

        this.refreshMaxrateSlider = function () {
          if( this.searchingType != this.searchType.maxrate) return;
          let maxrate_min=$("#egd-minMaxrateSliderTxt").val();
          let maxrate_max=$("#egd-maxMaxrateSliderTxt").val();
          $("#slider-maxrate-range").slider('values', 
                              [maxrate_min, maxrate_max]);
        }

        this.refreshMinrateSlider = function () {
          if( this.searchingType != this.searchType.minrate) return;
          let minrate_min=$("#egd-minMinrateSliderTxt").val();
          let minrate_max=$("#egd-maxMinrateSliderTxt").val();
          $("#slider-minrate-range").slider('values', 
                              [minrate_min, minrate_max]);
        }

/********************* marker color function **************************/
// marker.scec_properties.high_rate_color, marker.sce_properties.low_rate_color
// toMake == 1, set the scec_properties color values
        this.makeLayerColors = function() {
            let lsz = this.egd_layers.length;
            for(let i=0; i<lsz; i++) {
                let layer=this.egd_layers[i];
                let hr = layer.scec_properties.high_rate;
                let lr = layer.scec_properties.low_rate;
                layer.scec_properties.low_rate_color = makeRGB(lr, egd_minrate_max, egd_minrate_min );
                layer.scec_properties.high_rate_color = makeRGB(hr, egd_maxrate_max, egd_maxrate_min );
            }
        }

        this.replaceColor = function(layer) {
            let myColor = site_colors.normal;

            let hr = layer.scec_properties.high_rate;
            let lr = layer.scec_properties.low_rate;
            if( this.searchingType == this.searchType.minrate) {
                myColor = layer.scec_properties.low_rate_color;
            }
            if( this.searchingType == this.searchType.maxrate) {
                myColor = layer.scec_properties.high_rate_color;
            }
            if(layer.scec_properties.selected) {
                myColor = site_colors.selected;
            }
            layer.setStyle({fillColor:myColor, color:"white"});
          //  layer.setStyle({fillColor:myColor, color:myColor});
       }

       this.resetActiveLayerColor = function () {
            this.egd_active_layers.remove();

window.console.log(" ==> here in replace color");
            let layers=this.egd_active_layers;

            layers.eachLayer(function(layer) {
              layer.resetStyle();
            });

            this.egd_active_layers.addTo(viewermap);
       }


/********************* sliprate INTERFACE function **************************/
        this.setupEGDInterface = function() {

            var $result_table = $('#result-table');
            $result_table.floatThead('destroy');
            $("#result-table").html(makeResultTable(egd_sliprate_site_data));
            $result_table.floatThead({
                 scrollContainer: function ($table) {
                     return $table.closest('div#result-table-container');
                 },
            });

            let elt=document.getElementById("dataset_sliprate");
            elt.click();

            $("#egd-controlers-container").css('display','');
            $("#egd-sliprate-controlers-container").css('display','none');

            $("div.mapData div.map-container").css('padding-left','30px');

            var $download_queue_table = $('#metadata-table');
            $download_queue_table.floatThead('destroy');
            this.replaceMetadataTable([]);
            $download_queue_table.addClass('sliprate');
            $download_queue_table.floatThead({
                 scrollContainer: function ($table) {
                     return $table.closest('div#metadata-table-container');
                 },
            });

            this.activateData();

            viewermap.invalidateSize();
            let bounds = L.latLngBounds(this.egd_markerLocations);
window.console.log("fit bounds to all marker");
            viewermap.fitBounds(bounds);
/*
{
let center=viewermap.getCenter();
let zoom=viewermap.getZoom();
window.console.log(center, zoom);
}
*/


/* setup  sliders */
            $("#slider-minrate-range").slider({ 
                  range:true, step:0.01, min:egd_minrate_min, max:egd_minrate_max, values:[egd_minrate_min, egd_minrate_max],
              slide: function( event, ui ) {
                           $("#egd-minMinrateSliderTxt").val(ui.values[0]);
                           $("#egd-maxMinrateSliderTxt").val(ui.values[1]);
                           resetMinrateRangeColor(ui.values[0],ui.values[1]);
                     },
              change: function( event, ui ) {
                           $("#egd-minMinrateSliderTxt").val(ui.values[0]);
                           $("#egd-maxMinrateSliderTxt").val(ui.values[1]);
                           resetMinrateRangeColor(ui.values[0],ui.values[1]);
                     },
              stop: function( event, ui ) {
                           let searchType = EGD_SLIPRATE.searchType.minrate;
                           EGD_SLIPRATE.search(searchType, ui.values);
                     },
              create: function() {
                          $("#egd-minMinrateSliderTxt").val(egd_minrate_min);
                          $("#egd-maxMinrateSliderTxt").val(egd_minrate_max);
                    }
            });
            $('#slider-minrate-range').slider("option", "min", egd_minrate_min);
            $('#slider-minrate-range').slider("option", "max", egd_minrate_max);

/* setup  sliders */
            $("#slider-maxrate-range").slider({ 
                  range:true, step:0.01, min:egd_maxrate_min, max:egd_maxrate_max, values:[egd_maxrate_min, egd_maxrate_max],
              slide: function( event, ui ) {
                           $("#egd-minMaxrateSliderTxt").val(ui.values[0]);
                           $("#egd-maxMaxrateSliderTxt").val(ui.values[1]);
                           resetMaxrateRangeColor(ui.values[0],ui.values[1]);
                     },
              change: function( event, ui ) {
                           $("#egd-minMaxrateSliderTxt").val(ui.values[0]);
                           $("#egd-maxMaxrateSliderTxt").val(ui.values[1]);
                           resetMaxrateRangeColor(ui.values[0],ui.values[1]);
                     },
              stop: function( event, ui ) {
                           let searchType = EGD_SLIPRATE.searchType.maxrate;
                           EGD_SLIPRATE.search(searchType, ui.values);
                     },
              create: function() {
                          $("#egd-minMaxrateSliderTxt").val(egd_maxrate_min);
                          $("#egd-maxMaxrateSliderTxt").val(egd_maxrate_max);
                    }
            });
            $('#slider-maxrate-range').slider("option", "min", egd_maxrate_min);
            $('#slider-maxrate-range').slider("option", "max", egd_maxrate_max);
    };

/******************  Result table functions **************************/
    function makeResultTableBody(json) {

        var html="<tbody id=\"result-table-body\">";
        var sz=json.length;

//onmouseover=EGD_SLIPRATE.hoverSiteSelectedByGid("+gid+") onmouseout=EGD_SLIPRATE.unhoverSiteSelectedByGid("+gid+ ")
        var tmp="";
        for( var i=0; i< sz; i++) {
           var s=json[i];
           var gid=parseInt(s.gid);
           var name=s.faultname + " | " +s.sitename;
           var t="<tr id=\"row_"+gid+"\"><td style=\"width:25px\"><button class=\"btn btn-sm cxm-small-btn\" id=\"button_"+gid+"\" title=\"highlight the fault\" onclick=EGD_SLIPRATE.toggleSiteSelectedByGid("+gid+")><span id=\"sliprate-result-gid_"+gid+"\" class=\"glyphicon glyphicon-unchecked\"></span></button></td><td><label for=\"button_"+gid+"\" onmouseover=EGD_SLIPRATE.hoverSiteSelectedByGid("+gid+") onmouseout=EGD_SLIPRATE.unhoverSiteSelectedByGid("+gid+ ")>" + name + "</label></td></tr>";
           tmp=tmp+t;
        }
        html=html+ tmp + "</tbody>";

        return html;
    }

    function replaceResultTableBodyWithGids(glist) {

        var html="";
        var sz=glist.length;

        for( var i=0; i< sz; i++) {
           let gid=glist[i];
           let layer=EGD_SLIPRATE.getLayerByGid(gid);
           let s=layer.scec_properties;
           let name= s.fault_name + " | " +s.site_name;

           var t="<tr id=\"row_"+gid+"\"><td style=\"width:25px\"><button class=\"btn btn-sm cxm-small-btn\" id=\"button_"+gid+"\" title=\"highlight the fault\" onclick=EGD_SLIPRATE.toggleSiteSelectedByGid("+gid+")><span id=\"sliprate-result-gid_"+gid+"\" class=\"glyphicon glyphicon-unchecked\"></span></button></td><td><label for=\"button_"+gid+"\">" + name + "</label></td></tr>";
           html=html+t;
        }

        document.getElementById("result-table-body").innerHTML = html;
    }


    function makeResultTable(json) {
        var html="";
        html+=`
<thead>
<tr>
   <th class='text-center'><button id=\"egd-allBtn\" class=\"btn btn-sm cxm-small-btn\" title=\"select all visible sliprate sites\" onclick=\"EGD_SLIPRATE.toggleSelectAll();\"><span class=\"glyphicon glyphicon-unchecked\"></span></button></th>
<th class='myheader'>EGD Site Location ( fault | site )</th>
</tr>
</thead>`;
        var body=makeResultTableBody(json);
        html=html+ "<tbody>" + body + "</tbody>";

        return html;
    }

/********************** zip utilities functions *************************/
    this.downloadURLsAsZip = function(ftype) {
window.console.log("calling download..");
        var nzip=new JSZip();
        var layers=EGD_SLIPRATE.egd_active_layers.getLayers();
        let timestamp=$.now();
        let mlist=[];
      
        var cnt=layers.length;
        for(var i=0; i<cnt; i++) {
          let layer=layers[i];

          if( !layer.scec_properties.selected ) {
            continue;
          }

          if(ftype == "metadata" || ftype == "all") {
          // create metadata from layer.scec_properties
            let m=createMetaData(egd_sliprate_site_data[layer.scec_properties.idx]);
            mlist.push(m);
          }
      
/***** this is for downloading some generated file from the result directory..
          if(ftype == "extra") {
            let downloadURL = getDataDownloadURL(layer.scec_properties.egd_id);
            let dname=downloadURL.substring(downloadURL.lastIndexOf('/')+1);
            let promise = $.get(downloadURL);
            nzip.file(dname,promise);
          }
***/
        }

        if(mlist.length != 0) {
          var data=getCSVFromMeta(mlist);
          saveAsCSVBlobFile("EGD_sliprate_", data, timestamp);
        }
    };


    function getCSVFromMeta(mlist) {
        var len=mlist.length;  // each data is a meta data format
        var last=len-1;

    // grab the first meta data and generate the title..
        var meta=mlist[0];
        var keys=Object.keys(meta);
        var jlen=keys.length;
        
//        var csvblob = keys.join(",");
        var csvblob=sliprate_csv_keys[keys[0]];
        for(let k=1; k< jlen; k++) {
           csvblob += (','+sliprate_csv_keys[keys[k]]);
        }
        csvblob +='\n';

        for(let i=0; i< len; i++) {
            let j=0;
            meta=mlist[i];
            var values=Object.values(meta)
            var vblob=JSON.stringify(values[0]);
            for(j=1; j< jlen; j++) {
                var vv=values[j];
                if(vv != null) {
                  if(isNaN(vv)) {
                    vblob=vblob+","+ JSON.stringify(vv);
                    } else {
                      vblob=vblob+","+vv;
                  }
                  } else {
                    vblob=vblob+",";
                }
            }
            csvblob += vblob;
            if(i != last) {
            csvblob +='\n';
            }
        }
//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
        return csvblob;
    }
	      
};
