/**

   egd_cmap.js

**/

/* How many segments to chunk a set of csm data */
const EGD_DEFAULT_DATA_SEGMENT_COUNT= 12;

/* there are 2 different log scale set.. */
var sliprateHighRateSegments=[];
var sliprateLowRateSegments=[];

var egd_cmap_tb={
    sliprate_rgb:[ "rgb(52,16,60)",
                   "rgb(59,91,169)",
                   "rgb(78,132,196)",
                   "rgb(130,210,225)",
                   "rgb(253,245,166)",
                   "rgb(247,237,65)",
                   "rgb(232,216,25)",
                   "rgb(220,183,38)",
                   "rgb(242,101,34)",
                   "rgb(239,60,35)",
                   "rgb(217,34,38)",
                   "rgb(131,21,23)"]
    };

/*************************************************************************/
function cmapGetSliprateLowRateColor(v) {
   let idx=cmapGetSliprateLowRateIndex(v);

   let cset=egd_cmap_tb.sliprate_rgb;
   let color=cset[idx];

   return color;
}

function cmapGetSliprateHighRateColor(v) {
   let idx=cmapGetSliprateHighRateIndex(v);

   let cset=egd_cmap_tb.sliprate_rgb;
   let color=cset[idx];

   return color;
}

function cmapGetSliprateLowRateIndex(v) {

   if(v==0) v=(1.0E-9);
   let target = Math.log(v);
   target=polishNumber(target);

   let sz=sliprateLowRateSegments.length;
   if(target < sliprateLowRateSegments[0]) {
     return 0;
   }
   for(let i=1; i<sz; i++) {
     let term=sliprateLowRateSegments[i];
     if( target > term ) {
       continue;
       } else {
          return i-1;
     }
   }
   return sz-1;
}

// chop to 3 digits
function polishNumber(v) {
  let t=(Math.floor( v*1000 )) / 1000; 
  return t; 

}
function cmapGetSliprateHighRateIndex(v) {

   if(v==0) v=(1.0E-9);
   let target = Math.log(v);
   target=polishNumber(target);

   let sz=sliprateHighRateSegments.length;
   if(target < sliprateHighRateSegments[0]) {
     return 0;
   }
   for(let i=1; i<sz; i++) {
     let term=sliprateHighRateSegments[i];
     if( target > term ) {
       continue;
       } else {
          return i-1;
     }
   }
   return sz-1;
}

function logscale(ea, eb, N) {
   let step= (eb - ea) / N;
   step=polishNumber(step);

   let slist=[];
   let v=ea;
   for( let i=0; i<N; i++) {
     let s=v+(i * step);
     let ns=Math.pow(10, s);
     ns=polishNumber(ns);
     slist.push(ns);
   }
   // last one
   let ss= Math.pow(10, eb);
   ss=polishNumber(ss);
   slist.push(ss);
   return slist;
}

// make N+1 segments -- for making color bar ticks
// log = y, linear = x
function cmapSetupSliprateSegments(lrmin,lrmax,hrmin,hrmax) {
   let N=EGD_DEFAULT_DATA_SEGMENT_COUNT;

window.console.log("lr val RANGE :  "+lrmin+" to "+lrmax);
window.console.log("hr val RANGE :  "+hrmin+" to "+hrmax);

   sliprateLowRateSegments=logscale(Math.log10(lrmin),Math.log10(lrmax), N);
   sliprateHighRateSegments=logscale(Math.log10(hrmin),Math.log10(hrmax), N);

window.console.log("lr log", sliprateLowRateSegments.toString());
window.console.log("hr log", sliprateHighRateSegments.toString());
}


function cmapFindSegmentProperties(searchType) {
  var info={};
  if(searchType == EGD_SLIPRATE.searchType.minrate) {
    info.labels=sliprateLowRateSegments;
    info.color=egd_cmap_tb.sliprate_rgb;
    } else {
      info.labels=sliprateHighRateSegments;
      info.color=egd_cmap_tb.sliprate_rgb;
  }
  return info;
}
