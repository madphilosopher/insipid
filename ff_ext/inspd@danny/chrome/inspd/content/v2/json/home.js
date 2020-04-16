var $home = {
	draw_body_page: function(){
		if ($utils.qs('tag') != ''){
			document.title = document.title+' ['+$utils.decode($utils.qs('tag'))+']';
			$id('header').innerHTML =  $id('header').innerHTML+' ['+$utils.decode($utils.qs('tag'))+']';
		}
		else if ($utils.qs('q') != ''){
			document.title = document.title+' ['+$utils.decode($utils.qs('q'))+']';
			$id('header').innerHTML =  $id('header').innerHTML+' ['+$utils.decode($utils.qs('q'))+']';
		}
		
	
	
		if ($conditions.page_with_qs_tags()){
			$ajax.get(''+$prefs.get('defurl')+'?op=json_tags'+qs_tag+'&d='+new Date().valueOf()+'', this.draw_cloud_mini);
		}
		
		
		this.draw_contposts();

	},
	
	
	draw_cloud_mini: function(http_request){
		if (http_request.readyState == 4) {
			try{
			if (http_request.status == 200) {
				eval(http_request.responseText);
					
					$id('inspd_cloud_mini_header').style.visibility = 'visible';
					
					var tags = Insipid.tags ;
					
					var keyArray = new Array();
					var i = 0 ; 
					for (t in tags){
						keyArray[i] = t;
						i++;
					}
					
					if ($prefs.get('cloud.sortby') == 'alphabetic'){
							$cloud.p_sort(keyArray, tags, 'alpha','');
					}
					else {
							$cloud.p_sort(keyArray, tags, 'freq','');	
					}
				
				
			} 
			else {
				// error
			}
			}
			catch(e){
				//error
			}
		}
	},
	
	draw_contposts: function(){
		
		var url = ''+$prefs.get('defurl')+'?op=json_posts&count='+qs_count+'&page='+qs_page+''+qs_tag+'&d='+new Date().valueOf()+'';
		var http_request = new XMLHttpRequest();
		http_request.onreadystatechange = function() { 
			if (http_request.readyState == 4) {
				try{
					if (http_request.status == 200) {
						eval(http_request.responseText);
							if (typeof Insipid.posts[0] == 'undefined'){
								
								$id('nav').style.display = 'none';
								if ($utils.qs('page')){
									
									$id('contposts').innerHTML = '<div style="font-size: 20px;padding:30px 8px 8px 8px;font-family: verdana,arial,sans-serif;"><span style="color:#ff0000">Page '+(parseInt($utils.qs('page')))+'</span> does not exists. <a href="'+Inspd_JSON_HOME_PAGE+'">Return to Home</a>.</div>';
								}
								else if (qs_tag != ''){
									qs_tag = $utils.replace(qs_tag,'&tag=','');
									qs_tag = $utils.replace(qs_tag,'&q=','');
									$id('contposts').innerHTML = '<div style="font-size: 20px;padding:30px 8px 8px 8px;font-family: verdana,arial,sans-serif;"><span style="color:#ff0000">'+$utils.decode(qs_tag)+'</span> returned no results. <a href="'+Inspd_JSON_HOME_PAGE+'">Return to Home</a>.</div>';
								}
								
							}
							else {
								$id('contposts').innerHTML = '';
								$id('inspd_cloud_mini_header').style.visibility = 'visible';
								//$id('inspd_cloud').innerHTML = '' ;
								$posts.g_draw('contposts',Insipid.posts);
								if ($utils.qs('tag') == '' || $utils.qs('tag').match("\\+")){
									//$id('inspd_cloud_mini_header').style.visibility = 'visible';
									$cloud.extract_tags_from_posts('inspd_cloud', Insipid.posts);
								}
							}
						
					} 
					else {
						// error
						
						$id('nav').style.display = 'none';
						$id('contposts').innerHTML = '<div style="font-size: 20px;padding:30px 8px 8px 8px;font-family: verdana,arial,sans-serif;"><span style="color:#ff0000">Connection error!</span> Please try again.</div>';
						
					}
					
				}
				catch(e){
				//$utils.console(e);
				$id('nav').style.display = 'none';
				$id('contposts').innerHTML = '<div style="font-size: 20px;padding:30px 8px 8px 8px;font-family: verdana,arial,sans-serif;"><span style="color:#ff0000">Connection error!</span> Please try again.</div>';
				}
					
			}
		
		}
		
		http_request.open('GET', url, true);
		http_request.setRequestHeader("Connection", "close");
		http_request.setRequestHeader("Keep-Alive", "");
		http_request.send(null);

	},
	
	draw_posts_inline : function(page,tag){
				
				qs_page = parseInt(page);
				
				$id('contposts').innerHTML = '<div style="font-size: 20px;padding:30px 8px 8px 8px;font-family: verdana,arial,sans-serif ;">Loading your bookmarks...</div>'; 
				scroll(0,0);
				var url = ''+$prefs.get('defurl')+'?op=json_posts&count='+qs_count+'&page='+page+''+$utils.decode(tag)+'&d='+new Date().valueOf()+'';
				var http_request = new XMLHttpRequest();
				http_request.onreadystatechange = function() { 
					
					if (http_request.readyState == 4) {
						try{
						if (http_request.status == 200) {
							
									eval(http_request.responseText);
									if (typeof Insipid.posts[0] == 'undefined'){
										$id('contposts').innerHTML = '<div style="font-size: 20px;padding:30px 8px 8px 8px;font-family: verdana,arial,sans-serif ;">Page '+(page-1)+' was the last. Reloading...</div>';
										backfromlast = true ;
										setTimeout('$home.draw_posts_inline('+(page-1)+',"'+tag+'")',2000);
										
									}
									else{ 
										$id('contposts').innerHTML = ''; 
									
										$posts.g_draw('contposts',Insipid.posts);
										if (($utils.qs('tag') && $utils.qs('tag').match("\\+")) || document.location.href.match(Inspd_JSON_HOME_PAGE) || document.location.href.match(Inspd_JSON_ALLITEMS_PAGE)){
											$cloud.extract_tags_from_posts('inspd_cloud', Insipid.posts);
										}
										
										
									}						
						} 
						else {
							// error
							$id('nav').style.display = 'none';
							$id('contposts').innerHTML = '<div style="font-size: 20px;padding:30px 8px 8px 8px;font-family: verdana,arial,sans-serif;"><span style="color:#ff0000">Connection error!</span> Please try again.</div>';
				
						}
						
						}
						catch(e){
							$id('nav').style.display = 'none';
							$id('contposts').innerHTML = '<div style="font-size: 20px;padding:30px 8px 8px 8px;font-family: verdana,arial,sans-serif;"><span style="color:#ff0000">Connection error!</span> Please try again.</div>';
				
						}
						
					}
				};
				
				http_request.open('GET', url, true);
				http_request.setRequestHeader("Connection", "close");
				http_request.setRequestHeader("Keep-Alive", "");
				http_request.send(null);

	},
	
	
	pageLoad: function(){
		$conditions.gate();
		this.draw_body_page();
	
	}
		
}


	
	
$utils.addEvent('DOMContentLoaded', window, function() { $home.pageLoad(); }, false);

