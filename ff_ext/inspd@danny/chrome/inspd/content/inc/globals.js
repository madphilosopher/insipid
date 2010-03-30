function $id(elid,doc){if(!doc){doc=document;} return doc.getElementById(elid); }
if(typeof(Insipid) == 'undefined') var Insipid = {};		
var Inspd_gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
var prefs_getBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
var prefs_getservice = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
var $prefs = {

			set : function(pref_name, pref_value) {
				var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
				str.data = $utils.trim(pref_value);
				prefs_getBranch.setComplexValue('extensions.inspd.'+pref_name, Components.interfaces.nsISupportsString, str);
			},
			
			set2 : function(pref_name, pref_value) {
				var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
				str.data = $utils.trim(pref_value);
				prefs_getBranch.setComplexValue(pref_name, Components.interfaces.nsISupportsString, str);
			},
			
			

			get : function(pref_name){
				try{
				return prefs_getBranch.getComplexValue('extensions.inspd.'+pref_name,Components.interfaces.nsISupportsString).data;
				}
				catch(e){ return false;}
			},

			remove : function(pref_name){
				try{prefs_getBranch.clearUserPref('extensions.inspd.'+pref_name)
				}catch(e){}
			},
				
			remove_all : function(pref_name){
				try{prefs_getBranch.deleteBranch('extensions.inspd.'+pref_name,'')
				}catch(e){}
			},
				
				
			branch : function(pref_name){
					var serialBranch = prefs_getservice.getBranch('extensions.inspd.'+pref_name+'.');
					return serialBranch.getChildList("",{});
			}
}


var $ajax = {

			get : function(url,func){
				var http_request = new XMLHttpRequest();
				http_request.onreadystatechange = function() { func(http_request); };
				http_request.open('GET', url, true);
				http_request.setRequestHeader("Connection", "close");
				http_request.setRequestHeader("Keep-Alive", "");
				http_request.send(null);
			}

}


var $effects = {

			toggleFade: function(elid) {
					if ($id(elid).style.display == 'none'){
					this.fadeIn(elid);
					}else{
					this.fadeOut(elid);
					}
			},
			
			toggleShow: function(elid) {
					if ($id(elid).style.display == 'none'){
						$id(elid).style.display = 'block';
					}
					else{
						$id(elid).style.display = 'none';
					}
			},
			


			fadeOut : function(elid) {
				var opacs = ["0",".1",".2",".3",".4",".5",".6",".7",".8",".9","1"];
				opacs.reverse();
					for (var i = 0; i < 11; i++) {
						setTimeout('$id(\''+elid+'\').style.opacity = "'+opacs[i]+'";', i * 40);
					}
						setTimeout('$id(\''+elid+'\').style.display = "none";', i * 40);
			},

				
			fadeIn : function(elid) {
				var opacs = [".1",".2",".3",".4",".5",".6",".7",".8",".9","1"];
				$id(elid).style.opacity = '0';
				$id(elid).style.display = 'block';
				for (var i = 0; i < 10; i++) {
						setTimeout('$id(\''+elid+'\').style.opacity = "'+opacs[i]+'";', i * 40);
					}
				
			},
				
			hide : function(elid,delay){
				setTimeout('$effects.fadeOut(\''+elid+'\');',parseInt(delay)*1000)	
			},
			
			initializedrag : function(e,main_id,drag_id){
				var crossobj=$id(main_id) ;
				var firedobj= e.target ;
				var topelement= "body" ;
				while (firedobj.tagName!=topelement.toUpperCase() && firedobj.id!=drag_id){
					firedobj=firedobj.parentNode ;
				}
		
				if (firedobj.id==drag_id){
					var offsetx= e.clientX ;
					var offsety= e.clientY ;
		
					var tempx=parseInt(crossobj.style.left) ;
					var tempy=parseInt(crossobj.style.top) ;
		
					dragapproved=true ;
					document.onmousemove=(function(e){
												if (dragapproved){
													crossobj.style.left=tempx+e.clientX-offsetx+"px"
													crossobj.style.top=tempy+e.clientY-offsety+"px"
													return false
												}
											return false;
											}) 
				}
			
			},
			
			pos2Anchor : function(obj,e,commentbox) {
					
			
					var tempX = 0;
					var tempY = 0;
					var offset = 5;
										
					obj = $id(obj);
			 
					tempX = e.pageX;
					tempY = e.pageY;
					if (tempX < 0){tempX = 0}
					if (tempY < 0){tempY = 0}
					
					
					
					obj.style.top  = (tempY + offset) + 'px';
					if (commentbox == true){
						obj.style.left = ((tempX + offset)+0) + 'px';	
					}
					else {
						obj.style.left = ((tempX + offset)-155) + 'px';
					}
			
					
			},
			
			show : function(obj,show) {

					$id(obj).style.display = show ? 'block' : 'none';
					//obj.style.visibility = show ? 'visible' : 'hidden';
			},
			
			
			getAnchorPos: function(anchorname) {
					// This function will return an Object with x and y properties
					var useWindow=false;
					var coordinates=new Object();
					var x=0,y=0;
					var use_gebi=false, use_css=false, use_layers=false;
					if (document.getElementById) { use_gebi=true; }
					else if (document.all) { use_css=true; }
					else if (document.layers) { use_layers=true; }
					if (use_gebi && document.all) {
						x=this.AnchorPosition_getPageOffsetLeft(document.all[anchorname]);
						y=this.AnchorPosition_getPageOffsetTop(document.all[anchorname]);
						}
					else if (use_gebi) {
						var o=document.getElementById(anchorname);
						x=this.AnchorPosition_getPageOffsetLeft(o);
						y=this.AnchorPosition_getPageOffsetTop(o);
						}
					else if (use_css) {
						x=this.AnchorPosition_getPageOffsetLeft(document.all[anchorname]);
						y=this.AnchorPosition_getPageOffsetTop(document.all[anchorname]);
						}
					else if (use_layers) {
						var found=0;
						for (var i=0; i<document.anchors.length; i++) {
							if (document.anchors[i].name==anchorname) { found=1; break; }
						}
						if (found==0) {
							coordinates.x=0; coordinates.y=0; return coordinates;
							}
						x=document.anchors[i].x;
						y=document.anchors[i].y;
						}
					else {
						coordinates.x=0; coordinates.y=0; return coordinates;
						}
					coordinates.x=x;
					coordinates.y=y;
					return coordinates;
			},
			
			AnchorPosition_getPageOffsetLeft: function(el) {
					var ol=el.offsetLeft;
					while ((el=el.offsetParent) != null) { ol += el.offsetLeft; }
						return ol;
			},
			
			AnchorPosition_getWindowOffsetLeft: function(el) {
					return this.AnchorPosition_getPageOffsetLeft(el)-document.body.scrollLeft;
			},
			
			AnchorPosition_getPageOffsetTop: function(el){
					var ot=el.offsetTop;
					while((el=el.offsetParent) != null) { ot += el.offsetTop; }
							return ot;
			},
			
			AnchorPosition_getWindowOffsetTop: function(el) {
					return this.AnchorPosition_getPageOffsetTop(el)-document.body.scrollTop;
			}		
					
					
		}



var $utils = {

			trim : function(str){
				if(str){
					return str.replace(/^\s*|\s*$/g,'');
				}
				else{
					return "";
				} 
			},

			replace : function(str,txt1,txt2){
				return str.replace(new RegExp(txt1,'g'),txt2);
			},
			
			instr : function(strSearch, charSearchFor){
				for (i=0; i < Len(strSearch); i++){
					if (charSearchFor == Mid(strSearch, i, 1)){
						return i;
					}
				}
			return -1;
			},

			
				
			console : function(txt){
				  Components.utils.reportError(txt);
			},
			
			addEvent : function(event, elid, handler, bubble) {
				elid.addEventListener(event, handler, bubble);
			},
				
			delEvent : function(event, elid, handler, bubble) {
				elid.removeEventListener(event, handler, bubble);
			},

			qs : function(Query_String_Name,url) {
			var i, pos, argname, argvalue, queryString, pairs;
			if(!url){url = location.href}
			queryString = url.substring(url.indexOf("?")+1);
			pairs = queryString.split("&");
			for (i = 0; i < pairs.length; i++) { 
				pos = pairs[i].indexOf('='); 
					if (pos == -1) {
						continue; 
					}
				argname = pairs[i].substring(0,pos);
				argvalue = pairs[i].substring(pos+1); 
				if (argname == Query_String_Name) {
					// return unescape(argvalue.replace(/\+/g, " "));
					return argvalue;
				}
			}
			return false;
			},
			
			inc : function(filename){
				var jssubscript_Include = new  Components.Constructor('@mozilla.org/moz/jssubscript-loader;1','mozIJSSubScriptLoader');
				var jssubscript_gInc = new jssubscript_Include();
				jssubscript_gInc.loadSubScript(filename);
			},
			
			set_title : function(obj,txt){
				obj.title = txt;
			},
			
			showImage: function(img){ 
				return (function(){ img.style.display=''; }) 
			},
			
			cutHex: function(h) { return (h.charAt(0)=="#") ? h.substring(1,7) : h},

			Hex2RGB: function(strhex){
				var rr = parseInt((this.cutHex(strhex)).substring(0,2),16) ;
				var gg = parseInt((this.cutHex(strhex)).substring(2,4),16);
				var bb = parseInt((this.cutHex(strhex)).substring(4,6),16);
				var rgb = [rr,gg,bb];
				return rgb;
			},
			
			encode: function(str){
				return $utils.replace(''+encodeURIComponent(str)+'',"'","%27");
			},
			
			decode: function(str){
				if (str){
					return decodeURIComponent(str);
				}
				else {
					return '';
				}
				
			},
			get_deliciousUser: function(){
				var domain  = ".delicious.com";
				var name    = "_user";
				var user    = "";
				var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager);
				var iter = cookieManager.enumerator;
				while ( iter.hasMoreElements() ){
					cookie = iter.getNext();
					if ( cookie instanceof Components.interfaces.nsICookie && domain.endsWith(cookie.host) && (cookie.name == name)){
						user = cookie.value.split(/%20/)[0];
						break;
					}
				}

				return user;
			},
			
			appendjs : function(filename,doc,elid){
				if (!doc){doc = document;}
				if (!elid){elid = 'head';}
				var element=doc.createElement('script');
				element.type = 'text/javascript';
				//element.innerHTML = '';
				element.setAttribute('src',filename);
				doc.getElementsByTagName(elid).item(0).appendChild(element);
			},
			
			
			appendjsHTML : function(txtHTML,doc,elid){
				if (!doc){doc = document;}
				if (!elid){elid = 'head';}
				var element=doc.createElement('script');
				element.type = 'text/javascript';
				element.innerHTML = txtHTML ;
				//element.setAttribute('src',filename);
				doc.getElementsByTagName(elid).item(0).appendChild(element);
			},
			
			appendcssfile : function(filename,doc,elid){
				if (!doc){doc = document;}
				if (!elid){elid = 'head';}
				var element=doc.createElement('link');
				element.type = 'text/css';
				element.setAttribute('rel','stylesheet');
				element.setAttribute('href',filename);
				//element.innerHTML = '';
				doc.getElementsByTagName(elid).item(0).appendChild(element);
			},
			
			appendFavIcon : function(filename,doc){
				if (!doc){doc = document;}
				var element=doc.createElement('link');
				element.type = 'image/x-icon';
				element.setAttribute('rel','shortcut icon');
				element.setAttribute('href',filename);
				//element.innerHTML = '';
				doc.getElementsByTagName('head').item(0).appendChild(element);
			
			
			}
			
			
			
			
			

			
			

			
}


var $stars = {

		add : function(img,urlmd5,url,tags,title,notes,dt){
				if((img.src).match('star_on')){
					img.src = (img.src).replace('_on','_off');
					img.setAttribute('title','Star this bookmark');
					img.setAttribute('onclick','$stars.add(this,\''+urlmd5+'\',\''+url+'\',\''+tags+'\',\''+title+'\',\''+notes+'\',\''+dt+'\');');
				}
				else{
					img.src = (img.src).replace('_off','_on'); 
					img.setAttribute('title','Unstar this bookmark');
					img.setAttribute('onclick','$stars.remove(this,\''+urlmd5+'\',\''+url+'\',\''+tags+'\',\''+title+'\',\''+notes+'\',\''+dt+'\');');
				}
				var CurStarsTMP = $prefs.get('stars.list');
				$prefs.set('stars.list',''+urlmd5+' '+url+' '+title+' '+tags+' '+notes+' '+dt+' END_'+urlmd5+'|'+CurStarsTMP+'')
				//$utils.console(''+urlmd5+' '+url+' '+title+' '+tags+' '+notes+'|'+CurStarsTMP+'');
		},
		
		remove : function(img,urlmd5,url,tags,title,notes,dt){
				if((img.src).match('star_on')){
					img.src = (img.src).replace('_on','_off');
					img.setAttribute('title','Star this bookmark');
					img.setAttribute('onclick','$stars.add(this,\''+urlmd5+'\',\''+url+'\',\''+tags+'\',\''+title+'\',\''+notes+'\',\''+dt+'\');');
				}
				else{
					img.src = (img.src).replace('_off','_on'); 
					img.setAttribute('title','Unstar this bookmark');
					img.setAttribute('onclick','$stars.remove(this,\''+urlmd5+'\',\''+url+'\',\''+tags+'\',\''+title+'\',\''+notes+'\',\''+dt+'\');');
				}
				var CurStarsTMP = $prefs.get('stars.list');
				$prefs.set('stars.list',''+(''+CurStarsTMP+'').replace((''+(''+$prefs.get('stars.list')+'').match(''+urlmd5+'.*END_'+urlmd5+'\\|')+''),'')+'');
		},
		
		show_header : function(obj){
			if (typeof obj[0] !== 'undefined'){
				var headertxt = '<a href="#" title="click to remove all your stars" onclick="$stars.remove_all();return false;">&raquo; Remove all my stars</a>';
				return headertxt ;
			}
			else {
				var helpIMG = 'data:image/png;base64,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';

				var headertxt = 'Star your Insipid bookmarks and come back here to see them!<br/>The bookmarks will be saved locally in your preferences.<br/><img style="margin:20px;padding:5px;border: 1px outset #377700;" src="'+helpIMG+'" border="0"/>';
				$id('nav').style.display= 'none';
				return headertxt ;
			}
		},
		
		remove_all : function(){
		if (confirm('Are you sure you want to delete all your stars?')){
		$prefs.set('stars.list','');
		document.location.href  = Inspd_JSON_HOME_PAGE ;
		}
		else {
		return false;
		}
		return false;
		}
		
		
			




}

var $conditions = { 
		
		page_with_qs_tags : function() {
				if ($utils.qs('tag') && $utils.qs('tag').split('+').length < 2){
					return true ;
				}
				else {
					return false ; 
				}
		},
		gate : function(){
				if (!document.location.href.match(Inspd_JSON_BOOKMARKS_PAGE) && $utils.qs('tag')){
					document.location.href = Inspd_JSON_BOOKMARKS_PAGE+'?tag='+$utils.qs('tag')+'' ;
				}
				
				else if (!document.location.href.match(Inspd_JSON_ALLITEMS_PAGE) && $utils.qs('q')){
					document.location.href = Inspd_JSON_ALLITEMS_PAGE+'?q='+$utils.qs('q')+'' ;
				}
				else if (document.location.href.match(Inspd_JSON_HOME_PAGE) && $utils.qs('tag')){
					document.location.href = Inspd_JSON_BOOKMARKS_PAGE+'?tag='+$utils.qs('tag')+'' ;
				}
				else if (document.location.href.match(Inspd_JSON_HOME_PAGE) && $utils.qs('q')){
					document.location.href = Inspd_JSON_ALLITEMS_PAGE+'?q='+$utils.qs('q')+'' ;
				}
				else if (document.location.href.match(Inspd_JSON_ALLITEMS_PAGE) && $utils.qs('q') == ''){
					document.location.href = Inspd_JSON_HOME_PAGE ;
				}
				else if (document.location.href.match(Inspd_JSON_BOOKMARKS_PAGE) && $utils.qs('tag') == ''){
					document.location.href = Inspd_JSON_HOME_PAGE ;
				}
		},
		
		getProtocol : function(url,protocol_name){
				if(url.split(':')[0] == protocol_name){
					return true ;
				}
				else{
					return false;
				}
		
		
		}
		
		
		

}


var $delpage = {
	
	draw_postToInsipid : function(doc){
		var posts = this.getNodes("//div[@class='data']//h4", doc,doc);
		for (var i = 0, k = posts.snapshotLength ; i < k ; i++) {
			var row = posts.snapshotItem(i) ; 
			var url , title , tags, user ;
		    var extended = '';
		    var metaNode = null;
	        var tagsNode = null ;
	        var original_save_link_href = row.getElementsByTagName('a')[1].getAttribute('href'); 
	        original_save_link_href = original_save_link_href.replace(/^\/save;_y(.*)\?/,$prefs.get('defurl')+'?op=add_bookmark&');
	        original_save_link_href = original_save_link_href.replace(/jump=(.*)original_user=/,'copy_user=');
	        original_save_link_href = original_save_link_href.replace(/%20/g,'+');
	        var new_save_link_href = original_save_link_href ; 
	        row.innerHTML += ' <a class="inlinesave" target="_blank" title="save this bookmark to Insipid" href="'+new_save_link_href+'">SAVE TO INSIPID</a>';
		}
		
	},
	
	getNodes: function(what, where, doc) {
		return doc.evaluate(what, where, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	}

}

var $alt_Post = {

		trigger : function(doc){
			//$utils.appendFavIcon('chrome://inspd/content/v2/json/images/inspd_icon7_posttoinsipid_icon_1616.ico',doc);
			$utils.appendcssfile(''+Inspd_BASE_ALTPOST_URL+'altpost.css',doc);
			$utils.appendjsHTML(''+$alt_Post.write_jsoptions()+'',doc);
			
			var title_tmp = doc.evaluate("//div[@class='title']",doc,null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0).innerHTML ;
			doc.evaluate("//div[@class='title']",doc,null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0).innerHTML = '<span style="color:#000000;">Post to</span> '+title_tmp+'<span style="color:#000000;">.</span>&nbsp;&nbsp;<span style="-moz-box-sizing:border-box;-moz-border-radius: 6px 6px 9px 9px ;padding: 5px;color:#377700;background-color:#FFFFCC;font-size:80%;border:1px solid #FFFF9D;" id="title_line2">With tag autocompletion.</span>';
			
			doc.evaluate("//div[@class='search']",doc,null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0).innerHTML = '';
			
			doc.forms[0].getElementsByTagName('input')[1].setAttribute('value',(''+(''+doc.forms[0].getElementsByTagName('input')[1].value+'').replace(/</g,'&lt;')+'').replace(/>/g,'&gt;'));
			
			if (doc.evaluate("//span[@class='formtext']",doc,null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0).innerHTML.match('already bookmarked')){
				//'this is an edit'
				var linkdelete = ''+$prefs.get('defurl')+'?op=delete_bookmark&id=\'+document.forms[0].id.value+\'';
				doc.forms[0].innerHTML += '&nbsp;&nbsp;&nbsp;<a onfocus="this.blur();" title="delete this bookmark" style="font-size:70%;color:#ff0000;" href="#" onclick="if (confirm(\'Are you sure you want to delete this bookmark?\')){document.location.href= \''+linkdelete+'\';}else{return false;}">&raquo; delete this bookmark</a>';
			}
			else{
				doc.evaluate("//span[@class='formtext']",doc,null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0).innerHTML ='<span style="color:green;">URL (new bookmark):</span>';
			
			}
			
			doc.forms[0].innerHTML +='<div class="postui" id="main"><table><tr style="visibility:hidden;" id="suggestions">'+
			'<td class="rs"></td><td colspan="2"><div id="suggest"></div></td></tr></table>'+
			'<ul class="bundles" style="list-style-type:none;">'+
			'<li class="bundle fold" id="copy"><div class="label"><span></span></div></li>'+
			'<li class="bundle fold" id="rec"><div class="label"><span></span></div></li>'+
			'<li class="bundle fold" id="pop" style="line-height:1.5;display:block"><div class="label"><span id="poptags_msg" class="poptags_msg"></span></div></li>'+
			'<li class="bundle fold" id="pop3" style="line-height:1.5;margin-top:10px;"><div class="label"><span id="pop3tags_msg" style="color:#000000;display:block;"></span></div></li>'+
			'<li class="bundle fold" id="pop2" style="line-height:1.5;margin-top:10px;"><div class="label"><span id="pop2tags_msg" style="color:#000000;display:block;"></span></div></li>'+
			'<li class="bundle fold" id="yourtags"><span class="smaller right" id="sort"><!--&raquo; sort: <a id="alphasort" class="noclicky" href="javascript:sort(\'alpha\')">alphabetically</a> | <a id="freqsort" href="javascript:sort(\'freq\')">by frequency</a>--></span><div class="label"><span><!--my tags--></span></div><div id="alpha"></div><div id="freq"></div></li>'+
			'<li class="bundle fold" id="network"><div class="label"><span></span></div></li></div>'+
			'</ul>';
			
			$utils.appendjs('chrome://inspd/content/inc/vars.js',doc)
			$utils.appendjs('chrome://inspd/content/inc/md5.js',doc)
			$alt_Post.setInitialUI(doc);
			//$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost_trigger.js',doc)
			
		},
		
		write_jsoptions : function(){
		
			var jstxt = 'window.focus();var tagRec = [];var tagPop = [];var tagPop2 = []; var tagPop3 = [];  var tagFor = [];var copyuser = "" ; var copytags = [];'; 
			
			$utils.get_deliciousUser() ? jstxt +='var Inspd_delicious_username=\''+$utils.get_deliciousUser()+'\';' : jstxt+='';
			return jstxt ;
		},
		
		setInitialUI : function(doc){
			var url = doc.getElementsByTagName('input')[0].getAttribute('value') ;
			if($prefs.get('delintegratecommontags') != '0' && !url.match(''+$prefs.get('defurl')+'') && !url.match('^chrome|about|color\\:') && url.match('^http||https\\://') && !url.match('^.*\\://(localhost|127.0.0.|192.168.0.|10.0.0.)') ){
				doc.evaluate("//span[@class='poptags_msg']",doc,null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0).innerHTML += '<span style="color:#377700;font-weight:bold;background-color:#FFFFCC;-moz-box-sizing:border-box;-moz-border-radius: 5px 5px 5px 5px ;padding:5px;border:1px solid #FFFF9D;">getting popular tags for this url from del.icio.us ....</span>';
				
				$utils.appendjsHTML('Inspd_delintegrate_commontags = 1;',doc);
				$alt_Post.GetPopTagsFromDeliciousChooser(doc,''+$prefs.get('delintegratecommontags')+'');
			
			
			}
			else{
				$utils.appendjsHTML('Inspd_delintegrate_commontags = 0;',doc);
				$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost_trigger.js',doc) ;
			}
		},
		
		
		
		GetPopTagsFromDeliciousPersonal : function(doc){
			//var urlDeliciousPersonal = 'http://del.icio.us/'+$utils.get_deliciousUser()+'?v=4&noui&jump=close&url='+doc.getElementsByTagName('input')[0].getAttribute('value')+'';
			var urlDeliciousPersonal = 'http://feeds.delicious.com/v2/json/tags/'+$utils.get_deliciousUser() ;


						
			var http_requestDeliciousPersonal = new XMLHttpRequest();
			http_requestDeliciousPersonal.onreadystatechange = function() { 
				if (http_requestDeliciousPersonal.readyState == 4) {
					try{
						if (http_requestDeliciousPersonal.status == 200) {
							//if(http_requestDeliciousPersonal.responseText.match('tagPop = \\[.*\\]') != 'tagPop = []'){
								//$utils.appendjsHTML('Inspd_delintegrate_commontags_found = 1;'+(''+http_requestDeliciousPersonal.responseText.match('var tagPop = \\[.*\\]')+'').toLowerCase()+';tagPop = tagpop;',doc) ;
								var tags_txt = http_requestDeliciousPersonal.responseText ; 
								tags_txt = tags_txt.replace(/\{|\}|\:[0-9]{1}|\:[0-9]{2}|\:[0-9]{3}|\:[0-9]{4}/g,'');						
								$utils.appendjsHTML('Inspd_delintegrate_commontags_found = 1; tagPop = ['+tags_txt.toLowerCase()+'];',doc) ;
							//}
							//else{
								//$utils.appendjsHTML('Inspd_delintegrate_commontags_found = 2;',doc);
							//}
							$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost_trigger.js',doc) ;
						} 						
						else {
							//alert(e);
							$utils.appendjsHTML('Inspd_delintegrate_commontags_found = 3;',doc);
							$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost_trigger.js',doc) ;
						}
					}
					catch(e){	
						//alert(e);
						$utils.appendjsHTML('Inspd_delintegrate_commontags_found = 3;',doc);
						$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost_trigger.js',doc) ;
					}
				}
			};
			//http_requestDeliciousPersonal.overrideMimeType('text/xml');
			http_requestDeliciousPersonal.open('GET', urlDeliciousPersonal, true);		
			http_requestDeliciousPersonal.setRequestHeader("Connection", "close");
			http_requestDeliciousPersonal.setRequestHeader("Keep-Alive", "");
			http_requestDeliciousPersonal.send(null);
		},
		
		GetPopTagsFromDeliciousFetchURL : function(doc){
			//$utils.inc('chrome://inspd/content/inc/md5.js');				
			var urlDeliciousURL = 'http://delicious.com/url/'+hex_md5(''+doc.getElementsByTagName('input')[0].getAttribute('value')+'')+'?settagview=cloud';
			
			var http_requestDeliciousURL = new XMLHttpRequest();
			http_requestDeliciousURL.onreadystatechange = function() { 
				if (http_requestDeliciousURL.readyState == 4) {
					try{
						if (http_requestDeliciousURL.status == 200) {
							//var alphacloud_txt = (''+http_requestDeliciousURL.responseText.match(/<div class="alphacloud">[\s\S]+/)+'').replace(/<div class="sidebar-break">[\s\S]+/,'');
							var alphacloud_txt = (''+http_requestDeliciousURL.responseText.match(/<ul class="list">[\s\S]+/)+'').replace(/<div class="clr">[\s\S]+/,'');
							//alert(alphacloud_txt);
							
							if(http_requestDeliciousURL.responseText.match('There is no del.icio.us history for this url\\.')){
								$utils.appendjsHTML('Inspd_delintegrate_commontags_found = 2;',doc);
								$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost_trigger.js',doc) ;
							}
							else if(alphacloud_txt){
								$utils.appendjsHTML('Inspd_delintegrate_commontags_found = 1;var Inspd_delintegrate_commontags_found_url=1;',doc);
								doc.evaluate("//div[@class='title']",doc,null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0).innerHTML += '<span id="hidden_span_Inspd_delintegrate_commontags_found_1" style="display:none;">'+alphacloud_txt+'</span>';
								$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost_trigger.js',doc) ;
								
							}
							else {
								//$utils.console('well something else is going on!');
								$utils.appendjsHTML('Inspd_delintegrate_commontags_found = 5;',doc);
								$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost_trigger.js',doc) ;
							}
						} 						
						else {
								//alert('error!');
								$utils.appendjsHTML('Inspd_delintegrate_commontags_found = 3;',doc);
								$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost_trigger.js',doc) ;
						}
					}
					catch(e){	
							//$utils.console('errror:: '+e);
							//alert('errror:: '+e);
							$utils.appendjsHTML('Inspd_delintegrate_commontags_found = 3;',doc);
							$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost_trigger.js',doc) ;
							
					}
				}
			};
			//http_requestDeliciousURL.overrideMimeType('text/xml');
			http_requestDeliciousURL.open('GET', urlDeliciousURL, true);		
			http_requestDeliciousURL.setRequestHeader("Connection", "close");
			http_requestDeliciousURL.setRequestHeader("Keep-Alive", "");
			http_requestDeliciousURL.send(null);
		
		}, 
		
		
		
		
		
		GetPopTagsFromDeliciousChooser : function(doc,sysname){
				if (sysname == 'personal'){
					if($utils.get_deliciousUser()){
						$alt_Post.GetPopTagsFromDeliciousPersonal(doc);
					}
					else{
						$utils.appendjsHTML('Inspd_delintegrate_commontags_found = 4;',doc);
						$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost_trigger.js',doc) ;
					}
				}
				else if(sysname=='url'){
					$alt_Post.GetPopTagsFromDeliciousFetchURL(doc);
				}
		}
	
		
		





}


var $$date = {

		year : function(mydate){
				return  ((''+mydate.split(" ")[0]+'').split("-")[0]) ;
		},
		
		month : function(mydate){
				var monthnames = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
				return monthnames[parseInt(''+((''+mydate.split(" ")[0]+'').split("-")[1]).replace(/^0/,'')+'')];
		},
		
		day : function(mydate){
				return ((''+mydate.split(" ")[0]+'').split("-")[2].replace(/^0/,''));
		}
}

String.prototype.endsWith = function (s) {
	if ( this.length < s.length )
		return false;
	return this.substr( this.length-s.length ) == s;
}

String.prototype.beginsWith = function (s) {
	if ( this.length < s.length )
		return false;
	return this.substr( 0, s.length ) == s;
}





var qs_count, qs_page, qs_tag,backfromlast;
if ($utils.qs('setcount')){ qs_count = $utils.qs('setcount'); $prefs.set('defcount',''+$utils.qs('setcount')+'') } else { qs_count = $prefs.get('defcount'); }
if ($utils.qs('page') && parseInt($utils.qs('page')) != 0 ){ qs_page = parseInt($utils.qs('page')); } else { qs_page = 1; }
if ($utils.qs('tag')){ qs_tag = '&tag='+$utils.qs('tag')+''; } else if ($utils.qs('q')){qs_tag = '&q='+$utils.qs('q')+''; } else { qs_tag = ''; }




