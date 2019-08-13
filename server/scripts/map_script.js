var pmks={"c_id" : "aa", "center":{lat: 37.484780, lng: 127.016129} 
        , "mapname" : "안녕" 
        , "mks" : [{"title" : "1","lat" : 37.484781,"lng" : 127.0162, "desc" : {"con" : "no.1"} }
        ,{"title" : "2","lat" : 37.484800,"lng" : 127.0163, "desc" : {"con" : "no.2"} }
        ,{"title" : "3","lat" : 37.484789,"lng" : 127.0164, "desc" : {"con" : "no.3"} }]};
        
        
var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
    //여기다가 좌표를 입력합니다
    center: pmks['center'],
    zoom: 18
    });
            
    map.addListener('click', function(e) {
        console.log(e);
        console.log(e.latLng);
        placeMarker("new",e.latLng, "new");
    });
    var m = pmks['mks']
    for(var i in m) {
        console.log(m[i]['title'])
        placeMarker(m[i]['title'],{"lat" : m[i]['lat'] , "lng" : m[i]['lng']},m[i]['desc']['con'])
    }
            //data = map.data.loadGeoJson('my.geojson');
            //var ge =  {'type' : 'point', 'coordinates' : [[37.484780,127.016129]]};
            //map.data.addGeoJson(ge);


}

function placeMarker(ti,position,cont) {
    var marker = new google.maps.Marker({
        position: position,
        map: map,
        draggable : true,
        title : ti
    });
    marker.description = new google.maps.InfoWindow({
        content:cont
    });
    //마커에 클릭 이벤트를 다는 부분, readonly라면 필요없습니다
    google.maps.event.addListener(marker, 'click', function(){
        var desc = prompt("장소에 대한 설명을 입력해주세요",marker.description.content);
        if (desc != null) {
            altdesc(marker,desc);
        };
        this.description.setPosition(this.getPosition());
        this.description.open(map); //map to display on
    });
    map.panTo(position);
}

function altdesc(marker,content){
    marker.description = new google.maps.InfoWindow({
        content:desc
    });
}
