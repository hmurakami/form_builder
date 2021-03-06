/**
 * @projectDescription	Indents (x)html source code.
 *
 * @author 	mizuki fujitani
 * @version 1.2 2009-08-12
 * @license GPL
 */

(function($){

var DEFAULTS = {
	tab: '\t',
	xhtml: true, // ex. <img> --> <img />, <br> --> <br />
	singles: ['br', 'img', 'hr'],
	conserve: ['script', 'label'],
	selector: ''
};

var O = {}, D = 0;

var tabs = function(){
	var t = '\n', i;
	for(i = 0; i < D; i ++){
		t += O.tab;
	}
	return t;
};

var msie_style2lc = !$.support.noCloneChecked ? function(styles){
	styles = styles.split(';');
	for(var i = 0;  i < styles.length; i ++){
		styles[i] = styles[i].split(':');
		styles[i][0] = styles[i][0].toLowerCase();
		styles[i] = styles[i].join(':');
	}
	return styles.join(';');
} : 0;

var tag2src = function(dom, empty){
	var tag, attrs, src, i;
	if(dom.nodeType === 1 /* HTMLElement */){
		var tag = dom.nodeName.toLowerCase(), attrs = dom.attributes, attr_name, attr_value, src;
		src = '<'+tag;
		for(i = 0; i < attrs.length; i ++){
			attr_name = attrs[i].nodeName.toLowerCase();
			attr_value = attrs[i].nodeValue;
			if(!$.support.noCloneChecked
				&& (attr_name.indexOf('jquery') >= 0
				|| attr_value === ''
				|| attr_value === null
				|| attr_value === false
				|| attr_value === 'inherit'
				|| (attr_name === 'tabindex' && attr_value === 0))){
				continue;
			}
			src += ' ' + attr_name + '="' + attr_value + '"';
		}
		if(!$.support.noCloneChecked && (attr_value = $(dom).attr('style'))){
			src += ' style="' + msie_style2lc(attr_value) + '"';
		}

		if(empty){
			src += O.xhtml && $.inArray(tag, O.singles) >= 0 ? ' />' : '></' + tag + '>';
		}else{
			src = [src + '>', '</' + tag + '>'];
		}
	}else{ /* TextNode */
		src = dom.nodeValue;
	}
	return src;
};

var insert_tabs = function(source){
	var indented = '', conserved = [], wrap = $('<div></div>'), i, tag, re;

	// 1:

	for(i = 0; i < O.conserve.length; i ++){
		tag = O.conserve[i],
		re = new RegExp(
			'(<'+tag+'(\\s+[\\w-:]+=[\"\']?.*?[\"\']?)*?\\s*>([\\s\\S]*?)<\\/'+tag+'>'+
			'|'+
			'<'+tag+'(\\s+[\\w-:]+=[\"\']?.*?[\"\']?)*?\\s*\\/?>)'+
			(tag === 'script' ? '(\\s*?<noscript>(.*?)<\\/noscript>)?':''), 'ig');

		source = source.replace(re, function(a0, a1, a2, a3, a4, a5, a6){
			conserved.push(tag == 'script' && typeof a5 === 'string' && a5.length ? a1 + a5 : a1);
			return '<div class="jquery-indent-conserved-'+(conserved.length-1)+'"></div>';
		});
	}

	// 2:

	source = source
		.replace(/<!--[\S\s]*?-->/g, '')
		.replace(/>\n?[\t ]+/g, '>')
		.replace(/[\t ]+</g, '<')
		.replace(/[\t ]*\n[\t ]*/g, '');

	// 3:

	wrap.html(source);
	if(O.selector){
		wrap = $(O.selector, wrap);
		if(wrap.length === 0 || !wrap.html().length){
			return '';
		}else if(wrap.length > 1){
			wrap = wrap.eq(0);
		}
		D = 1;
	}

	// 4:

	wrap.contents().each(function(){
		var children = $(this).contents(), src;

		if(children.length === 0){
			indented += tabs() + tag2src(this, true);
		}else if(children.length === 1 && children.get(0).nodeType === 3){
			src = tag2src(this, false);
			indented += tabs() + src[0] + children.get(0).nodeValue + src[1];
		}else{
			src = tag2src(this, false);
			indented += tabs() + src[0];
			D ++;
			children.each(arguments.callee);
			D --;
			indented += tabs() + src[1];
		}

	});

	// 5:

	if(O.selector){
		tag = tag2src(wrap.get(0));
		indented = tag[0] + indented + '\n' + tag[1];
	}

	indented = indented.replace(/<div class="jquery-indent-conserved-(\d+)"><\/div>/g, function(a0, a1){
		return conserved[a1];
	})
	.replace(/^\n/, '') // ^\n
	.replace(/<\/label>\n\t*<br \/>/g, '</label><br />')
	.replace(/(姓　|名　|せい|めい|セイ|メイ)\n\t*/g, '$1 ');

	D = 0;

	return indented;
};

$.extend({
	indent: function(source, options){
		O = $.extend({}, DEFAULTS, options);
		if(typeof source === 'string' && source.length){
			return insert_tabs(source);
		}else{
			return $;
		}
	}
});

$.fn.extend({
	indent: function(options){
		var sources = [];
		O = $.extend({}, DEFAULTS, options);
		this.each(function(){
			sources.push(insert_tabs(this.innerHTML));
		});
		return sources.length ? (sources.length > 1 ? sources : sources[0]) : '';
	}
});

})(jQuery);
