var chineseTagger = null;
var furiganized = {};

//initialize variables
if (!localStorage) 
	console.log("Error: localStorage not available to background page. Has local storage been disabled in this instance of Chrome?");

if (localStorage.getItem("include_link_text") === null) {
	console.log("The localStorage \"include_link_text\" value was null. It will be initialised to true.");
	localStorage.setItem("include_link_text", true);	//the default value for including links
}
if (localStorage.getItem("furigana_display") === null) {
	console.log("The localStorage \"furigana_display\" value was null. It will be initialised to hiragana.");
	localStorage.setItem("furigana_display", "hira");	//the default value for including links
}
if (localStorage.getItem("show_translations") === null) {
	console.log("The localStorage \"show_translations\" value was null. It will be initialised to false.");
	localStorage.setItem("show_translations", true);	//the default value for showing translations
}
if (localStorage.getItem("filter_okurigana") === null) {
	console.log("The localStorage \"filter_okurigana\" value was null. It will be initialised to Yes.");
	localStorage.setItem("filter_okurigana", false);	//the default value for showing translations
}

// initialize chiense-tokenizer using fetch
let filesToLoad = ['resources/cedict_ts.u8', 'resources/cccanto-webdist.txt', 'resources/cccedict-canto-readings-150923.txt', ];

Promise.all(filesToLoad.map(function (fileName) {
	return fetch(chrome.runtime.getURL(fileName)).then((response) => response.text());
}))
.then(function(dictionaries) {
    chineseTagger = ChineseTokenizer.load([dictionaries[0], dictionaries[1]], [dictionaries[1], dictionaries[2]]);
});

/*****************
 *	Functions
 *****************/

function addRuby(furiganized, traditionalHanzi, simplifiedHanzi, pinyin, jyutping, toneMarks, key) {
	var annotation = jyutping;
	var rxp = new RegExp(sprintf('<ruby><rb>(.+(%s|%s)|((%s|%s).{1,9})|(.{1,9}(%s|%s).{1,9}))<\\/rb><rp>\\(<\\/rp><rt>(.+)<\\/rt><rp>\\)<\\/rp><\\/ruby>', traditionalHanzi, simplifiedHanzi, traditionalHanzi, simplifiedHanzi, traditionalHanzi, simplifiedHanzi), 'g');

	if (furiganized[key].match(rxp)) {
		furiganized[key] = furiganized[key].replace(new RegExp(sprintf('(%s)(?![^<rb><\/rb>]*<\/rb>)', traditionalHanzi + "|" + simplifiedHanzi), 'g'), sprintf('<ruby><rb>$1</rb><rp>(</rp><rt>%s</rt><rp>)</rp></ruby>', annotation));
	} else {
		bare_rxp = new RegExp(traditionalHanzi + "|" + simplifiedHanzi, 'g');
		furiganized[key] = furiganized[key].replace(bare_rxp, sprintf('<ruby><rb>$&</rb><rp>(</rp><rt>%s</rt><rp>)</rp></ruby>', annotation));
	}
}

function utf8_encode (string) {
	string = string.replace(/\r\n/g,"\n");
	var utftext = "";
	for (var n = 0; n < string.length; n++) {
		var c = string.charCodeAt(n);
		if (c < 128) {
			utftext += String.fromCharCode(c);
		} else if((c > 127) && (c < 2048)) {
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		} else {
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}
	}
	return utftext;
}

/*****************
 *	Chrome events
 *****************/

// Initialize the browser script on the page
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.executeScript(tab.id, {file: "text_to_furigana_dom_parse.js"});
});

// Listen to a change in the tab status
chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
  	chrome.browserAction.setIcon({path: {"48": "img/icon_inactive_48.png"}, tabId: tab.id});
  }
})

// Listen to other events
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponseCallback) {
		if (request.message == "config_values_request") {
			sendResponseCallback({userKanjiList: localStorage.getItem("user_kanji_list"), includeLinkText: localStorage.getItem("include_link_text")});
		} else if (request.message == 'text_to_pinyinize') {
			furiganized = {};
			for (key in request.textToFuriganize) {
				furiganized[key] = request.textToFuriganize[key];
				tagged = chineseTagger(request.textToFuriganize[key]);	

				var taggedSortedByHanziLength = tagged.result.sort(function (a,b) {
													aTraditionalLength = (a && a.traditional) ? a.traditional.length : 0;
													bTraditionalLength = (b && b.traditional) ? b.traditional.length : 0;
        											return ((aTraditionalLength < bTraditionalLength) ? -1 : (aTraditionalLength > bTraditionalLength) ? 1 : 0) * -1;
    											});

				taggedSortedByHanziLength.concat(tagged.singles).forEach(function (t) {
					// Add code to sort matches by those that have a Cantonese reading available

					if(t.matches && t.matches[0]) {

						pinyin = t.matches[0].pinyinPretty || null;
						jyutping = t.matches[0].jyutping || null;
						toneMarks = ((t.matches[0].pinyin || "").match(/[1-5]/g) || []).map(function (toneNumber) {
							return {
								1: "̱",
								2: "̗",
								3: "̬",
								4: "̖"
							}[toneNumber] || " ";
						}).join(" ");
						
						addRuby(furiganized, t.traditional, t.simplified, pinyin, jyutping, toneMarks, key);
					}
					
				});
			}
			chrome.tabs.sendMessage(sender.tab.id, {furiganizedTextNodes: furiganized});
		} else if (request.message == "show_page_processed") {
			// This runs whenever the plugin is activated
			chrome.browserAction.setIcon({path: {"48": "img/icon_active_48.png"}, tabId: sender.tab.id});
			chrome.browserAction.setTitle({title: "Remove Pinyin", tabId: sender.tab.id});
		} else if (request.message == "reset_page_action_icon") {
			// This runs whenever the plugin is turned off
			chrome.browserAction.setIcon({path: {"48": "img/icon_inactive_48.png"}, tabId: sender.tab.id});
			chrome.browserAction.setTitle({title: "Show Pinyin", tabId: sender.tab.id});
		}
	}
);
