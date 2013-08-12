//define('gmaps', ['async!http://maps.googleapis.com/maps/api/js?key=AIzaSyDGANp1hZT6kmLOLRVve9ISP5o_7qleauU&libraries=geometry,places&sensor=false'],
//    function(){
//        return window.google.maps;
//    });
define('gmaps', ['async!http://maps.googleapis.com/maps/api/js?key=AIzaSyCn0mXVcSCWexEo-VAxdghkyCKVw8HKUOs&libraries=geometry,places&sensor=true'],
    function(){
        console.log('google load')
        return window.google.maps;
    });