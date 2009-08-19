var $cloud = {
			
			// extract_tags_from_posts() from the example code sent to pwlin by Darrel Huston from Flock Inc. 
			extract_tags_from_posts:function (
						container, // the id of a div or a span that we want to write our cloud to it
						posts_obj // an object containing the posts which our tags are supposed to be extracted from. e.g Delicious.posts
						){
						
						
						
			var sorted_tags = {} ;
			var posts = posts_obj;
			var tmptxt = '' ;		
						
						
						
			
            // var tags = new Object();
			var tags = [];

           
            var tags_idx = new Array();

            for(var i = 0; i < posts.length; i++){
            
                var tags_array = posts[i].t;

                
                if(typeof tags_array == 'undefined'){
                    tags_array = new Array('system:unfiled');
                }

                for(var j = 0; j< tags_array.length; j++){
                    
                    if(typeof tags[tags_array[j]] == 'undefined'){
                        tags[tags_array[j]] = new Array();
                        tags_idx[tags_idx.length] = tags_array[j];
                    }

                    tags[tags_array[j]][tags[tags_array[j]].length] = posts[i].u;

                }
            }

            
            tags_idx.sort();

           
			for(var i = 0; i < tags_idx.length; i++){
                sorted_tags[''+tags_idx[i]+''] =  tags[tags_idx[i]].length ;
			}

			
			
			// $cloud.p_sort(tags_idx, sorted_tags, action,'');
			
			if ($prefs.get('cloud.sortby') == 'alphabetic'){
				$cloud.p_sort(tags_idx, sorted_tags, 'alpha','');
			}
			else {
				$cloud.p_sort(tags_idx, sorted_tags, 'freq','');	
			}
			
						
			
			
	},
		// tag cloud routine, originally from del.icio.us bits. 
		g_draw : function(ts,q){
			
			!q ? q = '' : q = $utils.trim(q); 
			q = q.replace(/[\\$*+?()=!|,{}\[\]\.^]/g,'\\$&') ;
			var pattern = "^"+q+"";
			var reg =  new RegExp(pattern, "i");
			var all_tags = 0, matched_tags = 0 , output_tmp = '';
			var delCount = new Array();
			for (p in ts){
				if (!delCount[ts[p]]){
					delCount[ts[p]] = new Array(ts[p])
				}
			}
			var ta = 0,tz=delCount.length-1;
			
			output_tmp += '<li style="font-size:70%;text-align:left;display:block;color:#666666">'+this.p_draw_cloud_header()+'</li>';
			
			var ca=$utils.Hex2RGB($prefs.get('cloud.mincolor')),cz=$utils.Hex2RGB($prefs.get('cloud.maxcolor')),c=[] ;
						
			for(var t in ts){
				all_tags ++;
				for (var i=0;i<3;i++) {c[i]=this.p_spread(ca[i],cz[i],ts[t]-ta,tz)} ;
				if (document.location.href.match(Inspd_JSON_CLOUD_PAGE)){
				var fs = this.p_spread(parseInt($prefs.get('cloud.minfont')),parseInt($prefs.get('cloud.maxfont')),ts[t]-ta,tz) ;
				}
				else {
				var fs = this.p_spread(14,21,ts[t]-ta,tz) ;
				}
				
				if (q != '' ){
					if (ar = reg.test(t)){
						if (ts[t] >= parseInt($prefs.get('cloud.mintag'))){
							output_tmp += this.p_draw_single_tag(fs,t,ts[t],$prefs.get('cloud.showcounts'),c[0],c[1],c[2]);
							matched_tags++;
						}
					}
				}
				else{
					if (ts[t] >= parseInt($prefs.get('cloud.mintag'))){
						output_tmp += this.p_draw_single_tag(fs,t,ts[t],$prefs.get('cloud.showcounts'),c[0],c[1],c[2]);
					}
				}
			}
			return output_tmp ;
		},
		
		//tag cloud spread calculation originally from del.icio.us bits.
		p_spread : function(a,b,i,x) {
			if(a>b){
				var m=(a-b)/Math.log(x),v=a-Math.floor(Math.log(i)*m);
			}
			else{
				var m=(b-a)/Math.log(x),v=Math.floor(Math.log(i)*m+a) ;
			}
			return v ;
		},
		
		
		
		p_draw_single_tag : function(fs,t,count,show_counts,c0,c1,c2){
			var strtxt = '';
			var target = '';
			if (document.location.href.match(Inspd_JSON_CLOUD_PAGE)){
				target = 'target="_blank"';
			}
			if (isNaN(c0) || isNaN(c1) || isNaN(c2) || isNaN(fs) ){ fs = parseInt($prefs.get('cloud.minfont')) ; c0 = $utils.Hex2RGB($prefs.get('cloud.mincolor')); c2 = c0[2]; c1 = c0[1]; c0 = c0[0];}
			
			strtxt +='<li style="font-size:'+fs+'px;line-height:1.3;"><a '+target+' style="color:rgb('+c0+','+c1+','+c2+');" href="'+Inspd_JSON_BOOKMARKS_PAGE+'?tag='+t+'" onfocus="this.blur();">'+t+'</a>';
			
			if (show_counts == '1'){
				if (document.location.href.match(Inspd_JSON_CLOUD_PAGE)){
						strtxt +='<small style="font-size:10px;margin-left:0px;color:#666666;"><a href="#" onclick="$mytags.showBlob(\''+$utils.encode(t)+'maindragholder\',event,\''+count+'\');return false;" onfocus="this.blur();">('+count+')</a></small> ';
						
				}
				else {
					strtxt +='<small style="font-size:10px;margin-left:0px;color:#666666;">('+count+')</small>';
					if (document.location.href.match(Inspd_JSON_HOME_PAGE) || document.location.href.match(Inspd_JSON_ALLITEMS_PAGE) ){
						strtxt += '\n';
					}
					
				}
			}
			else if (document.location.href.match(Inspd_JSON_CLOUD_PAGE) || document.location.href.match(Inspd_JSON_HOME_PAGE) || document.location.href.match(Inspd_JSON_ALLITEMS_PAGE) ){
			
				strtxt += '\n';
			}
			
			
			
			
			
			if (document.location.href.match(Inspd_JSON_CLOUD_PAGE) || document.location.href.match(Inspd_JSON_ALLITEMS_PAGE) ){
				
			}
			else {
				strtxt += this.p_draw_single_plusminus(t);
			}
			
			
			strtxt +='</li>';
			
			if (document.location.href.match(Inspd_JSON_CLOUD_PAGE)){
			strtxt +='<div id="'+$utils.encode(t)+'maindragholder"'+ 
					'style="position:absolute;width:350px;display:none;"></div>'+
					'';
			}
			
			return strtxt ;
		},
		
		p_draw_single_plusminus : function(t){
			var strtxt = '';
			if (qs_tag && $prefs.get('cloud.showadd')=='1'){
				var matched_qstag = false;
				var unmatched_qstag = 0;
				var qstags_Array = $utils.qs('tag').split('+');
				var unmatched_qstags_Array = [];
				for (var j = 0; j<qstags_Array.length;j++){
					if (qstags_Array[j] == t){
						matched_qstag = true ;
					}
					else {
						unmatched_qstags_Array[unmatched_qstag] = qstags_Array[j] ;
						unmatched_qstag++ ;							
					}
				}
				if (!matched_qstag){
					strtxt +='<a onfocus="this.blur();" style="color:#326712;text-decoration:none;font-size:15px;" title="add \''+t+'\'" href="?'+qs_tag+'+'+(t)+'">+</a> ';
				}
				else {
					strtxt += '<a onfocus="this.blur();"'+
								'style="color:#ff0000;text-decoration:none;font-size:25px;"'+
								' title="remove \''+t+'\'" href="?tag='+
								'';
					for (var unmatched_qs in unmatched_qstags_Array){
						strtxt +=''+unmatched_qstags_Array[unmatched_qs]+'+';
					}
					//strtxt = $utils.replace(strtxt,'^\\+','') ;
					strtxt = $utils.replace(strtxt,'\\+$','') ;
					//strtxt = $utils.replace(strtxt,'\\+\\+','+') ;
					strtxt += '">-</a> '
				}
			}
			else {
				strtxt += '\n';
			}		
			return strtxt ;
		},
				
		
		
		
		
		
		p_sort : function(keyArray, tags, action,anchor_id){
					var keyArraytmp=[];
					Insipid.Curtags = {} ;
					
					if (action == 'freq'){
							$prefs.set('cloud.sortby','tagscount');
							
							if (anchor_id){
								$id(anchor_id).removeAttribute('href');
								$id($utils.replace(''+anchor_id+'','_freq_','_alpha_')).setAttribute('href','#');
								$id($utils.replace(''+anchor_id+'','_freq_','_alpha_')).setAttribute('onclick','$mytags.do_sort(this.id,\'alpha\');return false;');
							}						
							
							if ($prefs.get('cloud.sorttype') == 'asc'){
									keyArraytmp = keyArray.sort(function(a,b){return tags[a]-tags[b];});
							}
							else {
									keyArraytmp = keyArray.sort(function(a,b){return tags[b]-tags[a];});						
							}
					}
					else if (action == 'alpha'){
							$prefs.set('cloud.sortby','alphabetic');
							
							if (anchor_id){
								$id(anchor_id).removeAttribute('href');
								$id($utils.replace(''+anchor_id+'','_alpha_','_freq_')).setAttribute('href','#');
								$id($utils.replace(''+anchor_id+'','_alpha_','_freq_')).setAttribute('onclick','$mytags.do_sort(this.id,\'freq\');return false;');
							}
							
							if ($prefs.get('cloud.sorttype') == 'asc'){
								// keyArraytmp = keyArray.sort();
								keyArraytmp = keyArray;
								
							}
							else {
								keyArraytmp = keyArray.reverse();						
							}
					}
					else if (action == 'asc'){
							$prefs.set('cloud.sorttype','asc');
							
							if (anchor_id){
								$id(anchor_id).removeAttribute('href');
								$id($utils.replace(''+anchor_id+'','_asc_','_desc_')).setAttribute('href','#');
								$id($utils.replace(''+anchor_id+'','_asc_','_desc_')).setAttribute('onclick','$mytags.do_sort(this.id,\'desc\');return false;');
							}
							
							if ($prefs.get('cloud.sortby') == 'tagscount'){
								keyArraytmp = keyArray.sort(function(a,b){return tags[a]-tags[b];});
							}
							else {
								// keyArraytmp = keyArray.sort();
								keyArraytmp = keyArray;
							}
					}
					
					
					else if (action == 'desc'){
							$prefs.set('cloud.sorttype','desc');
							
							if (anchor_id){
								$id(anchor_id).removeAttribute('href');
								$id($utils.replace(''+anchor_id+'','_desc_','_asc_')).setAttribute('href','#');
								$id($utils.replace(''+anchor_id+'','_desc_','_asc_')).setAttribute('onclick','$mytags.do_sort(this.id,\'asc\');return false;');
							}
							
							if ($prefs.get('cloud.sortby') == 'tagscount'){
								keyArraytmp = keyArray.sort(function(a,b){return tags[b]-tags[a];});	
							}
							else {
								keyArraytmp = keyArray.reverse();	
							}
					}
					
					
					
					
					for (i=0;i<keyArraytmp.length;i++){
						Insipid.Curtags[''+keyArraytmp[i]+''] = tags[keyArraytmp[i]] ;
					}
					
					$id('qq').setAttribute('onkeyup','$id(\'inspd_cloud\').innerHTML = $cloud.g_draw(Insipid.Curtags,this.value)');
					$id('inspd_cloud').innerHTML = this.g_draw(Insipid.Curtags,$id('qq').value) ;
					
					
					
					
		},
		
		p_draw_cloud_header : function(){
					var strtxt = '';
					try {
					if ( document.location.href.match(Inspd_JSON_HOME_PAGE)){
						strtxt += '&raquo; Tags in this page :';
					}
					else if ($utils.qs('tag') == '' && !document.location.href.match(Inspd_JSON_CLOUD_PAGE) ){
						strtxt += '&raquo; Tags in this page :';
					}
					else if ($utils.qs('tag') !==''){
						if ($utils.qs('tag').match("\\+") && !document.location.href.match(Inspd_JSON_CLOUD_PAGE) ){
							strtxt += '&raquo; Tags in this page :';
						}
						else {
						strtxt += '&raquo; Tags related to \' '+$utils.qs('tag')+' \' :';
						}
					}
					}catch(e){}
		
				return strtxt ;
		}
	
	

}


var $posts = {




		// draw bookmarks routine, originally from del.icio.us JSON help and example page.
		g_draw : function(container,posts_obj){
		
		var ul = document.createElement('ul')
		ul.className = 'posts';
			
		var liheader = document.createElement('span')
		liheader.className = 'pagination';
		
		if (document.location.href.match(Inspd_JSON_STARS_PAGE)){
		liheader.innerHTML = $stars.show_header(posts_obj);
		}
		else if (document.location.href.match(Inspd_JSON_CLOUD_PAGE)){
		liheader.innerHTML = '';
		}
		else{
			liheader.innerHTML = this.draw_pagination(posts_obj);
		}
		
		ul.appendChild(liheader)
		
		for (var i=0, post; post = posts_obj[i]; i++) {
				var li = document.createElement('li');
				li.innerHTML = '<div id="menu_post">'+this.p_draw_datebox(post.dt,post.u,post.t,post.d,post.n)+'</div><div id="content_post">'+this.p_draw_link(post.u,post.d,post.t,post.n)+'</div>';
				ul.appendChild(li)
		}
		
		
		if (document.location.href.match(Inspd_JSON_STARS_PAGE)){
		
			var lifooter = document.createElement('span')
			lifooter.className = 'pagination';
			lifooter.innerHTML = '';
			//10, 25, 50, 100 items per page';
			ul.appendChild(lifooter)
		}
		else if (document.location.href.match(Inspd_JSON_CLOUD_PAGE)){
		}
		else if (typeof posts_obj[0] == 'undefined'){
		}
		else{
		var lifooter = document.createElement('span')
		lifooter.className = 'pagination';
		lifooter.innerHTML = liheader.innerHTML+'<br/>&nbsp;'+this.draw_footer();
		//10, 25, 50, 100 items per page';
		ul.appendChild(lifooter)
		}
		
		
		$id(container).innerHTML = '' ;
		$id(container).appendChild(ul)
	},
	
	
	p_draw_datebox : function(dt,url,tags,title,notes){
		return '<div class="post-cal-2"><span class="post-month-2">'+$$date.month(dt)+'</span><span class="post-date-2">'+$$date.day(dt)+'</span><span class="post-dateyear-2">'+$$date.year(dt)+'</span><span class="post-dateicon-2">'+this.p_draw_favico(url,tags,title,notes,dt)+'</span></div>';
	},
	
	
	p_draw_favico: function(url,tags,title,notes,dt){
		var favicotxt = '<div style="text-align:left;position:absolute;display:none;" id="span_pointer_'+hex_md5(url)+'"></div>'+
						'<span title="Bookmark\'s options" onclick="$posts.draw_blob_comment_box(\''+hex_md5(url)+'\',\''+$utils.encode(url)+'\',\''+$utils.encode(tags)+'\',\''+$utils.encode(title)+'\',\''+$utils.encode(notes)+'\',\''+$utils.encode(dt)+'\');"'+
						' class="favico_span">';
		var linksrc = '' ;
		var defimgsrc = '';
		if ($prefs.get('bookmarks.showfavicon') == '1' && url.match('^http://') ){
			linksrc = ''+url.split('/').splice(0,3).join('/')+'/favicon.ico'+'';
		}
		if($conditions.getProtocol(url,'color')){
			defimgsrc +=''+Inspd_BASE_JSON_URL+'/images/inspd_color_swatch.png'
		}
		else{
			defimgsrc += ''+Inspd_BASE_JSON_URL+'/images/inspd_links2.png';
		}
		favicotxt +='<img id="favico_default_'+hex_md5(url)+'" width="16" height="16" src="'+defimgsrc+'" "/><img id="favico_'+hex_md5(url)+'" width="16" height="16" style="display:none;" onload="this.previousSibling.style.display=\'none\';this.removeAttribute(\'style\');" src="'+linksrc+'" /><img id="favico_edit_'+hex_md5(url)+'" style="display:none;position:absolute;right:8px;" src="'+Inspd_BASE_JSON_URL+'/images/inspd_edit.png" />'+
					'</span>';
		return favicotxt ;
		
	},
	
	p_draw_link: function(url,title,tags,notes){
		var linktxt = '';
		if($conditions.getProtocol(url,'color')){
			linktxt += ''+this.p_draw_link_color_protocol(url,title)+'';
		}else {
			linktxt +='<a href="'+url+'" class="a_posts" target="_blank" onfocus="this.blur();" >'+(''+(''+title+'').replace(/</,'&lt;')+'').replace(/>/,'&gt;')+'</a>';
		}
		linktxt += ''+this.p_draw_tags(tags,notes)+'';
		return linktxt ;		
				
	},
	
	p_draw_link_color_protocol : function(url,title){
		colors = ((url.replace('color:','')).replace('#','')).split(',');
		var link_colortxt = '';
		link_colortxt += '<div class="a_posts_link_color_protocol_container">';
			for(var i = 0;i<colors.length;i++){
				if(colors[i]){
					link_colortxt += '<span title="click for copying #'+colors[i]+' to clipboard" onclick="Inspd_gClipboardHelper.copyString(\'#'+colors[i]+'\');self.status=\'#'+colors[i]+' was placed into your clipboard\'; " class="colorBar" style="background-color:#'+colors[i]+';"> </span>&nbsp;';	
				}
			}
		link_colortxt += '&nbsp;&nbsp;'+title+'</div>';
		return link_colortxt ;
		
	},
	
	
	p_draw_tags : function(tags,notes){
		var notestxt = '';
		if(notes && notes != 'undefined'){
			notestxt +='<span class="post_notes">'+notes+'</span>';
		}
		var tagstxt = '';
		tagstxt +='<span class="post_tags">';
		
		if (tags){
				var array_tags = $utils.decode(tags);
				array_tags = array_tags.split(",");
				for (var j = 0, tag; tag = array_tags[j]; j++){
					tagstxt += ' <a onfocus="this.blur()" class="a_post_tags" href="'+Inspd_JSON_BOOKMARKS_PAGE+'?tag='+tag+'">'+tag+'</a> ';
				}
		}
		else if(!notes){
			tagstxt +='&nbsp;&nbsp;';
		}
		tagstxt +='</span>';
		return notestxt+tagstxt ;
		},
	
	
		
			
			
	


	
		
	g_draw_mini : function(container,posts_obj,classname){
		
		var ul = document.createElement('ul')
		ul.className = classname;
			
		var liheader = document.createElement('span')
		liheader.className = classname+'_pagination';
		
		/*
		if (document.location.href.match(Inspd_JSON_STARS_PAGE)){
		liheader.innerHTML = $stars.show_header(posts_obj);
		}
		else if (document.location.href.match(Inspd_JSON_CLOUD_PAGE)){
		liheader.innerHTML = '';
		}
		*/
		if (typeof posts_obj[0] == 'undefined'){
		//$id('nav').style.display = 'none';
		liheader.innerHTML = '<span style="color:#ff0000;">'+$utils.decode($utils.replace(container,'maindragholder-content',''))+'</span> returned no results. Please choose another tag.</a>'
		}
		
		/*
		else{
			liheader.innerHTML = this.draw_pagination(posts_obj);
		}
		*/
		ul.appendChild(liheader)
		
		for (var i=0, post; post = posts_obj[i]; i++) {
			
				var li = document.createElement('li');
				
				//li.className = 'posts';
				var a = document.createElement('a')
				// a.className = classname+'_a_posts'
				a.setAttribute('onfocus','this.blur();');
				a.setAttribute('target','_blank');
				if ($prefs.get('bookmarks.showfavicon') == '1'){
					a.style.marginLeft = '20px';
					
					
					var img = document.createElement('img');
					img.style.position = 'absolute';
					//img.setAttribute('align','absmiddle');
					img.style.paddingTop = '5px';
					img.style.display = 'none';
					img.height = img.width = 16;
					if (post.u.match('^http://')){
						img.src = post.u.split('/').splice(0,3).join('/')+'/favicon.ico';
						img.onload = $utils.showImage(img);
						li.appendChild(img);
					}
				}
				
				a.setAttribute('href', post.u);
				//a.setAttribute('title', post.dt);
				a.appendChild(document.createTextNode(post.d));
				
				if (post.n){
				var span_desc = document.createElement('span');
				span_desc.className = classname+'_notes' ;
				span_desc.innerHTML = ''+post.n+'';
				}
				
				
				var span_tags = document.createElement('span');
				span_tags.className = classname+'_tags' ;
				
				if (post.t){
				var array_tags = $utils.decode(post.t);
				array_tags = array_tags.split(",");

				
				var tagstxt = '';
						for (var j = 0, tags; tags = array_tags[j]; j++){
							tagstxt += ' <a onfocus="this.blur()" href="'+Inspd_JSON_BOOKMARKS_PAGE+'?tag='+tags+'">'+tags+'</a> ';
						}
									
				}
				
				//li.appendChild(img)
				li.appendChild(a)
				
				if (post.n){
					li.appendChild(span_desc);
				}
				
					//if (post.t){
					span_tags.innerHTML = tagstxt ;
					li.appendChild(span_tags) ;
					//}
				
				
				ul.appendChild(li)
			}
		
		
		if (document.location.href.match(Inspd_JSON_STARS_PAGE)){
		}
		else if (document.location.href.match(Inspd_JSON_CLOUD_PAGE)){
		}
		
		else if (typeof posts_obj[0] == 'undefined'){
		
		}
		
		else{
		var lifooter = document.createElement('span')
		lifooter.className = 'pagination';
		lifooter.innerHTML = liheader.innerHTML+'<br/>&nbsp;'+this.draw_footer();
		
		
		ul.appendChild(lifooter)
		}
		
		
		$id(container).innerHTML = '' ;
		$id(container).appendChild(ul)
	},

	
	
	draw_blob_comment_box : function(urlmd5,url,tags,title,notes,dt){
	
		if($id('favico_edit_'+(urlmd5)+'').style.display == 'none'){$id('favico_edit_'+(urlmd5)+'').style.display = 'inline';}else{$id('favico_edit_'+(urlmd5)+'').style.display = 'none';}
		var strtxt = '<div class="blob_comment_box_div">';
		strtxt += '<a onfocus="this.blur();" target="_blank" title="Edit this bookmark" href="'+$prefs.get('defurl')+'?op=add_bookmark&url='+(url)+'"><img width="16" height="16" src="'+Inspd_BASE_JSON_URL+'/images/inspd_edit2.png" /></a>'+
				  //'<a onfocus="this.blur();" title="Star this bookmark" href="#"><img width="16" height="16" src="'+Inspd_BASE_JSON_URL+'/images/inspd_star_off.png" /></a>'+
				  ''+this.p_draw_star_icon(urlmd5,url,tags,title,notes,dt)+''+
				  //'<a onfocus="this.blur();" target="_blank" title="Find similar links in similicio.us" href="http://similicio.us/search.php?url='+url+'"><img width="16" height="16" src="'+Inspd_BASE_JSON_URL+'/images/inspd_similar.png" /></a>'+
				  '<a onfocus="this.blur();" target="_blank" title="URL history on del.icio.us" href="http://del.icio.us/url/'+urlmd5+'"><img width="16" height="16" src="'+Inspd_BASE_JSON_URL+'/images/inspd_delicious_history.png" /></a>'+
				  '';
		strtxt += '</div>';
		$id('span_pointer_'+urlmd5+'').innerHTML = strtxt ;
		$effects.toggleShow('span_pointer_'+urlmd5+'',true);
		
	},
	
	p_draw_star_icon : function(urlmd5,url,tags,title,notes,dt){
		var startxt = ''
		startxt += '<img style="cursor:pointer;" title="Star this bookmark" onclick="$stars.add(this,\''+urlmd5+'\',\''+url+'\',\''+tags+'\',\''+title+'\',\''+notes+'\',\''+dt+'\');return false;" width="16" height="16" src="'+Inspd_BASE_JSON_URL+'/images/inspd_star_off.png" />'; 
		var CurStarsArray = $prefs.get('stars.list').split("|");
		for(var i = 0 ; i<CurStarsArray.length;i++){
			var CurStarArray = CurStarsArray[i].split(" "); 
			if(CurStarArray[0] == urlmd5){
				startxt = '<img style="cursor:pointer;" title="Unstar this bookmark" onclick="$stars.remove(this,\''+urlmd5+'\',\''+url+'\',\''+tags+'\',\''+title+'\',\''+notes+'\',\''+dt+'\');return false;" width="16" height="16" src="'+Inspd_BASE_JSON_URL+'/images/inspd_star_on.png" />'; 
				break;
			}
		}
		return startxt;
	
	},
	
	
	










	
			
			
	draw_footer : function(){
		var rangeitemspp = [5,10,15,25,50,80,100] ;
		var footer_txt = '<br/>&raquo; Showing ';
		for (itemspp in rangeitemspp){
			if (rangeitemspp[itemspp] == parseInt($prefs.get('defcount'))){
				footer_txt +=' '+rangeitemspp[itemspp]+',';
			}
			else {
				footer_txt +=' <a href="?setcount='+rangeitemspp[itemspp]+''+qs_tag+'">'+rangeitemspp[itemspp]+'</a>,';
				
			}
			
		}
		footer_txt =  $utils.replace(footer_txt,',$','');
		footer_txt =  $utils.replace(footer_txt,',',', ');
		footer_txt +=' items per page.';
		return footer_txt ;
	},
	
	draw_pagination : function(obj){
			var headertxt = 'Page '+qs_page+' &nbsp;&nbsp;&nbsp;';
			if (qs_tag != ''){
			// 'tag is not zero '
			if (typeof obj[parseInt($prefs.get('defcount'))-1] == 'undefined' || backfromlast == true ){
				backfromlast = false;
				if (qs_page == 1){
					headertxt += '<a>&laquo; earlier</a> | <a>later &raquo;</a>';
				}
				else{
					headertxt += '<a>&laquo; earlier</a> | <a href="?page='+(qs_page-1)+''+qs_tag+'" onclick="$home.draw_posts_inline('+(qs_page-1)+',\''+$utils.encode(qs_tag)+'\');return false;">later &raquo;</a>';	
				}
			}	
			
			else{
				
				if (qs_page == 1){
					headertxt += '<a onclick="$home.draw_posts_inline('+(qs_page+1)+',\''+$utils.encode(qs_tag)+'\');return false;" href="?page='+(qs_page+1)+''+qs_tag+'">&laquo; earlier</a> | <a>later &raquo;</a>';
				}
				else{
					headertxt += '<a onclick="$home.draw_posts_inline('+(qs_page+1)+',\''+$utils.encode(qs_tag)+'\');return false;" href="?page='+(qs_page+1)+''+qs_tag+'">&laquo; earlier</a> | <a onclick="$home.draw_posts_inline('+(qs_page-1)+',\''+$utils.encode(qs_tag)+'\');return false;" href="?page='+(qs_page-1)+''+qs_tag+'">later &raquo;</a>';	
					headertxt +='<span>&nbsp;&nbsp;&nbsp;&raquo; pages so far: </span>';
					for (var i=1;i<(qs_page);i++){
						headertxt +='<a onclick="$home.draw_posts_inline('+(i)+',\''+$utils.encode(qs_tag)+'\');return false;" title="page '+i+'" href="?page='+(i)+''+qs_tag+'">'+i+'</a>&nbsp; '
					}
				}
				
				
			}
		
			}
		
			else {
			// tag is zero i.e. we are in home page ;
			if (qs_page == 1){
				headertxt += '<a onclick="$home.draw_posts_inline('+(qs_page+1)+',\''+$utils.encode(qs_tag)+'\');return false;" href="?page='+(qs_page+1)+'">&laquo; earlier</a> | <a class="gray">later &raquo;</a>';
			}
			else{
				
				if (typeof obj[parseInt($prefs.get('defcount'))-1] !== 'undefined'){
					headertxt += '<a onclick="$home.draw_posts_inline('+(qs_page+1)+',\''+$utils.encode(qs_tag)+'\');return false;" href="?page='+(qs_page+1)+'">&laquo; earlier</a> | <a onclick="$home.draw_posts_inline('+(qs_page-1)+',\''+$utils.encode(qs_tag)+'\');return false;" href="?page='+(qs_page-1)+'">later &raquo;</a>';	
					headertxt +='<span>&nbsp;&nbsp;&nbsp;&raquo; pages so far: </span>';
					for (var i=1;i<(qs_page);i++){
						headertxt +='<a onclick="$home.draw_posts_inline('+(i)+',\''+$utils.encode(qs_tag)+'\');return false;" title="page '+i+'" href="?page='+(i)+'">'+i+'</a>&nbsp; '
					}
				}
				else {
					headertxt += '<a>&laquo; earlier</a> | <a onclick="$home.draw_posts_inline('+(qs_page-1)+',\''+$utils.encode(qs_tag)+'\');return false;" href="?page='+(qs_page-1)+'">later &raquo;</a>';	
					
				}
			}
		
		}
	return headertxt ;
	
	}





}
