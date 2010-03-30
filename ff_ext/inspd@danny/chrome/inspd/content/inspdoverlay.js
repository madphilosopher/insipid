var $buttons = {
	
	open_in_new_tab: function(url){
	getBrowser().selectedTab = getBrowser().addTab(url);
	},
	
	open_in_same_tab: function(url){
	top.content.document.location = url;
	},
	
	open_as_popup: function(url){
	var mypopup = window.open(url,'popuppage','toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=1,width=800,height=400,left=30,top=30');
	mypopup.focus();
	},
	
	
	focus: function(inspd_obj){
		inspd_obj.focus();
	},
	
	
	cclick : function(aEvent,url){
	if (aEvent.button == 2){
		this.open_as_popup(url);
	}
    else if ((aEvent.ctrlKey) || (aEvent.button == 1) || (aEvent.metaKey)){
		this.open_in_new_tab(url);
	} 
	else {
		this.open_in_same_tab(url);
		this.focus(window._content);
	}
	
	},
	
	
	click : function (aEvent,actionname) {
	
	if ($utils.trim($prefs.get('defurl')) == "") {
		$Chrome.set_options_action('defurl');			
	}
	
	if ($utils.trim($prefs.get('defurl')) != "") {
		if (actionname == 'home') {
			if ($prefs.get('searchstyle') == 'json'){
				this.cclick(aEvent,Inspd_JSON_HOME_PAGE);
			}
			else {
				this.cclick(aEvent,$prefs.get('defurl'));
			}
		}
		else if (actionname =='posttoinsipid'){
				var redirect = ''; if (aEvent.button == 0){redirect = 'true';}else{redirect = 'false';}
				
				var url = '';
				if ($prefs.get('altpost') == '2'){
					url = ''+Inspd_ALPOST_Q_PAGE+'?op=add_bookmark&url='+encodeURIComponent(window._content.location.href)+'&title='+encodeURIComponent(window._content.document.title)+'&redirect='+redirect+'';
				}
				else{
					url = ''+$prefs.get('defurl')+'?op=add_bookmark&url='+encodeURIComponent(window._content.location.href)+'&title='+encodeURIComponent(window._content.document.title)+'&redirect='+redirect+'';
				}
				this.cclick(aEvent,url);
		
		}
		else if (actionname =='mytagcloud'){
				if ($prefs.get('searchstyle') == 'json'){
					this.cclick(aEvent,Inspd_JSON_CLOUD_PAGE);
				}
				else {
					this.cclick(aEvent,$prefs.get('defurl'));
				}
		}
		
		else if (actionname =='mystars'){
			this.cclick(aEvent,Inspd_JSON_STARS_PAGE);
		}
		
		
		else if (actionname =='searchgo' && $utils.trim($id('inspd-searchbar-textbox').value) != ''){
				var q1 = ''; if ($prefs.get('defsearchselection') == 'allitems'){q1 = 'q';}else{q1 = 'tag';}
				if ($prefs.get('searchstyle') == 'json'){
					if ($prefs.get('defsearchselection') == 'mytags' && $utils.trim($id('inspd-searchbar-textbox').value).match("\\+") ){
					alert('Plus (\'+\') sign will not work while viewing related tags.\nPlease remove it or search your bookmarks instead.');
					return false;
					}
					
					else {
						
						this.cclick(aEvent,Inspd_BASE_JSON_URL+$prefs.get('defsearchselection')+'.html?'+q1+'='+$id('inspd-searchbar-textbox').value);
					}
				}
				else {
					
					this.cclick(aEvent,$prefs.get('defurl')+'?'+q1+'='+$id('inspd-searchbar-textbox').value);
				}
				if ($prefs.get('searchbar.autocomp') == '1'){
					// var inspd_formhistory1 = Components.classes['@mozilla.org/satchel/form-history;1'].getService(Components.interfaces.nsIFormHistory);
					var inspd_formhistory1 = Components.classes["@mozilla.org/satchel/form-history;1"].getService (Components.interfaces.nsIFormHistory ? Components.interfaces.nsIFormHistory : Components.interfaces.nsIFormHistory2);
					inspd_formhistory1.addEntry('inspdsearchbarq', $id('inspd-searchbar-textbox').value);
					$prefs.set('lastsearchq',$id('inspd-searchbar-textbox').value) ;
				}
				$id('inspd-searchbar-textbox').focus();
		}
		else if (actionname =='searchgotextbox' && $utils.trim($id('inspd-searchbar-textbox').value) != '' && aEvent.keyCode == aEvent.DOM_VK_RETURN ){
				this.click(aEvent,'searchgo');
		}
		
	}
	return false;
	}
	
}



var $Chrome = {

			set_icon : function(elid,prefname) {
				try{
					$id(elid).setAttribute('style',"list-style-image: url('chrome://inspd/skin/searchtb/"+elid+"-"+$prefs.get(prefname)+".png');");
					$id('inspd-searchbar-dropdown-'+$prefs.get(prefname)).setAttribute('checked','true');	
				}catch(e){}
				
			},
			
			set_defsearchselection: function(selectionval) {
				$prefs.set('defsearchselection', selectionval);
				this.set_icon('inspd-searchbar-dropdown','defsearchselection');
			},
			
			set_options_ui_all: function(){
				this.set_icon('inspd-searchbar-dropdown','defsearchselection');
				
				if ($prefs.get('searchstyle') == 'json') {
				$id('inspd-searchbar-dropdown-options-json').setAttribute('checked','true');
				}
				
				if ($prefs.get('searchbar.autocomp') == '1') {
				$id('inspd-searchbar-dropdown-options-searchbarautocomp').setAttribute('checked','true');
				}							
				
				if ($prefs.get('delintegrate') == '1') {
				$id('inspd-searchbar-dropdown-options-delintegrate').setAttribute('checked','true');
				}
				
				
				
				$id('inspd-searchbar-dropdown-options-delintegratecommontags_'+$prefs.get('delintegratecommontags')+'').setAttribute('checked','true');
							
				
				
				if ($prefs.get('bookmarks.showfavicon') == '1') {
				$id('inspd-searchbar-dropdown-options-showfavicon').setAttribute('checked','true');
				}
				
				/* ======= */
				$id('inspd-searchbar-dropdown-options-altpost_'+$prefs.get('altpost')+'').setAttribute('checked','true');
				/* ======*/
				
				
				if ($prefs.get('showgo') == '1') {
				$id('inspd-searchbar-dropdown-options-showgo').setAttribute('checked','true');
				} 
				else {
				$effects.show('inspd-searchbar-go',false);
				}
			},


			
			
			set_options_action: function(actionname,secondVal){
			
			if (actionname == 'defurl'){
				var query = prompt('Please enter the full URL of your insipid.cgi\nExample:\nhttp://localhost/insipid/insipid.cgi',''+$prefs.get('defurl')+'');
				try{
					if ($utils.trim(query)) {
						$prefs.set('defurl', query);
					}
					else {
						return false;
					}
				}catch(e){}
			}
			
			if (actionname == 'json'){
				if ($prefs.get('searchstyle') == 'json'){
					$id('inspd-searchbar-dropdown-options-json').setAttribute('checked','false');
					$prefs.set('searchstyle','classic')
				}
				else {
					$id('inspd-searchbar-dropdown-options-json').setAttribute('checked','true');
					$prefs.set('searchstyle','json')
				}
			
			}
			
			
			
			if (actionname == 'delintegrate'){
				if ($prefs.get('delintegrate') == '1'){
					$id('inspd-searchbar-dropdown-options-delintegrate').setAttribute('checked','false');
					$prefs.set('delintegrate','0');
				}
				else {
					$id('inspd-searchbar-dropdown-options-delintegrate').setAttribute('checked','true');
					$prefs.set('delintegrate','1');
				}
			
			}
			
			if (actionname == 'delintegratecommontags'){
				$id('inspd-searchbar-dropdown-options-delintegratecommontags_'+secondVal+'').setAttribute('checked','true');
				$prefs.set('delintegratecommontags',''+secondVal+'')
			
			}
			
			
			
			if (actionname == 'searchbarautocomp'){
				if ($prefs.get('searchbar.autocomp') == '1'){
					$id('inspd-searchbar-dropdown-options-searchbarautocomp').setAttribute('checked','false');
					$prefs.set('searchbar.autocomp','0');
					// var inspd_formhistory1 = Components.classes['@mozilla.org/satchel/form-history;1'].getService(Components.interfaces.nsIFormHistory);
					var inspd_formhistory1 = Components.classes["@mozilla.org/satchel/form-history;1"].getService (Components.interfaces.nsIFormHistory ? Components.interfaces.nsIFormHistory : Components.interfaces.nsIFormHistory2);
					try{
					inspd_formhistory1.removeEntriesForName('inspdsearchbarq');
					}catch(e){}
					//$prefs.set('lastsearchq','');
					$id('inspd-searchbar-textbox').focus();
				}
				else {
					$id('inspd-searchbar-dropdown-options-searchbarautocomp').setAttribute('checked','true');
					$prefs.set('searchbar.autocomp','1');
						if ($utils.trim($id('inspd-searchbar-textbox').value) == ''){$id('inspd-searchbar-textbox').value = $$prefs.get('lastsearchq');}
					$id('inspd-searchbar-textbox').focus();
					
				}
			
			}
			
			
			
			
			if (actionname == 'showgo'){
				if ($prefs.get('showgo') == '1'){
					$id('inspd-searchbar-dropdown-options-showgo').setAttribute('checked','false');
					$prefs.set('showgo','0')
					$effects.fadeOut('inspd-searchbar-go');
				}
				else {
					$id('inspd-searchbar-dropdown-options-showgo').setAttribute('checked','true');
					$prefs.set('showgo','1')
					$effects.fadeIn('inspd-searchbar-go');
				}
			}
			
			
			
			if (actionname == 'showfavicon'){
				if ($prefs.get('bookmarks.showfavicon') == '1'){
					$id('inspd-searchbar-dropdown-options-showfavicon').setAttribute('checked','false');
					$prefs.set('bookmarks.showfavicon','0')
				}
				else {
					$id('inspd-searchbar-dropdown-options-showfavicon').setAttribute('checked','true');
					$prefs.set('bookmarks.showfavicon','1')
				}
			}
			
			
			if (actionname == 'altpost'){
					$id('inspd-searchbar-dropdown-options-altpost_'+secondVal+'').setAttribute('checked','true');
					$prefs.set('altpost',''+secondVal+'')
			}
			
			
			
			return false;	
			}
			
			  
			
}



var $moz = {
	inc : function(filename){
		var jssubscript_Include = new  Components.Constructor('@mozilla.org/moz/jssubscript-loader;1','mozIJSSubScriptLoader');
		var jssubscript_gInc = new jssubscript_Include();
		jssubscript_gInc.loadSubScript(filename);
	}
}




var $inspd = {
  
	initChrome: function() {
		$Chrome.set_options_ui_all();
		if ($prefs.get('searchbar.autocomp') == '1') {
			$id('inspd-searchbar-textbox').value = $prefs.get('lastsearchq') ;
		}
	},
  
   
	initAll: function() {
		if($id('appcontent')) {
			$id('appcontent').addEventListener('DOMContentLoaded', this.onPageLoad, true);
		}
	},

	
	onPageLoad: function(aEvent) {
		if (aEvent.originalTarget.nodeName == '#document'){
			var doc = aEvent.originalTarget;
				if(doc.location.href.match('^http://delicious.com/') && $prefs.get('delintegrate') == '1' ){
					$delpage.draw_postToInsipid(doc);
				}
				else if (doc.location.href.match('^'+$prefs.get('defurl')+'\\?op=add_bookmark') && $prefs.get('altpost') !== '0' && doc.forms[1]){
					$alt_Post.trigger(doc);
				}
		}
	}
  
}


$moz.inc('chrome://inspd/content/inc/vars.js');
$moz.inc('chrome://inspd/content/inc/globals.js');
$utils.inc('chrome://inspd/content/inc/md5.js');
$utils.addEvent('load', window, $inspd.initChrome, false);
// window.addEventListener("DOMContentLoaded", function() { $inspd_start.initAll(); }, false);
$utils.addEvent('DOMContentLoaded', window, function() { $inspd.initAll(); }, false);
