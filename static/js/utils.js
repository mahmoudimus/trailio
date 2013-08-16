define([
    'underscore'
],
function(_) {
    var hasLocalStorage = function() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    };

    var SetLocation = function(point){
        var string = point.lat().toString() + '|' + point.lng().toString();
        if(hasLocalStorage()) {
            localStorage['last_location'] = string;
            return true
        } else{
            return false
        }
    };
    var GetLocation = function(){
        if (hasLocalStorage()){
            var string = localStorage['last_location'];
            return string ? window.google.maps.LatLng(
                parseFloat(string.split('|')[0]),
                parseFloat(string.split('|')[1])
               ) : null;
        }
        return null
    };


    var SetCookie = function(cookieName,cookieValue,nDays) {
        var value = cookieName+"="+ _.escape(cookieValue);
        if (nDays='session'){
            document.cookie = value
        } else {
            var today = new Date();
            var expire = new Date();
            if (nDays==null || nDays==0) nDays=1;
            expire.setTime(today.getTime() + 3600000*24*nDays);
            value += ";expires="+expire.toGMTString();
        }
            document.cookie = value
    };

    var ReadCookie = function(cookieName) {
        var theCookie=" "+document.cookie;
        var ind=theCookie.indexOf(" "+cookieName+"=");
        if (ind==-1) ind=theCookie.indexOf(";"+cookieName+"=");
        if (ind==-1 || cookieName=="") return false;
        var ind1=theCookie.indexOf(";",ind+1);
        if (ind1==-1) ind1=theCookie.length;
        return _.escape(theCookie.substring(ind+cookieName.length+2,ind1));
    };

    return {
        SetCookie:SetCookie,
        SetLocation:SetLocation,
        GetLocation:GetLocation,
        ReadCookie:ReadCookie
    }

});
