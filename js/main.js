//注意页面中button的id命名规则，要与rule的规则对应
//例如针对ruCombineBrokenLines这样一个rule，button的id要设置为combineBrokenLines

$(function() {
	var rules = {}; //用来盛放所有的替换规则

	//utils
	//设置文本选中高亮
	var setTextSelected = function(inputDom, startIndex, endIndex) {
		if (inputDom.setSelectionRange) {
			inputDom.setSelectionRange(startIndex, endIndex);
		} else if (inputDom.createTextRange) //IE
		{
			var range = inputDom.createTextRange();
			range.collapse(true);
			range.moveStart('character', startIndex);
			range.moveEnd('character', endIndex - startIndex - 1);
			range.select();
		}
		inputDom.focus();
	}

	//获取选中文本
	var getSelectedText = function(inputDom) {
		if (document.selection) //IE
		{
			return document.selection.createRange().text;
		} else {
			return inputDom.value.substring(inputDom.selectionStart,
				inputDom.selectionEnd);
		}
	}

	//替换选中文本并再次选中文本
	var replaceSelectedText = function(elem, rules) {
		var selectedText = getSelectedText(elem);
		if(selectedText == ''){
			//如果什么文字都没有选，就选中整段文本
			setTextSelected(elem, 0, elem.value.length);
			return replaceSelectedText(elem, rules);
		}
		if (!Array.isArray(rules) && typeof rules == 'object') {
			var newText = selectedText.replace(new RegExp(rules['re'], rules['flag']), rules['f']);
			var newTextLength = newText.length;
			var start = elem.selectionStart;
			var end = elem.selectionEnd;
			var oldText = elem.value;
			elem.value = oldText.substr(0, start) + newText + oldText.substr(end, oldText.length);
			setTextSelected(elem, start, start + newTextLength);
			return elem.value;
		}
		if (Array.isArray(rules)){
			rules.forEach(function(rule){
				replaceSelectedText(elem, rule);
			})
		}
	}

	//escapeRegExp
	function escapeRegExp(string){
	  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

    //设置样式
	var resetEditorWidth = function(){
		$('#editor').width($('.textarea').width() - 120 + 'px');
	}

	var resetEditorHeight = function(){
		$('#editor').height($('.textarea').height() - 140 + 'px');
	}

	resetEditorHeight();
	resetEditorWidth();
	$(window).on('resize', function(){
		resetEditorHeight();
		resetEditorWidth();
	})

	//匹配规则汇总
	var ruCombineBrokenLines = {
		'name': '断句行合并',
		're':  '(.+[^\\.?\\.”"!！。’\'])\\s*\\n', //匹配不是以这些符号结尾的断行
		'flag': 'g',
		'f': function(str, brokenLine){
			return brokenLine.trim() + ' ';
		}
	}

	var ruParagraphIndent = {
		'name': '段首缩进四格',
		're': '^\\s*(.+)\\s*$', //匹配行内容
		'flag': 'mg', //启用多行模式
		'f': function(line, realContent){
			return '    ' + realContent.trim();
		}
	}

	var ruDeleteNumAfterLetters = {
		'name': '删除字母结尾后的数字',
		're': '([a-z]+)\\d+',
		'flag': 'g',
		'f': function(wordEndingWithNumber, word){
			return word;
		}
	}

	rules['ruCombineBrokenLines'] = ruCombineBrokenLines;
	rules['ruParagraphIndent'] = ruParagraphIndent;
	rules['ruDeleteNumAfterLetters'] = ruDeleteNumAfterLetters;


	//统一为按钮添加事件
	$.each($('#toolbars button'), function(idx, btn){
		var id = btn.id;
		var ruleName = 'ru' + id[0].toUpperCase() + id.substring(1);
		var editor = $('#editor').get(0);
		$('#' + id).on('click', function(){
			replaceSelectedText(editor, rules[ruleName]);
		})
	})

	$('#executeReplace').on('click', function(){
		
	})
})