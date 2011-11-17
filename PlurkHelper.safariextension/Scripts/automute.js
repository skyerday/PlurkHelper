// ==UserScript==
// @name       Plurk Helper
// @version    0.8
// @description  Plurk helper functions to enhance web Plurk UI.
// @include    http://www.plurk.com/*
// @copyright  2011+, Skyer
// @author     Skyer
// Reference : http://userscripts.org/scripts/review/112835
// ver 0.1 (2011/9/16)  * First version.
// ver 0.2 (2011/9/17)  * Add FireFox support.
// ver 0.3 (2011/9/20)  * Support account name for the keyword. Ex: http://www.plurk.com/off60, you can assign off60 for blockList item.
// ver 0.4 (2011/11/01) * Change to Safari extension format. Remove blockList. It will be added outside.
// ver 0.5 (2011/11/04) * Fix error in FF && Chrome
// ver 0.6 (2011/11/05) * Add UI in Plurk. Click Muter in Plurk title to show setting.
// ver 0.7 (2011/11/09) * Name changed. Add Favor function. You can add plurk to favor. The favor is saving in local, and is different than like for Plurk function.
// ver 0.8 (2011/11/09) * The mute will auto refresh to unmute. Fix javascript error.
// ver 0.9 (2011/11/15) * Add import/export. Change some code flow.
// ==/UserScript==

ver = "V9";

(function(){
    if (window.top === window) {
        var css = document.createElement('link');
        css.href = 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/themes/base/jquery-ui.css';
        css.type = 'text/css';
        css.rel = 'stylesheet';
        document.getElementsByTagName('head')[0].appendChild(css);
        onJQCSSLoaded();
    }
})();

var myWindow = (typeof unsafeWindow == 'undefined') ? window : unsafeWindow;

function onJQCSSLoaded() {
    var jq = document.createElement('script');
    jq.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.0/jquery.js';
    jq.addEventListener('load', onJQLoaded, true);
    document.getElementsByTagName('head')[0].appendChild(jq);    
}

function onJQLoaded() {
    // Patch the jQuery function to avoid js error in Plurk.
    // Plurk overwrite the nodeName property to a function in window.
    myWindow.jQuery.acceptData = function(elem) {
        if ( elem.nodeName ) {
            var jq = typeof myWindow.jq != 'undefined' ? myWindow.jq : myWindow.jQuery;
            var match = typeof elem.nodeName != 'string' ? false : jq.noData[ elem.nodeName.toLowerCase() ];

            if ( match ) {
                return !(match === true || elem.getAttribute("classid") !== match);
            }
        }

        return true;
    }

    var jq = document.createElement('script');
    jq.src = 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.js';
    jq.type = 'text/javascript';
    document.getElementsByTagName('head')[0].appendChild(jq);
    jq.addEventListener("load", onJQUILoaded, true);
}

function onJQUILoaded() {
    console.log('UI loaded');
    myWindow.jq = myWindow.jQuery.noConflict(true);
    //myWindow.jQuery = myWindow.jq;

    myWindow.signread = false;
    myWindow.shelpersetting = undefined;

    try {
        if (typeof myWindow.gmgetsetting != 'undefined' && myWindow.gmgetsetting.length > 0)
            globalsetting = JSON.parse(myWindow.gmgetsetting);
        else
            globalsetting = {};
    } catch (err) {
        console.log('error: ' + err);
        globalsetting = {};
    }

    injectMuter(myWindow.jq);
    myWindow.setTimeout(doRTE, 100, myWindow.jq);        
}

if (typeof GM_getValue == 'undefined') {
    GM_getValue = function(key) {
        return globalsetting[key];
    };
}

if (typeof GM_setValue == 'undefined') {
    GM_setValue = function(key, value) {
        globalsetting[key] = value;
        var span = myWindow.jq('#proxy_for_data');
        span.text(JSON.stringify(globalsetting));
    };
}

function fetchKeywords(keyword, ui) {
    if (typeof keyword == 'undefined' || keyword.length <= 0) return;
    var arr = keyword.split(",");
    var list = document.getElementById("keywords");
    outSideBlockList = [];
    for (var i=0; i<arr.length; ++i) {
        if (arr[i].length > 0) {
            if (ui) {
                var option = document.createElement("option");
                option.text = arr[i];
                list.add(option, null);
            }
            outSideBlockList.push(arr[i]);
        }
    }
}

function initFavorList(favor) {
    if (typeof favor == 'undefined' || favor.length == 0) {
        favorcontainer = {};
        return;
    }

    favor = unescape(favor);
    favorcontainer = JSON.parse(favor);
    myWindow.jq('div#tab2 tbody tr').detach();
    var tbody = myWindow.jq('div#tab2 tbody');
    var i = 0;
    for (var k in favorcontainer) {
        var item = favorcontainer[k];
        var twiclass = (i++) % 2 ? 'twilight1' : 'twilight2';
        tbody.append('<tr class="'+twiclass+'"><td>'+item.name+'</td><td><a target="_blank" href="'+item.link+'">'+item.text+'</a></td></tr>');
    }    
}

function updateFavor() {
    GM_setValue('favor', escape(JSON.stringify(favorcontainer)));
}

function getEncodedId(id) {
    return (parseInt(id.substring(1, id.length), 10)).toString(36);
}

function injectMuter($) {
    $('#top_bar td').append('<a id="plurkmuter" href="#" class="item">SHelper'+ver+'</a>');
    $('#plurkmuter').click(function(){
        $('#mutertab').tabs();
        myWindow.jq('#shelpersetting').css('display', '');
    });
    $('head').append('<style>.twilight1 {background-color: #FFFFFF;} .twilight2 {background-color: #EEEEEE;}</style>');
    $('body').append(
        '<script type="text/javascript">function closeSetting(){window.jq(\'#shelpersetting\').css({\'display\':\'none\'});}' +
        '   function updateSetting() {var list = document.getElementById("keywords"); var setting = ""; for (var i=0; i<list.length; ++i) { setting = setting + "," + list.options[i].text; } if (setting.length > 0) setting = setting.substring(1, setting.length); window.shelpersetting = "{\\"mutersetting\\":\\""+setting+"\\"}"; window.signread = true;}' +
        '   function onAddClick() {var list = document.getElementById("keywords"); var input = document.getElementById("keyword"); var option = document.createElement("option"); option.text = input.value; list.add(option, null); updateSetting();}' +
        '   function onDelClick() {var list = document.getElementById("keywords"); var index = list.selectedIndex; if (index == -1) return; list.remove(index); updateSetting();} ' +
        '</script>' +
        '<div id="shelpersetting" style="color: #000000; position:absolute; top:100px; left:100px; background-color:#FFFFFF; width: 500px; height: 400px; z-index: 5000; display: none;">' +
        '<div id="mutertab" style="height:350px; overflow: auto; ">' +
        '<ul><li><a href="#mutersetting"><span>Muter</span></a></li>' +
        '<li><a href="#tab2"><span>Favor</span></a></li></ul>' +
        '<div id="mutersetting">' +
        '<p>Auto mute plurks with matched keywords</p>' +
        '<form>' +
        'Keyword: <input name="keyword" id="keyword" /> <button name="add" id="add" type="button" onClick="onAddClick();">Add</button>' +
        '<button name="delkey" id="delkeys" type="button" onClick="onDelClick();">Delete</button><br>' +
        '<select name="keywords" id="keywords" multiple="multiple" size="10" width="300" style="width: 300px;"></select> <br>' +
        '</form>' +
        '</div>' + 
        '<div id="tab2">' +
        '<table><thead><tr><th width="100px">Name</th><th width="350px">Title</th></tr></thead><tbody></tbody></table>' +
        '<br><button id="clearFavor" type="button">Clear</button>' +
        '</div>' +
        '</div>' +
        '<button name="close" id="close" type="button" onClick="closeSetting()">Close</button>' +
        '<button id="edit" type="button">Export/Import</button>' +
        '&nbsp;&nbsp;&nbsp;&nbsp;by Skyer 2011' +
        '</div>');
    $('#clearFavor').click(function() {
        favorcontainer = {};
        $('div#tab2 tbody tr').detach(); 
        updateFavor();
    });

    $('button#edit').click(function() {
        var result = window.prompt("Export / Import helper settings.", JSON.stringify(globalsetting));
        var parsed = undefined;
        try {
            parsed = JSON.parse(result);
        } catch (exception) {
            parsed = undefined;
        }

        if (typeof parsed != 'undefined') {
            globalsetting = parsed;
            var span = myWindow.jq('#proxy_for_data');
            span.text(JSON.stringify(globalsetting));
        }
    });

    myWindow.renderManagerOrig = myWindow.Plurks._renderManager;
    myWindow.Plurks._renderManager = function(a) {
        myWindow.renderManagerOrig(a);

        var id = getEncodedId(myWindow.$dp.hover_div.id);
        var heart = (id in favorcontainer) ? '♥' : '♡';
        $('.manager').append('<a id="pfavor" href="#" class="action">'+heart+'Favor</a>');
        $('#pfavor').click(function() {
            var cdiv = myWindow.$dp.hover_div;
            var id = getEncodedId(cdiv.id);

            if (id in favorcontainer) {
                delete favorcontainer[id];
                initFavorList(escape(JSON.stringify(favorcontainer)));
                $('.manager a#pfavor').text('♡Favor');
            } else {
                var link = 'http://www.plurk.com/p/'+id;
                var name = $('div#'+cdiv.id+' a.name').text();
                var text = $('div#'+cdiv.id+' div.text_holder').text();
                var item = {'link':link, 'name':name, 'text':text};
                console.log('Length: ' + favorcontainer.length);
                //var twiclass = (favorcontainer.length % 2) ? 'twilight1' : 'twilight2';
                favorcontainer[id] = item;
                //$('div#tab2 tbody').append('<tr class="'+twiclass+'"><td>'+item.name+'</td><td><a target="_blank" href="'+item.link+'">'+item.text+'</a></td></tr>');
                $('.manager a#pfavor').text('♥Favor');
                initFavorList(escape(JSON.stringify(favorcontainer)));
            }

            setTimeout(function(){
                updateFavor();
            }, 100);

            return false;
        });
    };
    fetchKeywords(GM_getValue('mutersetting'), true);
    initFavorList(GM_getValue('favor'));
}

function doRTE($) {
    if (myWindow.signread == true) {
        var setting = $.parseJSON(myWindow.shelpersetting);
        myWindow.signread = false;
        console.log('fetch settings from UI');
        for (k in setting) {
            var v = setting[k];
            GM_setValue(k, v);
            if (k  == 'mutersetting')
                fetchKeywords(v, false);
        }
    }

    var blockList = typeof outSideBlockList == 'undefined' ? undefined : outSideBlockList;
    if (typeof blockList == 'undefined') {
        myWindow.setTimeout(doRTE, 2000, $);
        return;
    }

    function do_match(text) {
        for (k=0;k<=blockList.length;k++) {
            var keyword = blockList[ k ];
            var r = text && text.match( keyword ); // XXX: rule here.
            if( r && r[0].length > 0) {
                // console.debug( 'match:' , r);
                return 1;
            }
        }
        return 0;
    }
        
    function set_mute(pid,v) {
        $.ajax({
            type: "POST",
            url: "/TimeLine/setMutePlurk",
            data: "plurk_id=" + pid + "&value=" + v,
            success: function(msg){
                console.log( "muted: " + pid + ", " + msg  );
            }
        });
    }
        
    if ($('.plurk')) {
        $('.plurk').each(function() {
            var me = $(this);
            var plurk = me.get(0).id.match( /p(\d+)/ );
            if (plurk) {
                var plurk_id = plurk[1];
                var nameObj = me.find('.name');
                var urlName = nameObj.attr('href');
                var textName = nameObj.html();
                var muted = me.get(0).className;
                if ( (do_match( urlName ) || do_match( textName )) && !muted.match('muted')) {
                    console.log('Mute ' + plurk_id + ', ' + textName + " (" + urlName + ")");
                    set_mute( plurk_id , 2 );
                    me.addClass('muted');
                    $dp.mute_link.innerText = _('unmute');
                    myWindow.PlurkMetaData.muted[plurk_id] = true;
                    myWindow.$plurks['p'+plurk_id].obj.is_unread = 2;
                }
            }
        });
    }
            
    window.setTimeout(doRTE, 2000, $);
}