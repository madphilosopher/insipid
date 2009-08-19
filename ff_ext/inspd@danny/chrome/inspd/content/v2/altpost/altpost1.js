String.prototype.trim = function(){ return this.replace(/^\s+|\s+$/g,'') }
String.prototype.unescHtml = function(){ var i,e={'&lt;':'<','&gt;':'>','&amp;':'&','&quot;':'"'},t=this; for(i in e) t=t.replace(new RegExp(i,'g'),e[i]); return t }

function loadTags(t) { tags = t }

// styling functions
function isA(o,klass){ if(!o.className) return false; return new RegExp('\\b'+klass+'\\b').test(o.className) }
function addClass(o,klass){ if(!isA(o,klass)) o.className += ' ' + klass }
function rmClass(o,klass){ o.className = o.className.replace(new RegExp('\\s*\\b'+klass+'\\b'),'') }
function swapClass(o,klass,klass2){ var swap = isA(o,klass) ? [klass,klass2] : [klass2,klass]; rmClass(o,swap[0]); addClass(o,swap[1]) }
function getStyle(o,s) {
	if (document.defaultView && document.defaultView.getComputedStyle) return document.defaultView.getComputedStyle(o,null).getPropertyValue(s)
	else if (o.currentStyle) { return o.currentStyle[s.replace(/-([^-])/g, function(a,b){return b.toUpperCase()})] }
}
// shorter names for grabbing stuff
//function $id(id){ return document.getElementById(id) }
function $tags(t,o){ o=o||document; return o.getElementsByTagName(t) }
function $tag(t,o,i) { o=o||document; return o.getElementsByTagName(t)[i||0] }
// get elements by class name, eg $c('post', document, 'li')
function $c(c,o,t) { o=o||document;
	if (!o.length) o = [o]
	else if(o.length == 1 && !o[0]) o = [o] // opera, you're weird
	var elements = []
	for(var i = 0, e; e = o[i]; i++) {
		if(e.getElementsByTagName) {
			var children = e.getElementsByTagName(t || '*')
			for (var j = 0, child; child = children[j]; j++) if(isA(child,c)) elements.push(child)
	}}
	return elements
}

// get mouse pointer position
function pointerX(e) { return e.pageX || (e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft)) }
function pointerY(e) { return e.pageY || (e.clientY + (document.documentElement.scrollTop || document.body.scrollTop)) }

// get window size
function windowHeight() { return self.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0 }
function windowWidth() { return self.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0 }

// get pixel position of an object
function getY(o){ var y = 0
	if (o.offsetParent) while (o.offsetParent) { y += o.offsetTop; o = o.offsetParent }
	return y
}
function getX(o){ var x = 0
	if (o.offsetParent) while (o.offsetParent) { x += o.offsetLeft; o = o.offsetParent }
	return x
}


// event functions
function falseFunc(){ return false }

// the following two functions ganked from prototype (see http://prototype.conio.net)
// (c) 2005 Sam Stephenson
var Class = {
	create: function() {
		return function() { this.initialize.apply(this, arguments) }
}}
Function.prototype.bind = function(o) {
	var __method = this
	return function() { return __method.apply(o, arguments) }
}