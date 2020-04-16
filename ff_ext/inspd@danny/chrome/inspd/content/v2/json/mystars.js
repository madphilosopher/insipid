var $mystars = {
	
	extract_stars : function(){
			var stars = $prefs.get('stars.list').split('|');
			var CurStars = [];
			if (!stars[0]){
				$id('contposts').innerHTML = '<span class="pagination">'+$stars.show_header(stars[0])+'</span>';
			}
			else {	
				if(!stars[(stars.length)]){stars.length = stars.length-1}
				for(var i = 0; i<stars.length;i++){
					CurStars[i] = {
						'u': $utils.decode(stars[i].split(" ")[1]),
						'd': $utils.decode(stars[i].split(" ")[2]),
						't': $utils.decode(stars[i].split(" ")[3]).split(","),
						'n': $utils.decode(stars[i].split(" ")[4]), 
					    'dt' : $utils.decode(stars[i].split(" ")[5]),
					};
				}
				$id('contposts').innerHTML = '';
				$id('inspd_cloud_mini_header').style.visibility = 'visible';
				$cloud.extract_tags_from_posts('inspd_cloud', CurStars);
				$posts.g_draw('contposts',CurStars);
			}
			
	},
		
	pageLoad: function(){
			this.extract_stars();
	}
		
}


	
	
$utils.addEvent('DOMContentLoaded', window, function() { $mystars.pageLoad(); }, false);

