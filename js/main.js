$(function() {
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
			alert('请先选中要整理的文字。');
			return;
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

	var resetEditorWidth = function(){
		$('#editor').width($('.textarea').width() - 120 + 'px');
	}

	resetEditorWidth();
	$(window).on('resize', function(){
		resetEditorWidth();
	})

	$('#getSelection').on('click', function(){
		replaceSelectedText($('#editor').get(0), {'re': '\\d', 'flag': 'g', 'f': addOne});
	});
})