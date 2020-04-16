var $qpost = {

	pageLoad : function(){
		
		document.forms[0].setAttribute('action',''+$prefs.get('defurl')+'');
		document.forms[0].setAttribute('onsubmit','return $qpost.validateForm();');
		if ($utils.qs('redirect') == 'true'){
			document.forms[0].redirect.setAttribute('checked','true');
		}
		else {
			document.forms[0].redirect.removeAttribute('checked');
		}
		
		if($utils.qs('url')){
			document.forms[0].url.value = $utils.decode($utils.qs('url'));
		
		}
		
		if($utils.qs('title')){
			document.forms[0].title.value = $utils.decode($utils.qs('title'));
		
		}
		
		
	},
	
	validateForm : function(){
		if(!$utils.trim(document.forms[0].url.value)){
			alert('Please enter a URL for your post');
			return false;
		}
		else if(!$utils.trim(document.forms[0].title.value) ){
				alert('Please enter a title for your post');
				return false;
		}
		else {
			return true;
		}
	
	}



}


$utils.addEvent('DOMContentLoaded', window, function() { $qpost.pageLoad(); }, false);


