var rules = {}; //用来盛放所有的替换规则
//注意添加规则的时候，除了在下面写了以ru开头的驼峰写法的规则之后，还要把规则添加到rules里面

//匹配规则汇总
var ruCombineBrokenLines = {
  'name': '断句段合并',
  're':  '(.+[^\\.?\\.”"!！。’\'])\\s*\\n', //匹配不是以这些符号结尾的断行
  'flag': 'g',
  'f': function(str, brokenLine){
    return brokenLine.trim() + ' ';
  },
  'group': 'lines',
  'title': '如果段尾不是由句号、问号、感叹号、引号等结尾，那么这一段就会被合并。'
}

var ruCombineAllLines = {
  'name': '合并所有段',
  're': '\\n',
  'flag': 'g',
  'f': ' ',
  'group': 'lines',
  'title': '将选中的所有段合并为一段。'
}

var ruAddEmptyLineBetweenLines = {
  'name': '段间空行',
  're': '\\n+',
  'flag': 'g',
  'f': '\n\n',
  'group': 'lines',
  'title': '在段落间空一个空行（段），如果原本段落间有多个空行，那么也统一整理为空一行。'
}

var ruDeleteEmptyLinesBetweenLines = {
  'name': '去掉段间空行',
  're': '\\n+',
  'flag': 'g',
  'f': '\n',
  'group': 'lines',
  'title': '去除段落间的空行，不论之前段间空了几行空行。'
}

var ruDeleteBrackets = {
  'name': '删除括号及其内容',
  're': '[\(（].*[\)）]',
  'flag': 'g',
  'f': '',
  'group': 'deletes',
  'title': '删除全角或半角括号以及里面的内容。及时里面没有内容，括号也会被删掉。'
}

var ruParagraphIndent = {
  'name': '段首缩进四格',
  're': '^\\s*(.+)\\s*$', //匹配行内容
  'flag': 'mg', //启用多行模式
  'f': function(line, realContent){
    return '    ' + realContent.trim();
  },
  'group': 'spaces',
  'title': '在每行行首添加四个空格作为缩进。'
}

var ruDeleteEmptySpacesBetweenAndAfterParagraphs = {
  'name': '去除段首段尾空格',
  're': '^\\s*(.+)\\s*$',
  'flag': 'mg',
  'f': function(line, realContent){
    return realContent.trim() || '';
  },
  'group': 'spaces',
  'title': '删除段首和段尾的空格'
}

var ruDeleteNumAfterLetters = {
  'name': '删除字母结尾后的数字',
  're': '([a-zA-Z]+)\\d+\\b',
  'flag': 'mg',
  'f': function(wordEndingWithNumber, word){
    return word;
  },
  'group': 'deletes',
  'title': '删除一个或多个字母后面紧跟的数字，例如Hello4中的4就会被删去。'
}

rules['ruCombineBrokenLines'] = ruCombineBrokenLines;
rules['ruParagraphIndent'] = ruParagraphIndent;
rules['ruDeleteNumAfterLetters'] = ruDeleteNumAfterLetters;
rules['ruCombineAllLines'] = ruCombineAllLines;
rules['ruAddEmptyLineBetweenLines'] = ruAddEmptyLineBetweenLines;
rules['ruDeleteEmptyLinesBetweenLines'] = ruDeleteEmptyLinesBetweenLines;
rules['ruDeleteEmptySpacesBetweenAndAfterParagraphs'] = ruDeleteEmptySpacesBetweenAndAfterParagraphs;
rules['ruDeleteBrackets'] = ruDeleteBrackets;

//groups的配置
var groups = {
  'lines': '段落处理',
  'spaces': '空格处理',
  'deletes': '删除处理',
  'userDefined': '用户自定义'
}

//用于保存用户策略
var userPlan = [];

//用于保存是否在粘贴时自动选中粘贴内容
var useUserPlanOnPaste = false;

//用于记录textarea文本修改的记录
var textareaHistory = [''];

//localStorage相关设置
var rules_in_store = localStorage.getItem('rules') ;
var groups_in_store = localStorage.getItem('groups');
var userPlan_in_store = localStorage.getItem('userPlan');
var useUserPlanOnPaste_in_store = localStorage.getItem('useUserPlanOnPaste');
var textareaHistory_in_store = localStorage.getItem('textareaHistory');

var strToBool = function(str){
  if (str == 'True' || str == 'true') {
    return true;
  } else if (str == 'False' || str == 'false') {
    return false;
  }
}

console.log(JSON.parse(rules_in_store));
console.log(JSON.parse(groups_in_store));
console.log(JSON.parse(userPlan_in_store));
console.log(JSON.parse(useUserPlanOnPaste_in_store));
console.log(JSON.parse(textareaHistory_in_store));

rules = rules_in_store ? JSON.parse(rules_in_store) : rules;
groups = groups_in_store ? JSON.parse(groups_in_store) : groups;
userPlan = userPlan_in_store ? JSON.parse(userPlan_in_store) : userPlan;
useUserPlanOnPaste = useUserPlanOnPaste_in_store ? strToBool(useUserPlanOnPaste_in_store) : useUserPlanOnPaste;
textareaHistory = textareaHistory_in_store ? JSON.parse(textareaHistory_in_store): textareaHistory;


console.log(rules);
console.log(groups);
console.log(userPlan);
console.log(useUserPlanOnPaste);
console.log(textareaHistory);
