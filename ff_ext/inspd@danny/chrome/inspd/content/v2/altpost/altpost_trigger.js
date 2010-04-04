function $id(id){ return document.getElementById(id) }
	

	
var $utils = {
	
	addEvent : function(event, elid, handler, bubble) {
				elid.addEventListener(event, handler, bubble);
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
	
	replace : function(str,txt1,txt2){
				return str.replace(new RegExp(txt1,'g'),txt2);
	},
	trim : function(str){
				if(str){
					return str.replace(/^\s*|\s*$/g,'');
				}
				else{
					return "";
				} 
	},
				
	decode: function(str){
		return decodeURIComponent(str);
	},
			
	encode: function(str){
		return encodeURIComponent(str);
	},
	
	qs : function(Query_String_Name) {
			var i, pos, argname, argvalue, queryString, pairs;
			queryString = location.href.substring(location.href.indexOf("?")+1);
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
	}
			
			
			
		
	
}

var $effects = {
	
	fadeOut : function(elid) {
		var opacs = ["0",".1",".2",".3",".4",".5",".6",".7",".8",".9","1"];
		opacs.reverse();
		for (var i = 0; i < 11; i++) {
			setTimeout('$id(\''+elid+'\').style.opacity = "'+opacs[i]+'";', i * 40);
			}
			setTimeout('$id(\''+elid+'\').style.display = "none";', i * 40);
			},
}



var $altp = {
	initPage : function(){
		$altp.setInitialFormValues();
		
		if(typeof(Inspd_delintegrate_commontags_found_url) !='undefined'){
			if(Inspd_delintegrate_commontags_found_url==1){
				$utils.appendjsHTML($altp.scrap_tagPop(),document);
			}
		}
		
		$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost1.js',document)
		$utils.appendjs(''+Inspd_BASE_ALTPOST_URL+'altpost2_popup.js',document)
			
		$utils.appendjsHTML($altp.scrapTags(),document);
		
		if ($utils.qs('copytags') && $utils.qs('copytags') != 'null'){
			$utils.appendjsHTML($altp.scrap_tagCopyUser(),document);
		}
		
		$altp.setSwapForRecentLinks();
		
		setTimeout('init();',1);
		
	},
	
	
	scrapTags : function(){
		var txtTagsObj = 'loadTags({';
		var tagsfromtbl = document.evaluate("//table[@class='tagsummarytable']",document,null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0);
		var j = tagsfromtbl.getElementsByTagName('a').length ;
		for(var i = 0;i<j;i++){
				//tagsfromtbl.getElementsByTagName('a')[i].setAttribute('onclick','swap(this.innerHTML);return false;');
				txtTagsObj +='"'+tagsfromtbl.getElementsByTagName('a')[i].innerHTML+'":'+tagsfromtbl.getElementsByTagName('span')[i].innerHTML.match(/\d+/)+'';
				if (i < j-1 ){txtTagsObj += ',';}
		}
		txtTagsObj += '})';	
		return txtTagsObj;
	},
	
	scrap_tagPop : function(){
		try{
		var txtTagsObj = 'tagPop = [';
		// hidden_span_Inspd_delintegrate_commontags_found_1
		var tagsfromtbl = document.evaluate("//span[@id='hidden_span_Inspd_delintegrate_commontags_found_1']",document,null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null);
		
		
		//alert(tagsfromtbl.snapshotLength);
		//alert(tagsfromtbl.snapshotItem(0).innerHTML);
		
		var tagsfromtbl_all_anchors = tagsfromtbl.snapshotItem(0).getElementsByTagName('span') ; 
		var j = tagsfromtbl_all_anchors.length ;
		
		if (j == 0 ){
			var txtTagsObj = 'Inspd_delintegrate_commontags_found = 2';
			return txtTagsObj; 
		}
		for(var i = 0;i<j;i++){
				txtTagsObj +='"'+$utils.trim(tagsfromtbl_all_anchors[i].title.replace(/\((.*)\)/,'')).toLowerCase()+'"';
				if (i < j-1 ){txtTagsObj += ',';}
		}
		txtTagsObj += ']';
		// alert(txtTagsObj);
		}
		catch(e){
			//alert(e);
			var txtTagsObj = 'Inspd_delintegrate_commontags_found = 2';
			//alert(e);
		}
		
		return txtTagsObj;
	},
	
	
	scrap_tagCopyUser : function(){
		
		if ($utils.qs('copytags') && $utils.qs('copytags') != 'null'){
			var txtTagsObj = 'tagPop3 = [';
			var tagsfromtbl = ($utils.decode($utils.qs('copytags'))).split('+') ;		
			var j = tagsfromtbl.length ;
			for(var i = 0;i<j;i++){
				txtTagsObj +='"'+(tagsfromtbl[i]).toLowerCase()+'"';
					if (i < j-1 ){txtTagsObj += ',';}
			}
			txtTagsObj += ']';
			return txtTagsObj;
		}
	},
	
	
	
	
	setInitialFormValues : function(){
		//document.forms[0].setAttribute('id','InspdForm');
		//document.forms[0].setAttribute('name','InspdForm');
		document.forms[0].url.setAttribute('id','url');		
		document.forms[0].title.setAttribute('id','title');
		document.forms[0].description.setAttribute('id','description');	
		document.forms[0].tags.setAttribute('id','tags');				
		document.forms[0].tags.setAttribute('autocomplete','off');
		
	
	},
	
	setSwapForRecentLinks : function(){
		var alldivs = document.evaluate("//div[@class='bookmarkOperations']",document,null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null);
		var j = 30 ;
		var jstxt = '';
		for (var i=0; i<j; i++) {
			var div = alldivs.snapshotItem(i);
			for(var k = 0;k<div.getElementsByTagName('a').length;k++){
					//div.getElementsByTagName('a')[k].setAttribute('onclick','swap(this.innerHTML);return false;');
						if ( div.getElementsByTagName('a')[k].className == 'bookmarkTag'){
							jstxt += ''+div.getElementsByTagName('a')[k].innerHTML+' ';
						}
			}
		}
		//jstxt += '';
		$utils.appendjsHTML('tagPop2 = ['+$altp.removeDuplicateTags($utils.trim(jstxt))+'];',document);
	},
	
	removeDuplicateTags : function(strtxt) { 
		var temp = strtxt; 
		var array = temp.split(" "); 
		array.sort(); 
		temp = array.join(" "); 
		do { 
			var newTemp = temp; 
			var temp = newTemp.replace(/\s(\w+\s)\1/, " $1"); 
		} while (temp.length != newTemp.length); 
		temp = temp.replace(/^(\w+\s)\1/, "$1"); 
		temp = temp.replace(/(\s\w+)\1$/, "$1"); 
		var orig = strtxt.split(" "); 
		var finalStr = ""; 
		for (var i=0; i<orig.length; i++) { 
			if (temp.indexOf(orig[i] + " ") != -1) { 
				finalStr += orig[i] + " "; 
				temp = temp.split(orig[i] + " ").join(" "); 
			} else if (temp.indexOf(" " + orig[i]) != -1) { 
				finalStr += orig[i] + " "; 
				temp = temp.split(" " + orig[i]).join(" "); 
			} 
		} 
		if (finalStr.substring(finalStr.length-1, finalStr.length) == " ") { 
			finalStr = finalStr.substring(0, finalStr.length-1); 
		} 
		var finalArray = '';
		var newArray = finalStr.split(' ');
		for(var j=0;j<newArray.length;j++){
				//if (newArray[j] != ''){
					finalArray +='"'+newArray[j]+'"';
					if(j<((newArray.length)-1)){finalArray +=',';}
				//}
		}
		// return finalStr; 
		return finalArray; 
	}	
	


}

$altp.initPage();
//init();
//$utils.addEvent('load', window, function() { $altp.initPage(); }, false);

