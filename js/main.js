
$(function() {
	// var rules = {}; //所有的正则替换规则，已经从config中加载过了
	// var userPlan = [ruCombineBrokenLines, ruParagraphIndent, ruDeleteNumAfterLetters]; //用来盛放用户策略
	// var useUserPlanOnPaste = false;
	// var groups = {
	// 	'lines': '段落处理',
	// 	'spaces': '空格处理',
	// 	'deletes': '删除处理',
	// 	'userDefined': '用户自定义'
	// }

	//utils
	//设置文本选中高亮
	var trackInputTimer = null; //用于input的自动保存
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
			return inputDom.value.substring(inputDom.selectionStart,inputDom.selectionEnd);
		}
	}

	//替换选中文本并再次选中文本
	var replaceSelectedText = function(elem, rules) {
		//传入的rules有三种情况，一种是普通的正则规则，一种是userPlan的数组；还有一种是由【用户策略】生成的打包规则
		if (elem.value == '') return;
		var selectedText = getSelectedText(elem);
		if(selectedText == ''){
			//如果什么文字都没有选，就选中整段文本
			setTextSelected(elem, 0, elem.value.length);
			return replaceSelectedText(elem, rules);
		}
		if (!Array.isArray(rules) && typeof rules == 'object') {
			if (!Array.isArray(rules['f'])){ //针对普通规则的时候
				var newText = selectedText.replace(new RegExp(rules['re'], rules['flag']), rules['f']);
				var newTextLength = newText.length;
				var start = elem.selectionStart;
				var end = elem.selectionEnd;
				var oldText = elem.value;
				$(elem).val(oldText.substring(0, start) + newText + oldText.substring(end, oldText.length)).change();
				setTextSelected(elem, start, start + newTextLength);
				return elem.value;
			} else { //针对传入的是【用户策略】生成的打包规则的时候
				// 打包规则类似于：
				// {
				//   'name': '',
				//   're': '',
				//   'flag': '',
				//   'f': [rule1, rule2],
				//   'group': 'userDefined',
				//   'title': ''
				// }
				replaceSelectedText(elem, rules['f']);
			}

		}
		if (Array.isArray(rules)){ // 针对rules是userPlan的数组的情况
			rules.forEach(function(rule){
				replaceSelectedText(elem, rule);
			})
		}
	}

	//Escape all RegExp special characters
	var escapeRegExp = function (string){
	  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

    //设置样式
	var resetEditorWidth = function(){
		$('#editor').width($('.textarea').width() - 100 + 'px');
	}

	var resetEditorHeight = function(){
		$('#editor').height($('.textarea').height() - 140 + 'px');
	}

	resetEditorHeight();
	resetEditorWidth();

	window.addEventListener('resize', function(){
    resetEditorHeight();
    resetEditorWidth();
	})
	// $(window).on('resize', function(){
	// })

  //生成【替换操作】以上部分的分组按钮
	var renderGroupButtons = function(rules){
		var $toolbars = $('#toolbars');
		var group;
		var button;
		var generatedGroups = [];

		var generateGroup = function(en, cn){
			var group = $('<div class=\"' + en + '\"></div>');
			var h3 = $('<h3>' + cn + '</h3>');
			group.prepend(h3);
			$('#toolbars').prepend(group);
			return group;
		}
		var generateButton = function(ru, rule, group){
			var reAllNums = /^[0-9]+$/;
			var id = '';
			if (reAllNums.test(ru)){ //说明这个rule是用户自定义的
				id = '' + ru;
			} else {
				id = ru[2].toLowerCase() + ru.substring(3);
			}
			var button = $('<button class=\"btn\" title=\"' + rule['title'] + '\" id=' + id + '>' + rule['name'] + '</button>');
			group.append(button);
			return button;
		}

		$('#toolbars').find('.userPlan').prevAll().remove();

		for(ru in rules){
			var groupEn = rules[ru]['group'];
			var groupCn = groups[groupEn];
			if (generatedGroups.indexOf(groupEn) == -1){
				group = generateGroup(groupEn, groupCn);
				generatedGroups.push(groupEn);
				button = generateButton(ru, rules[ru], group);
			} else {
				group = $('#toolbars' + ' .' + groupEn);
				button = generateButton(ru, rules[ru], group);
			}
		}

		//统一为按钮添加事件
		$.each($('#toolbars .btn'), function(idx, btn){
			var id = btn.id;
			var ruleName = '';
			var reAllNums = /^\d+$/;
			if (reAllNums.test(id)){
				ruleName = '' + id;
			} else {
				ruleName = 'ru' + id[0].toUpperCase() + id.substring(1);
			}

	    var editor = $('#editor').get(0);
			if (rules[ruleName]){
	      $('#' + id).on('click', function(){
	        replaceSelectedText(editor, rules[ruleName]);
	        trackHistory(editor.value, btn.innerText);
	      })
			}
		})

		//控制tooltip的显示
		var useTooltip = function(){
			//设置工作区按钮title的显示
			var offsetX = -10;
			var offsetY = 30;
			var newTitle = '';
			$('#toolbars button').mouseover(function(e){
				if (this.title == '' || this.title == '用户自定义') {
					newTitle = '';
					return;
				} else {
					newTitle = this.title;
				}
				this.title = '';
				$('body').append('<div id="tooltip">' + newTitle + '</div>');
				$('#tooltip').css({
					'left': (e.pageX + offsetX + 'px'),
					'top': (e.pageY + offsetY + 'px')
				}).show();
			}).mouseout(function(){
					this.title = newTitle;
				$('#tooltip').remove();
			}).mousemove(function(e){
				if(newTitle == '' || newTitle == '用户自定义') return;
				$('#tooltip').css({
					'left': (e.pageX + offsetX + 'px'),
					'top': (e.pageY + offsetY + 'px')
				}).show();
			})
		}

		useTooltip();

		//控制小工具条的显示与功能
		var useToolbtn = function(){
			var offsetX = -10;
			var offsetY = 20;
			var btnId = ''
			//显示
			$('#toolbars .btn').contextmenu(function(e){
				return false; //禁用原来的contextmenu
			})

			$('#toolbars').on('mousedown', function(e){
				if ($(e.target).hasClass('btn')) {
					btnId = e.target.id;
					if (e.button == 2){
						$('#tooltip').remove();
						$('#toolbtn').css({
							'left': (e.pageX + offsetX + 'px'),
							'top': (e.pageY + offsetY + 'px')
						}).show();
					}
				} else if(e.button == 0){
					$('#toolbtn').hide(100);
				}
			})

			$('.toolbararea').on('scroll', function(){
				$('#toolbtn').hide();
			})
			//功能
			$('#toolbtn button').eq(1).on('click', function(e){
				var ruleName = '';
				var reAllNums = /^\d+$/;
				if (reAllNums.test(btnId)){
					ruleName = '' + btnId;
				} else {
					ruleName = 'ru' + btnId[0].toUpperCase() + btnId.substring(1);
				}
				delete rules[ruleName];
				$('#toolbtn').hide();
				renderGroupButtons(rules);
			})

			$('#toolbtn button').eq(0).off('click').on('click', function(e){
				var ruleName = '';
				var reAllNums = /^\d+$/;
				if (reAllNums.test(btnId)){
					ruleName = '' + btnId;
				} else {
					ruleName = 'ru' + btnId[0].toUpperCase() + btnId.substring(1);
				}
				var ruTemp = $.extend(true, {}, rules[ruleName]);
				userPlan.push(ruTemp);
				$('#toolbtn').hide();
				renderUserPlan();
			})
		}
    useToolbtn();
	}
	renderGroupButtons(rules);

	var renderUserPlan = function(){
		var $userPlanList = $('#userPlan').find('ol');
		var checkboxA = $('#useUserPlanOnPaste').get(0);
		var checkboxB = $('#automaticSelectOnPaste').get(0);
		var $li;
		$userPlanList.empty();
		if (userPlan.length !== 0) {
			userPlan.forEach(function(rule, idx){
				$li = $('<li>' + rule['name'] + '</li>');
				$userPlanList.append($li);
			})
		}
		checkboxA.checked = useUserPlanOnPaste;
		checkboxB.checked = automaticSelectOnPaste;
	}
	renderUserPlan();

	//点选【粘贴时自动执行用户策略】复选框时的动作
	$('#useUserPlanOnPaste').on('click', function(e){
		var bool = e.target.checked;
		useUserPlanOnPaste = bool;
	})

	//点选【粘贴时自动选中粘贴内容】复选框的动作
	$('#automaticSelectOnPaste').on('click', function(e){
		var bool = e.target.checked;
		automaticSelectOnPaste = bool;
	})

	//点击【执行用户策略】按钮的操作
	$('#executeUserPlan').on('click', function(){
		if (userPlan.length == 0) return; //用户策略里面没东西，直接返回
		var editor = $('#editor').get(0);
		replaceSelectedText(editor, userPlan);
		trackHistory(editor.value, '执行用户策略');
	})

	//点击【清空用户策略】时候的操作
	$('#clearUserPlan').on('click', function(){
		$('#userPlan').find('ol').empty();
		userPlan = [];
	})

	//点击【打包为自定义按钮】时的操作
	$('#addToUserButtonFromUserPlan').on('click', function(){
		var ruTemp = {
			'name': '',
			're': '',
			'flag': '',
			'f': $.extend(true, [], userPlan),
			'group': 'userDefined',
			'title': ''
		}
		ruTemp['name'] = window.prompt('请给这个功能起个名字。') || '自定义打包策略';
		var randomId = ('' + Math.random()).replace('.', '');
		rules[randomId] = ruTemp;
		renderGroupButtons(rules);
	})

	//替换操作区域的规则生成
	var generateRuleFromReplace = function(){
		var editor = $('#editor').get(0);
		var pos = $('#paraPosition').val();
		var originalText = $('#originalText').val();
		var intendedText = $('#intendedText').val() || '';
		var flag;
		var reStr = '';
		switch (pos) {
			case 'inPara': //对应全文，单行模式
				reStr = originalText;
				flag = 'g';
				break;
			case 'beforePara': //匹配行首，多行模式
				reStr = '(?=^)' + originalText;
				flag = 'mg';
				break;
			case 'afterPara': //匹配行尾，多行模式
				reStr = originalText + '(?=$)';
				flag = 'mg';
				break;
			case 'inLine': //匹配行，多行模式
				reStr = originalText;
				flag = 'mg';
				break;
		}
		return {
			'group': 'userDefined',
			'name': '',
			're': reStr,
			'flag': flag,
			'f': ''.split.call(intendedText, '\\n').join('\n').split('\$\&').join('$&').split('\$\`').join('$`').split('\$\'').join('$\'').split('\\t').join('\t'),
			'title': '用户自定义'
		}
	}
	//开始替换按钮的动作
	$('#executeReplace').on('click', function(){
		var ruTemp = generateRuleFromReplace();
		replaceSelectedText(editor, ruTemp);
		trackHistory(editor.value, '执行替换操作');
	})

	//点击【+自定义按钮】时的动作
	$('#addToUserButtonFromReplace').on('click', function(){
		var ruTemp = generateRuleFromReplace();
		ruTemp['name'] = window.prompt('请给这个功能起个名字。') || '自定义替换';
		var randomId = ('' + Math.random()).replace('.', '');
		rules[randomId] = ruTemp;
		renderGroupButtons(rules);
	})

	//点击【+用户策略】时的动作
	$('#addToUserPlanFromReplace').on('click', function(){
		var ruTemp = generateRuleFromReplace();
		ruTemp['name'] = window.prompt('请给这个功能起个名字。') || '自定义策略';
		userPlan.push(ruTemp);
		renderUserPlan();
	})

	//为替换操作中上面一栏特殊字符按钮添加事件
	$('#regexCharacters').on('click', function(ev){
		var $originalText = $('#originalText');
		var originalText = $originalText.get(0);
		var chr = ev.target.dataset.chr;
		var posStart = originalText.selectionStart;
		var posEnd = originalText.selectionEnd;
		var prevStr = $originalText.val();
		var chrLength = chr.length;
		var newStr = prevStr.substring(0, posStart) + chr + prevStr.substring(posEnd);
		$originalText.val(newStr).focus();
		originalText.selectionStart = originalText.selectionEnd = posStart + chrLength;
	})

	//为替换操作中下面一栏的特殊字符按钮添加事件
	$('#replacerCharacters').on('click', function(ev){
    var $intendedText = $('#intendedText');
    var intendedText = $intendedText.get(0);
    var chr = ev.target.dataset.chr;
    var posStart = intendedText.selectionStart;
    var posEnd = intendedText.selectionEnd;
    var prevStr = $intendedText.val();
    var chrLength = chr.length;
    var newStr = prevStr.substring(0, posStart) + chr + prevStr.substring(posEnd);
    $intendedText.val(newStr).focus();
    intendedText.selectionStart = intendedText.selectionEnd = posStart + chrLength;
	})

	//为toolbar中的input添加onchange事件，如果不为空，则背景颜色变色以提示用户
	$('#toolbars').on('input', function(ev){
		var elem = ev.target;
		if (elem.tagName.toUpperCase() == 'INPUT' || elem.tagName.toUpperCase() == 'TEXTAREA') {
			if(elem.value != '') {
        elem.style.backgroundColor = 'rgb(254,244,197)';
			}else {
				elem.style.backgroundColor = '#fff';
			}
		}
	})

	//设置editor的paste事件
	$('#editor').on('paste', function(ev){
		var start = $('#editor').prop('selectionStart');
		var end;
		//var length = ev.originalEvent.clipboardData.getData('Text').length;
		setTimeout(function(){
			trackHistory(ev.target.value, '执行粘贴');
			end = $('#editor').prop('selectionEnd');
			setTextSelected(ev.target, start, end);
			if(useUserPlanOnPaste){ //是否在粘贴时就采用用户策略
				replaceSelectedText(ev.target, userPlan);
        trackHistory(ev.target.value, '执行用户策略');
			}
			start = ev.target.selectionStart;
			end = ev.target.selectionEnd;
			$(ev.target).val(ev.target.value.replace(/.{1}$/g,  "$&\n"));
			if(automaticSelectOnPaste){
        setTextSelected(ev.target, start, end);
			} else {
				if (!automaticSelectOnPaste) {
					var l = ev.target.value.length;
					setTextSelected(ev.target, l, l);
				}
			}
		}, 200)
	})

	//追踪editor的input事件
	$('#editor').on('input', function(ev){
		if (trackInputTimer) {
			return;
		} else {
			trackInputTimer = setTimeout(function(){
				trackHistory(ev.target.value, '自动保存');
				trackInputTimer = null;
			}, 1000 * autoSaveInterval);
		}
	})

	var renderHistory = function(){
		var $trackHistory = $('#trackHistory');
		$trackHistory.empty();
		$trackHistory.append($('<h3>历史跟踪</h3>'));
		var reverseHistory = $.extend(true, [], textareaHistory).reverse();
		reverseHistory.forEach(function(historyItem, idx){
			var $itemElement = $('<div class="historyItem">' + historyItem['executionName'] + '</div>')
			$trackHistory.append($itemElement);
			$itemElement.on('click', function(ev){
				var index = $(ev.target).index();
				var length;
				if (index == 1) {
					return;
				} else {
					textareaHistory.splice(1-index);
					length = textareaHistory.length;
					$('#editor').val(textareaHistory[length-1]['value']);
					renderHistory();
				}
				
			})
		})
	};

	renderHistory();

	//历史记录操作
	var trackHistory = function(val, executionName){
		var trackTotalCount = 50;
		var len = textareaHistory.length;
		if (len == 0){
			textareaHistory = [{'executionName': '内容为空', 'value': ''}];
		}
		if (val && executionName) { //增加History记录的时候
	      if(textareaHistory[len-1]['value'] == val) {
	        return false;
	      } else {
	        if (len >= trackTotalCount) {
	          textareaHistory.shift();
	        }
	        textareaHistory.push({'executionName': executionName, 'value': val});
	      }
		} else { //撤销操作的时候
		}
		renderHistory(); //重新渲染一遍History
	}

	var initEditor = function(){
		var len = textareaHistory.length;
		var initText = '';
		if (len >= 1) {
			initText = textareaHistory[len-1]['value'];
		}
		$('#editor').val(initText);
	}
	initEditor();

	//用来定义CTRL+Z的撤销动作
	$('body').on('keyup', function(ev){
		var historyStr = '';
		if(ev.which == 90 && ev.ctrlKey){
			if (textareaHistory.length == 0){
				textareaHistory.push({'executionName': '内容为空', 'value': ''});
			}
			textareaHistory.pop(); //把最后一次的值挤出来
			var length = textareaHistory.length;
			latestHistory = textareaHistory[length-1] || {'executionName': '内容为空', 'value': ''};
			$('#editor').val(latestHistory['value']).change();
			trackHistory();
		}
		ev.preventDefault();
		return false;
	})

	$('body').on('keydown', function(ev){
    if(ev.which == 90 && ev.ctrlKey){
      ev.preventDefault();
      return false;
    }
	})

	// HACK操作区的规则生成
	var generateRuleFromHack = function(needName){
		var editor = $('#editor').get(0);
		var $regex = $('#regex');
		var $flag = $('#flag');
		var $function = $('#function');
		var ruTemp = {
			'name': '',
			're': $regex.val(),
			'flag': $flag.val() || '',
			'f': new Function('a', 'b', 'c', 'd', 'e', 'f', 'g', $function.val()),
			'group': 'userDefined'
		}
		if(needName && ruTemp['name'] == ''){
			ruTemp['name'] = window.prompt('请给这个功能起个名字。') || '自定义hack';
		}
		return ruTemp;
	}

	//开始 Hack 按钮的动作
	$('#executeHack').on('click', function(){
		var editor = $('#editor').get(0);
		var ruTemp = generateRuleFromHack(false);
		replaceSelectedText(editor, ruTemp);
		trackHistory(editor.value, '执行Hack操作');
	})

	//点击Hack区域中的【+自定义按钮】时的动作
	$('#addToUserButtonFromHack').on('click', function(){
		var ruTemp = generateRuleFromHack(true);
		var randomId = ('' + Math.random()).replace('.', '');
		rules[randomId] = ruTemp;
		renderGroupButtons(rules);
	})

	//点击Hack区域中的【+用户策略】时的动作
	$('#addToUserPlanFromHack').on('click', function(){
		var ruTemp = generateRuleFromHack(true);
		userPlan.push(ruTemp);
		renderUserPlan();
	})

	//点击RESET cleaner之后的动作
	$('#reset').on('click', function(){
		localStorage.clear();
		rules = null;
		groups = null;
		automaticSelectOnPaste = null;
		textareaHistory = null;
		useUserPlanOnPaste = null;
		userPlan = null;
		window.location.reload();
	})

})
