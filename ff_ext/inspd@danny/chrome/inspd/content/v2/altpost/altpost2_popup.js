String.prototype.escRegExp = function(){ return this.replace(/[\\$*+?()=!|,{}\[\]\.^]/g,'\\$&') }
String.prototype.unescHtml = function(){ var i,t=this; for(i in e) t=t.replace(new RegExp(i,'g'),e[i]); return t }
function Suggestions() { this.length=1; this.picked=0; this[0] = 'dummy' }
var suggestions = new Suggestions()
var tagSearch='', lastEdit=''
var h={}, sections=[{},{},{},{},{}], selected={}, currentTag={}, e={'&lt;':'<','&gt;':'>','&amp;':'&','&quot;':'"'}, reco = {}

function init() { var elements = ['rec','pop','pop2','network','pop3'], divs={}, freqSort=[], freqMap={}, t,i
	for(i in elements) divs[elements[i]] = makeDiv(elements[i] + 'tags')
	elements = elements.concat('suggest','tags')
	for(i in elements) h[elements[i]] = $id(elements[i])
	for(t in tags) {
		if (!freqMap[tags[t]]) { freqMap[tags[t]] = {}; freqSort[freqSort.length] = tags[t] }
		freqMap[tags[t]][t] = true;
	}
	freqSort.sort(function(a,b){return b-a})
	for(i in freqSort) { for(t in freqMap[freqSort[i]]) tagSearch += t + ' ' }
	for(t in tagFor) { t = 'for:'+tagFor[t] 
		sections[2][t.toLowerCase()] = makeTag(divs.network, t, 'swap')
		tagSearch += t + ' '
	}
	if(tagFor.length > 0) { h.network.style.display = 'block'; h.network.appendChild(divs.network) }
	
	
	
	
	for(t in tagPop) { t = tagPop[t]
		sections[0][t.toLowerCase()] = makeTag(divs.pop, t, 'swap')
		// if(!sections[0][t.toLowerCase()] && !sections[4][t.toLowerCase()]) tagSearch += t + ' '
	}
	if(tagPop.length > 0) { h.pop.style.display = 'block'; h.pop.appendChild(divs.pop) }
	
	
	for(t in tagPop2) { t = tagPop2[t]
		sections[3][t.toLowerCase()] = makeTag(divs.pop2, t, 'swap')
		 //if(!sections[0][t.toLowerCase()] && !sections[4][t.toLowerCase()]) tagSearch += t + ' '
	}
	if(tagPop2.length > 0) { h.pop2.style.display = 'block'; h.pop2.appendChild(divs.pop2) }
	
	
	
	for(t in tagPop3) { t = tagPop3[t]
		sections[4][t.toLowerCase()] = makeTag(divs.pop3, t, 'swap')
		 //if(!sections[0][t.toLowerCase()] && !sections[4][t.toLowerCase()]) tagSearch += t + ' '
	}
	if(tagPop3.length > 0) { h.pop3.style.display = 'block'; h.pop3.appendChild(divs.pop3) }
	
	
	
	
	
	
	for(t in tagRec) { t = tagRec[t]
		reco[t.toLowerCase()] = true
		sections[1][t.toLowerCase()] = makeTag(divs.rec, t, 'swap')
		for(i in sections) {
			if(sections[i][t.toLowerCase()]) addClass(sections[i][t.toLowerCase()], 'recommended')
		}}
	if(tagRec.length > 0) { h.rec.style.display = 'block'; h.rec.appendChild(divs.rec) }
	
	document.onkeyup = keyup
	h.tags.onkeypress = keypress; h.tags.onkeydown = keydown

	$id('url').onfocus = $id('title').onfocus = $id('description').onfocus = dropdownBlur
	$id('tags').onfocus = dropdownFocus
	
	addClass($id('suggest'), 'popup')
	$id('suggest').style.top = getY($id('tags')) + h.tags.offsetHeight - 1 + 'px'
	inviso = document.createElement('div')
	inviso.style.top = inviso.style.left = 0
	inviso.style.position = 'absolute'; inviso.style.visibility = 'hidden'
	inviso.style.fontSize = getStyle($id('tags'), 'font-size')
	inviso.style.fontFamily = getStyle($id('tags'), 'font-family')
	
	h.tags.parentNode.appendChild(inviso)
	updateHilight()
	//$id('title_line2').innerHTML = '';	
	//$id('poptags_msg').innerHTML = 'popular tags for this url from del.icio.us:';
	/*if (Inspd_delicious_username != 0 && Inspd_delintegrate_commontags == 1 && !document.forms[0].url.value.match(''+Inspd_defurl+'') && !document.forms[0].url.value.match('chrome\\://') && document.forms[0].url.value.match('^http\\://') && !document.forms[0].url.value.match('^http\\://localhost') && !document.forms[0].url.value.match('^http\\://127.0.0.') && !document.forms[0].url.value.match('^http\\://192.168.0.') && !document.forms[0].url.value.match('^http\\://10.0.0.')){
	*/
	var bulletIconTXT = '<img src="chrome://inspd/content/v2/altpost/images/inspd_altpost_arrow1.png" width="16" height="16" align="absmiddle"/>';
	$id('pop2tags_msg').innerHTML = ''+bulletIconTXT+' tags used in your 30 most recent bookmarks:';
	
	if($utils.qs('copytags') && $utils.qs('copytags') != 'null'){
		if ($utils.qs('copyuser') && $utils.qs('copyuser') != 'null' && $utils.qs('copyuser') != false ){
			$id('pop3tags_msg').innerHTML = ''+bulletIconTXT+' you copied this bookmark from user <a title="Go to this user\'s home page" href="http://del.icio.us/'+$utils.qs('copyuser')+'" target="_blank">'+$utils.decode($utils.qs('copyuser'))+'</a> with tags:';
		}
		else {
			$id('pop3tags_msg').innerHTML = ''+bulletIconTXT+' tags copied with this bookmark from del.icio.us:';
		}
	}	
	
	if(typeof(Inspd_delintegrate_commontags_found)!='undefined') {
			if(Inspd_delintegrate_commontags_found == 1){
				if(typeof(Inspd_delintegrate_commontags_found_url)!='undefined' && Inspd_delintegrate_commontags_found_url == 1){
					$id('poptags_msg').innerHTML = '<span style="color:#000000;display:block;">'+bulletIconTXT+' <small style="font-size:100%;color:#FE6601;">popular</small> tags for this URL from <small style="font-size:100%;color:#0201FD;"><a title="go to this url&#39;s history page" href="http://del.icio.us/url/'+hex_md5(document.forms[0].url.value)+'" target="_blank">del.icio.us</a>:</small> <small style="font-size:80%;color:#000000;">[&nbsp;<b style="cursor:pointer;color:#ff0000;" id="loggedindelusername" onmouseover="this.innerHTML=\'you are hitting del.icio.us history pages to get popular tags. Hit with caution!\'" onmouseout="this.innerHTML=\'....\'">....</b>&nbsp;]</small></span>';
				}
				else{
					$id('poptags_msg').innerHTML = '<span style="color:#000000;display:block;">'+bulletIconTXT+' <small style="font-size:100%;color:#FE6601;">popular</small> tags for this URL from <small style="font-size:100%;color:#0201FD;"><a title="go to your del.icio.us home page" href="http://del.icio.us/'+Inspd_delicious_username+'" target="_blank">your del.icio.us post page</a>:</small> <small style="font-size:80%;color:#000000;">[&nbsp;<b style="cursor:pointer;color:#006625;" id="loggedindelusername" onmouseover="this.innerHTML=\'you are logged into del.icio.us as: '+Inspd_delicious_username+'\'" onmouseout="this.innerHTML=\'....\'">....</b></a>&nbsp;]</small></span>';
				}
			}
			else if(Inspd_delintegrate_commontags_found == 2){
				//$id('poptags_msg').innerHTML = '<span style="color:#CC0001;background-color:#FFFFCC;'+
				//'-moz-box-sizing:border-box;-moz-border-radius: 5px 5px 5px 5px ;padding:5px;'+
				//'border: 0px solid #cccccc;">no popular tags were found for this url on del.icio.us</span>';
				setTimeout('$id(\'poptags_msg\').innerHTML=\'\';$id(\'poptags_msg\').innerHTML=\'<span style="color:#CC0001;background-color:#FFFFCC;-moz-box-sizing:border-box;-moz-border-radius: 5px 5px 5px 5px ;padding:5px;border:1px solid #FFFF9D;">no popular tags were found for this url on del.icio.us</span>\';',500);
				//setTimeout('$effects.fadeOut(\'poptags_msg\');',6000);
				setTimeout('$id(\'poptags_msg\').setAttribute("style","visibility:hidden;");',6000);
			}
			
			else if(Inspd_delintegrate_commontags_found == 3){
				setTimeout('$id(\'poptags_msg\').innerHTML=\'\';$id(\'poptags_msg\').innerHTML=\'<span style="color:#CC0001;background-color:#FFFFCC;-moz-box-sizing:border-box;-moz-border-radius: 5px 5px 5px 5px ;padding:5px;border:1px solid #FFFF9D;">Could not connect to del.icio.us</span>\';',500);
				//setTimeout('$effects.fadeOut(\'poptags_msg\');',6000);
				setTimeout('$id(\'poptags_msg\').setAttribute("style","visibility:hidden;");',6000);
			}
			
			else if(Inspd_delintegrate_commontags_found == 4){
				setTimeout('$id(\'poptags_msg\').innerHTML=\'\';$id(\'poptags_msg\').innerHTML=\'<span style="color:#CC0001;background-color:#FFFFCC;-moz-box-sizing:border-box;-moz-border-radius: 5px 5px 5px 5px ;padding:5px;border:1px solid #FFFF9D;">You have chosen to get popular tags from your del.icio.us posting page but you are not logged in! Login first!</span>\';',500);
				//setTimeout('$effects.fadeOut(\'poptags_msg\');',10000);
				setTimeout('$id(\'poptags_msg\').setAttribute("style","visibility:hidden;");',10000);
			}
			
			else if(Inspd_delintegrate_commontags_found == 5){
				setTimeout('$id(\'poptags_msg\').innerHTML=\'\';$id(\'poptags_msg\').innerHTML=\'<span style="color:#CC0001;background-color:#FFFFCC;-moz-box-sizing:border-box;-moz-border-radius: 5px 5px 5px 5px ;padding:5px;border:1px solid #FFFF9D;">You are hitting del.icio.us history page too much! Please switch back to "Get popular tags from personal page" for a while.</span>\';',500);
				//setTimeout('$effects.fadeOut(\'poptags_msg\');',10000);
				setTimeout('$id(\'poptags_msg\').setAttribute("style","visibility:hidden;");',10000);
			}
				
	}
	else{
		setTimeout('$effects.fadeOut(\'poptags_msg\');',1);
	}
	
	

}

var tagsFocused = false
function dropdownBlur() { tagsFocused = false; hideSuggestions() }
function dropdownFocus() { tagsFocused = true }

function makeDiv(id) { var obj=document.createElement('div'); obj.id=id; return obj }

var tagHeight = 0
function makeTag(parent, tag, js, post, display) {
	parent.appendChild(document.createTextNode(' '))
	var obj = document.createElement('a')
	if (display) obj.style.display = display
	obj.className = 'tag'
	obj.setAttribute('href','javascript:'+js+'("'+tag.replace(/"/g,'\\"')+'")')
	var text = tag
	if(post) text += post
	obj.appendChild(document.createTextNode(text))
	
	var tagCountTXT //= '' ;
	if (tags[tag] !== undefined){tagCountTXT = tags[tag];}else{tagCountTXT = 0;tags[tag]= 0;}
	
	
	
	if(reco[tag.toLowerCase()]) addClass(obj, 'recommended')
	else if(tagCountTXT < 2) obj.style.color = '#66f'
	else if(tagCountTXT == 2) obj.style.color = '#44f'
	
	
	
	
	//if(tags[tag] > 10) obj.style.fontSize = '90%'
	parent.appendChild(obj)
	if (tagHeight == 0) tagHeight = obj.offsetHeight
	return obj
}

function select(t) { var i; t=t.toLowerCase()
	selected[t] = true; for(i in sections) if(sections[i][t]) addClass(sections[i][t], 'selected')
}
function deselect(t) { var i; t=t.toLowerCase()
	delete selected[t]; for(i in sections) if(sections[i][t]) rmClass(sections[i][t], 'selected')
}

function swap(tag){
	var tagArray = h.tags.value.trim().split(' '), present=false, t, tl=tag.toLowerCase()
	if (tagArray[0].trim() == '') tagArray.splice(0,1);
	for (t=0; t<tagArray.length; t++) {
		if (tagArray[t].toLowerCase() == tl) { tagArray.splice(t,1); deselect(tag); present=true; t-=1  }
	}
	if (!present) { tagArray.push(tag); select(tag) }
	var content = tagArray.join(' ')
	lastEdit = h.tags.value = (content.length > 1) ? content + ' ' : content
	hideSuggestions()
	focusTo(h.tags)
}

function complete(tag) { var tagArray=h.tags.value.split(' ')
	if(typeof tag == 'undefined') tag = suggestions[suggestions.picked].innerHTML.replace(/ \([0-9]+\)$/, '').unescHtml() // tab complete rather than click complete
	tagArray[currentTag.index] = tag
	var text = tagArray.join(' ')
	h.tags.value = (text.substr(-1,1) == ' ' ? text : text + ' ' )
	hideSuggestions()
	updateHilight()
	focusTo(h.tags)
	//$id("tags").blur();   //hack to "wake up" safari
	//$id("tags").focus();
}

// focus the caret to end of a form input (+ optionally select some text)
var range=0 //ie
function focusTo(obj, selectFrom) {
	if (typeof selectFrom == 'undefined') selectFrom = obj.value.length
	if(obj.createTextRange){ //ie + opera
		if (range == 0) range = obj.createTextRange()
		range.moveEnd("character",obj.value.length)
		range.moveStart("character",selectFrom)
		setTimeout('range.select()', 10)
	} else if (obj.setSelectionRange){ //ff
		obj.select()
		obj.setSelectionRange(selectFrom,obj.value.length)
	} else { //safari :(
	 obj.blur()
	 obj.focus()
}}

function updateHilight() { var tagArray=h.tags.value.toLowerCase().split(' '), tagHash={}
	if (tagArray[0].trim() == '') tagArray.splice(0,1);
	for (t in tagArray) {
		if(tagArray[t] != '') {
			select(tagArray[t])
			tagHash[tagArray[t]] = true
	}}
	for (t in selected) {if (!tagHash[t]) deselect(t)}
	return [tagArray, tagHash]
}

function hideSuggestions() {
	h.suggest.parentNode.parentNode.style.visibility='hidden'
	$id('suggest').style.left = '700px'
}
function showSuggestions() {
	suggest(0)
	var pos = 0, tagz = h.tags.value.split(' '), s = $id('suggest'), t = $id('tags')
	
	for(var i=0; i<currentTag.index; i++) { pos += tagz[i].length+1 }
	var text = h.tags.value.substr(0,pos)
	var esc = {'<':'[','>':']',' ':'&nbsp;'}
	for(var i in esc) text=text.replace(new RegExp(i,'g'), esc[i])
	inviso.innerHTML = text
	s.style.height = 'auto'; s.style.width = 'auto'; s.style.overflow = 'visible'
	var suggestHeight = getY(s) + s.offsetHeight
	if(windowHeight() < suggestHeight) {
		s.style.height = windowHeight() - getY(s) - 2 + 'px'
		s.style.overflow = 'auto'
		s.scrollTop = 0
		if(s.clientWidth < s.scrollWidth) s.style.width = s.scrollWidth + (s.scrollWidth - s.clientWidth) + 'px' // get rid of horizontal scrollbars on ie overflow divs
	}
	s.style.left = getX(t) + inviso.offsetWidth + 'px' // put dropdown right below current typed tag
	if(getX(s) + s.offsetWidth > getX(t) + t.offsetWidth) { // force dropdown to right align to tags input
		s.style.left = getX(s) - (getX(s) + s.offsetWidth - getX(t) - t.offsetWidth) + 'px'
	}
	h.suggest.parentNode.parentNode.style.visibility='visible'
}

function scrollDropdown() {
	var amt = Math.ceil((Math.ceil($id('suggest').offsetHeight - tagHeight) / tagHeight) / 2 )
	var scrollTo = (suggestions.picked * tagHeight) - (amt * tagHeight)
	$id('suggest').scrollTop = (scrollTo < 0) ? 0 : scrollTo
}

function updateSuggestions() {
	if(!getCurrentTag() || !currentTag.text || !tagsFocused) { hideSuggestions(); return false }

	while (h.suggest.hasChildNodes()) h.suggest.removeChild(h.suggest.firstChild)
	delete suggestions; suggestions = new Suggestions();
	var tagArray = h.tags.value.toLowerCase().split(' '), txt=currentTag.text.escRegExp(), tagHash={}, t
	for(t in tagArray) tagHash[tagArray[t]] = true

	var search = tagSearch.match(new RegExp(("(?:^| )("+txt+"[^ ]+)"), "gi"))
	if(search){
		for (i=0; i<search.length; i++) {
			tl = search[i].trim()
			if(tagHash[tl])  continue // do not suggest already typed tag
			var text = tags[tl] ? ' ('+tags[tl]+')' : ''
			suggestions[suggestions.length] = makeTag(h.suggest, tl, 'complete', text, 'block')
			suggestions.length++
	}}
	if (suggestions.length > 1) showSuggestions()
	else hideSuggestions()
}

function suggest(index) {
	if(suggestions.length == 1) index = 0
	if(suggestions[suggestions.picked].className) rmClass(suggestions[suggestions.picked], 'selected')
	addClass(suggestions[suggestions.picked = index], 'selected')
}

function getCurrentTag() {
	if(h.tags.value == lastEdit) return true // no edit
	if(h.tags == '') return false
	currentTag = {}
	var tagArray=h.tags.value.toLowerCase().split(' '), oldArray=lastEdit.toLowerCase().split(' '), currentTags = [], matched=false, t,o
	for (t in tagArray) {
		for (o in oldArray) {
			if(typeof oldArray[o] == 'undefined') { oldArray.splice(o,1); break }
			if(tagArray[t] == oldArray[o]) { matched = true; oldArray.splice(o,1); break; }
		}
		if(!matched) currentTags[currentTags.length] = t
		matched=false
	}
	// more than one word changed... abort
	if(currentTags.length > 1) { hideSuggestions(); return false }
	currentTag = { text:tagArray[currentTags[0]], index:currentTags[0] }
	return true
}

function prevent(e) {
	if (window.event) window.event.returnValue = false
	else e.preventDefault()
}

function keydown(e) { e=e||window.event
	if(h.suggest.parentNode.parentNode.style.visibility == 'visible') {
		switch(e.keyCode) {
			case 40:
				suggest((suggestions.picked + 1) % suggestions.length)
				scrollDropdown()
				prevent(e)
				break
			case 38:
				suggest(suggestions.picked == 0 ? suggestions.length - 1 : suggestions.picked - 1)
				scrollDropdown()
				prevent(e)
				break
}}}

function keypress(e) { e=e||window.event
	switch(e.keyCode){
		case 38: case 40:
			prevent(e)
			break
		case 9:
			if(h.suggest.parentNode.parentNode.style.visibility == 'visible') prevent(e)
			break
		case 13:
			if(h.suggest.parentNode.parentNode.style.visibility == 'visible' && suggestions.picked > 0) prevent(e)
			break
		default: lastEdit = h.tags.value
}}

function keyup(e) { e=e||window.event
	switch(e.keyCode){
		case 38: case 40:
			prevent(e)
			break
		case 9:
			if(h.suggest.parentNode.parentNode.style.visibility == 'visible') {
				if (suggestions.picked == 0) suggest(1)
				complete()
				prevent(e)
			}
			break
		case 13:
			if(h.suggest.parentNode.parentNode.style.visibility == 'visible' && suggestions.picked > 0) {
				complete()
				prevent(e)
			}
			break
		case 35: //end
		case 36: //home
		case 39: //right
		case 37: //left
		case 32: //space
			hideSuggestions()
			break
		default: updateSuggestions()
}}