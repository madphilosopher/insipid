var dragswitch=0 ;
document.onmouseup=new Function("dragapproved=false")

var $mytags = {

		pageLoad : function(){
		
			if ($utils.qs('tag') != ''){
				document.title = document.title+' ['+$utils.decode($utils.qs('tag'))+']';
				$id('header').innerHTML =  $id('header').innerHTML+' ['+$utils.decode($utils.qs('tag'))+']';
			}
		
			$ajax.get(''+$prefs.get('defurl')+'?raw=1&op=json_tags'+qs_tag+'&d='+new Date().valueOf()+'', this.getTags);
			
		},
	
		getTags : function(http_request){
			if (http_request.readyState == 4) {
				try{
				if (http_request.status == 200) {
					if (http_request.responseText.match("^{}")){
						$id('inspd_cloud').innerHTML = '<li style="font-size: 20px;padding:30px 8px 8px 8px;font-family: verdana,arial,sans-serif;"><span style="color:#ff0000">'+$utils.decode($utils.qs('tag'))+'</span> returned no results. <a href="'+Inspd_JSON_HOME_PAGE+'">Return to Home</a>.</li>';
					}
					else {
						$id('tags_search').style.visibility = 'visible';
						eval("Insipid.tags = "+http_request.responseText);
						if ($prefs.get('cloud.sortby') == 'alphabetic'){
							$mytags.do_sort('','alpha');	
						}
						else {
							$mytags.do_sort('','freq');	
						}
						
						
					}
				} 
				else {
					$id('tags_search').style.visibility = 'hidden';
					$id('inspd_cloud').innerHTML = '<li style="font-size: 20px;padding:30px 8px 8px 8px;font-family: verdana,arial,sans-serif;"><span style="color:#ff0000">Connection error!</span> Please try again.</li>';
				}
				
				}
				catch(e){
					$id('tags_search').style.visibility = 'hidden';
					$id('inspd_cloud').innerHTML = '<li style="font-size: 20px;padding:30px 8px 8px 8px;font-family: verdana,arial,sans-serif;"><span style="color:#ff0000">Connection error!</span> Please try again.</li>';

				}
			}
		},
		
	
		
		showBlob : function(container,e,count){
		
				$effects.pos2Anchor(container,e);
				var t = $utils.decode($utils.replace(container,'maindragholder','')) ;
				
				var strtxt = '';
				strtxt +='<div id="'+container+'-dragbar" class="tooltip_dragbar" onmousedown="$effects.initializedrag(event,\''+container+'\',\''+container+'-dragbar\');">'+
								'<span class="span_dragbar_title">'+t+' - Last 10 posts:</span><span class="span_closex">'+
								'<a href="#" title="close this box" onfocus="this.blur();" onclick="$effects.show(\''+container+'\',false);return false;">'+
								'<img align="absmiddle" src="images/cancel.png" border="0"/></a>'+
								'</span>'+
								'</div>'+
								'<div class="span_drag_content" id="'+container+'-content"><i>Loading your bookmarks...</i></div>'
				$id(container).innerHTML = strtxt ;
				$effects.show(container,true);		
				this.getPosts_in_Blob(container,t);
							
				
				
		
		},
		
		
		getPosts_in_Blob: function(container,t){
				var url = ''+$prefs.get('defurl')+'?raw=1&op=json_posts&count=10&page='+qs_page+'&tag='+t+'&d='+new Date().valueOf()+'';
				var http_request = new XMLHttpRequest();
				http_request.onreadystatechange = function() { 
						
					if (http_request.readyState == 4) {
						try{
						if (http_request.status == 200) {
								eval("Insipid.posts ="+http_request.responseText);
								$posts.g_draw_mini(''+container+'-content',Insipid.posts,'mini_posts');
						} 
						else {
							// error
							$id(''+container+'-content').innerHTML = '<div style="font-size: 20px;padding:5px;font-family: verdana,arial,sans-serif;"><span style="color:#ff0000">Connection error!</span> Please try again.</div>';
						}
						}
						catch(e){
							$id(''+container+'-content').innerHTML = '<div style="font-size: 20px;padding:5px;font-family: verdana,arial,sans-serif;"><span style="color:#ff0000">Connection error!</span> Please try again.</div>';
						}
					}
				};
				
				http_request.open('GET', url, true);
				http_request.setRequestHeader("Connection", "close");
				http_request.setRequestHeader("Keep-Alive", "");
				http_request.send(null);
		
		
		
		},
		
		showOptionsDiv : function(container,anchor){
			
			if ($id(container).style.display == 'none'){
				$id(container).style.display = 'block' ; 
				$id(anchor).innerHTML = '&laquo; Hide options' ;
			}
			else {
				$id(container).style.display = 'none' ; 
				$id(anchor).innerHTML = '&raquo; Show options' ;
			}
			$id(container).innerHTML = this.private_showOptions();
		},
		
		
		private_showOptions : function(){
			
		var strtxt = '';
		
		strtxt = ''+
		'<span class="cloud_options_span">&raquo; Sort by: '+
		'';
		
		if ($prefs.get('cloud.sortby') == 'alphabetic'){
		
			strtxt +='<a onfocus="this.blur();" id="cloud_options_sort_alpha_anchor">alpha</a> | <a onfocus="this.blur();" href="#" id="cloud_options_sort_freq_anchor" onclick="$mytags.do_sort(this.id,\'freq\');return false;">freq</a> ';
		}
		else {
		
			strtxt +='<a onfocus="this.blur();" href="#" id="cloud_options_sort_alpha_anchor" onclick="$mytags.do_sort(this.id,\'alpha\');return false;">alpha</a> | <a onfocus="this.blur();" id="cloud_options_sort_freq_anchor">freq</a> ';
			
		}
		
		
		
		strtxt += '<br/>&raquo; Sort type: ';
		
		if ($prefs.get('cloud.sorttype') == 'asc'){
		
			strtxt +='<a onfocus="this.blur();" id="cloud_options_sort_asc_anchor">asc</a> | <a onfocus="this.blur();" id="cloud_options_sort_desc_anchor" onclick="$mytags.do_sort(this.id,\'desc\');return false;" href="#">desc<a>';
		}
		else {
			strtxt +='<a onfocus="this.blur();" id="cloud_options_sort_asc_anchor" onclick="$mytags.do_sort(this.id,\'asc\');return false;" href="#">asc</a> | <a onfocus="this.blur();" id="cloud_options_sort_desc_anchor">desc<a>';
			
		
		}
		
		
		
		// use minimum: 1, 2, 5 
		
		strtxt +='<br/>' +
		'&raquo; Use minimum tags: ';
		
		var range_min_tags = [1,2,5,10] ;
		for (mintag in range_min_tags){
			if (range_min_tags[mintag] == parseInt($prefs.get('cloud.mintag'))){
				strtxt +='&nbsp;<a onfocus="this.blur();" id="cloud_options_mintag_anchor_'+range_min_tags[mintag]+'">'+range_min_tags[mintag]+'</a>&nbsp;';
			}
			else {
				strtxt +='&nbsp;<a onfocus="this.blur();" id="cloud_options_mintag_anchor_'+range_min_tags[mintag]+'" '
				+'href="#" onclick="$prefs.set(\'cloud.mintag\',\''+range_min_tags[mintag]+'\');$id(\'inspd_cloud\').innerHTML = $cloud.g_draw(Insipid.Curtags,$id(\'qq\').value); $mytags.showOptionsDiv(\'nav\',this.id);$mytags.showOptionsDiv(\'nav\',this.id);return false;">'+range_min_tags[mintag]+'</a>&nbsp;';
			}
			
		}
		
		strtxt += '<br/>' +
				'&raquo; Font  <small>(px)</small>: min: <input maxlength="2" onkeyup="$mytags.do_options(\'minfont\',this.value)" value="'+$prefs.get('cloud.minfont')+'" size="1" type="text"> &nbsp;max: <input maxlength="2" onkeyup="$mytags.do_options(\'maxfont\',this.value)" value="'+$prefs.get('cloud.maxfont')+'" size="1" type="text">'+
				'<br/>' +
				'&raquo; Color <small>(hex)</small>: min: <input maxlength="7" value="#'+$prefs.get('cloud.mincolor')+'" onkeyup="$mytags.do_options(\'mincolor\',this.value)" size="6" type="text"> &nbsp;max: <input maxlength="7" onkeyup="$mytags.do_options(\'maxcolor\',this.value)" value="#'+$prefs.get('cloud.maxcolor')+'" size="6" type="text">'+
				'<br/>'+
				'&raquo; Counts: '+
				
				'';
			
			if ($prefs.get('cloud.showcounts') == '1'){
				strtxt +='<a onfocus="this.blur();" id="cloud_options_counts_show_anchor">show</a> | <a href="#" onfocus="this.blur();" onclick="$prefs.set(\'cloud.showcounts\',\'0\');$id(\'inspd_cloud\').innerHTML = $cloud.g_draw(Insipid.Curtags,$id(\'qq\').value); $mytags.showOptionsDiv(\'nav\',this.id);$mytags.showOptionsDiv(\'nav\',this.id);return false;" id="cloud_options_counts_hide_anchor">hide</a>'+
				'';
			}
			else {
				strtxt +='<a href="#" onfocus="this.blur();" onclick="$prefs.set(\'cloud.showcounts\',\'1\');$id(\'inspd_cloud\').innerHTML = $cloud.g_draw(Insipid.Curtags,$id(\'qq\').value); $mytags.showOptionsDiv(\'nav\',this.id);$mytags.showOptionsDiv(\'nav\',this.id);return false;" id="cloud_options_counts_show_anchor">show</a> | <a onfocus="this.blur();" id="cloud_options_counts_hide_anchor">hide</a>'+
				'';
			}


			

		
		strtxt +='</span>'+
		'';
		
		
		
	return strtxt ;
		
	},
	
	do_sort : function(anchor_id,action){
			var tags = Insipid.tags ;
			var keyArray = new Array();
			var i = 0 ; 
			for (t in tags){
				keyArray[i] = t;
				i++;
			}
			$cloud.p_sort(keyArray, tags, action,anchor_id);
	},
	
	do_options : function (action,act_val){
			act_val = $utils.replace(''+act_val+'','#','')
			$prefs.set('cloud.'+action+'',''+act_val+'');
			
			if ($prefs.get('cloud.sortby') == 'alphabetic'){
				$mytags.do_sort('','alpha');	
			}
			else {
				$mytags.do_sort('','freq');	
			}
	}		
	
		
	
}


$utils.addEvent('DOMContentLoaded', window, function() { $mytags.pageLoad(); }, false);


