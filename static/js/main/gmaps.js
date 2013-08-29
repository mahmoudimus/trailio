define('main/gmaps', ['async!http://maps.googleapis.com/maps/api/js?key=AIzaSyCn0mXVcSCWexEo-VAxdghkyCKVw8HKUOs&libraries=geometry,places&sensor=true'],
    function(){return window.google.maps;});