define([
    'underscore'
//    'cryptoc/js'
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
    /**
     * @return {string}
     */
    var ReadCookie = function(cookieName) {
        var theCookie=" "+document.cookie;
        var ind=theCookie.indexOf(" "+cookieName+"=");
        if (ind==-1) ind=theCookie.indexOf(";"+cookieName+"=");
        if (ind==-1 || cookieName=="") return false;
        var ind1=theCookie.indexOf(";",ind+1);
        if (ind1==-1) ind1=theCookie.length;
        return _.escape(theCookie.substring(ind+cookieName.length+2,ind1));
    };

    /**
     * @return {string}
     */
//    var NumCommas = function (x) {
//        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//    };
//   /*
//   * @return (string)
//   * */
//    var IdSort = function(a,b){
//        if (a.length < b.length){
//            return -1
//        } else if (b.length < a.length){
//            return 1
//        } else {
//            for (var i=0; i< a.length; i++){
//                if (a[i]< b[i]){
//                    return -1
//                }else if (a[i] > b[i]){
//                    return 1
//                }
//            }
//        }
//    };
//    /**
//     * @return {boolean}
//     */
//    var IsSet = function(model, func, context){
//        if (!_.has(model, 'loaded')){
//            model.fetch();
//            model.on('sync', func, context);
//
//            return true
//        }
//        else if (_.has(model, 'rendered')){
//            func.call(context);
//            return true
//        }
//    };
//    var _ALPHABET = 'fqkzwbs40BVxWDaJuc3PiogFUOETIKLZ9R2AmeGYvNXlnjydHQt5S6pC7h81Mr';
////
//    var sid_to_cell = function(sid){
//
//        var nums = _.map(sid, function(ch, i){
//            return _ALPHABET.indexOf(ch)
//        });
//        nums.reverse();
//        var key = 0;
//        _.each(nums, function(num, i){
//            key += num*(Math.pow(_ALPHABET.length, i))
//        });
//        return key.toString(16)
//    };
//
//    var sids_to_url = function(sid_list){
//        var cells = sid_list.map(function(sid){
//            return sid_to_cell(sid)
//        });
//        var wordarray = CryptoJS.enc.Hex.parse(cells.join(''));
//        var b64 = CryptoJS.enc.Base64.stringify(wordarray);
//        b64 = b64.replace(/\+/g, '-').replace(/\//g, '_');
//        console.log(b64);
//        return b64
//    };

    return {
        SetCookie:SetCookie,
        SetLocation:SetLocation,
        GetLocation:GetLocation,
        ReadCookie:ReadCookie
//        NumCommas: NumCommas,
//        IdSort: IdSort,
//        IsSet: IsSet,
//        sids_to_url: sids_to_url
    }

});
