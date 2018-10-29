var ChineseTokenizer =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

const {readFileSync} = __webpack_require__(1)
const Cedict = __webpack_require__(2)

exports.loadFile = function(cedictPath, ccedictPath, cedict_readingsPath) {
    return exports.load([readFileSync(cedictPath, 'utf-8'), readFileSync(ccedictPath, 'utf-8')], [readFileSync(cedict_readingsPath, 'utf-8'), readFileSync(ccedictPath, 'utf-8')])
}

exports.load = function(contents, canto_readings) {
    let dictionary = new Cedict()
    dictionary.load(contents.join('\n'), canto_readings.join('\n'))

    return function tokenize(text) {
        let result = []
        let singles = []
        let i = 0

        let pushSingleCharacter = text => {
            let entries = dictionary.get(text)

            singles.push({
                traditional: entries[0] ? entries[0].traditional : text,
                simplified: entries[0] ? entries[0].simplified : text,

                matches: entries.map(({jyutping, pinyin, pinyinPretty, english}) => {
                    return {
                        jyutping,
                        pinyin,
                        pinyinPretty,
                        english
                    }
                }).sort(function(a, b) {
                    // Prioritize entries that have a Cantonese reading
                    return Number(!!b.jyutping) - Number(!!a.jyutping);
                })
            })
        }

        let pushToken = text => {
            let entries = dictionary.get(text)

            result.push({
                traditional: entries[0] ? entries[0].traditional : text,
                simplified: entries[0] ? entries[0].simplified : text,

                matches: entries.map(({jyutping, pinyin, pinyinPretty, english}) => {
                    return {
                        jyutping,
                        pinyin,
                        pinyinPretty,
                        english
                    }
                }).sort(function(a, b) {
                    // Prioritize entries that have a Cantonese reading
                    return Number(!!b.jyutping) - Number(!!a.jyutping);
                })
            })
        }

        while (i < text.length) {
            // First match two or more characters
            if (i !== text.length - 1) {
                let getTwo = text.substr(i, 2)
                let entries = dictionary.getPrefix(getTwo)
                let found = false
                let foundWord = null

                entries.sort((x, y) => y.traditional.length - x.traditional.length)

                for (let entry of entries) {
                    let word = text.substr(i, entry.traditional.length)

                    if (![entry.traditional, entry.simplified].includes(word))
                        continue

                    pushToken(word)
                    found = true
                    foundWord = word

                    break
                }

                if (found) {
                    //Also push the single characters within the word to the singles list
                    for (let char of foundWord) {
                        pushSingleCharacter(char)
                    }

                    i += foundWord.length
                    continue
                }
            }

            // If all fails, match one character

            let character = text[i]
            pushToken(character)

            i++
        }

        return { result, singles }
    }
}


/***/ }),
/* 1 */
/***/ (function(module, exports) {



/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

const {prettify} = __webpack_require__(3)

function parseLine(line, cantonese_readings) {
    let match = line.match(/^(\S+)\s(\S+)\s\[([^\]]+)\]\s(\{(?:.+)\}\s)?\/(.+)\//)
    if (match == null) return

    let [, traditional, simplified, pinyin, english] = match

    pinyin = pinyin.replace(/u:/g, 'ü')
    let pinyinPretty = prettify(pinyin)
    let jyutping = cantonese_readings.get(traditional)
    return {traditional, simplified, pinyin, pinyinPretty, jyutping, english}
    
}

class Trie {
    constructor() {
        this.content = {}
    }

    getKeyObject(key, create = false) {
        key = key.toString()

        let chars = key === '' ? [key] : key.split('')
        let obj = this.content

        for (let char of chars) {
            if (obj[char] == null) {
                if (create) obj[char] = {}
                else return {}
            }

            obj = obj[char]
        }

        return obj
    }

    get(key) {
        let obj = this.getKeyObject(key)

        return obj.values || []
    }

    getPrefix(key) {
        let _getPrefix = (key, obj = null) => {
            if (obj == null) obj = this.getKeyObject(key)
            let result = obj.values ? [...obj.values] : []

            for (let char in obj) {
                if (char === 'values' || obj[char] == null) continue

                result.push(..._getPrefix(key + char, obj[char]))
            }

            return result
        }

        return _getPrefix(key)
    }

    push(key, value) {
        let obj = this.getKeyObject(key, true)

        if (obj.values == null) obj.values = []
        if (!obj.values.includes(value)) obj.values.push(value)

        return this
    }
}

class Cedict {
    load(contents, canto_readings) {
        this.trie = new Trie()
        
        let canto_map = new Map()
        let lines = contents.split('\n')
        
        // Populate the map of the Cantonese readings
        if (canto_readings) {
            let canto_lines = canto_readings.split('\n')
            
            for (let line of canto_lines) {
                if (line.trim() === '' || line[0] === '#') continue
                let canto_entry = line.match(/^(\S+)\s(\S+)\s\[([^\]]+)\]\s\{(.+)\}/)
                if (canto_entry != null) {
                    let [, traditional, simplified, pinyin, jyutping] = canto_entry
                    canto_map.set(traditional, jyutping)
                    canto_map.set(simplified, jyutping)
                }
            }
        }

        for (let line of lines) {
            if (line.trim() === '' || line[0] === '#') continue

            let entry = parseLine(line, canto_map)
            if (entry == null) continue

            this.trie.push(entry.simplified, entry)
            this.trie.push(entry.traditional, entry)
        }
    }

    get(word) {
        return this.trie.get(word)
    }

    getPrefix(word) {
        return this.trie.getPrefix(word)
    }
}

module.exports = Cedict


/***/ }),
/* 3 */
/***/ (function(module, exports) {

// Quick guide for typing Chinese pinyin on Mac OS X

// Tone 1 (flat) mā – Option + a, then hit a vowel key
// Tone 2 (rising) má – Option + e, then hit a vowel key
// Tone 3 (falling-rising) mǎ – Option + v, then hit a vowel key
// Tone 4 (falling) mà – Option + `, then hit a vowel key

// ǚ – Option + V, then hit V (submitted by QA)
// ǜ – Option + `, then hit V (submitted by QA)


var replacements = {
  'a': ['ā', 'á', 'ǎ', 'à'],
  'e': ['ē', 'é', 'ě', 'è'],
  'u': ['ū', 'ú', 'ǔ', 'ù'],
  'i': ['ī', 'í', 'ǐ', 'ì'],
  'o': ['ō', 'ó', 'ǒ', 'ò'],
  'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ']
};

var medials = ['i', 'u', 'ü'];

var prettify = function(str){
  str = str.replace('v', 'ü');
  var syllables = str.split(' ');

  for (var i = 0; i < syllables.length; i++){
    var syllable = syllables[i];
    var tone = parseInt(syllable[syllable.length-1]);
    
    if (tone <= 0 || tone > 5) {
      console.error('invalid tone number:', tone, 'in', syllable);
    } else if (tone === 5){
      syllables[i] = syllable.slice(0, syllable.length - 1);
    } else {
      for (var j = 0; j < syllable.length; j++){
        var currentLetter = syllable[j];
        var nextLetter = syllable[j + 1];

        // found a vowel
        if (replacements[currentLetter]){
          var replaced;
          var letterToReplace;

          // two consecutive vowels
          if (replacements[nextLetter] && medials.indexOf(currentLetter) >= 0){
            letterToReplace = nextLetter;
          } else {
            letterToReplace = currentLetter;
          }

          replaced = syllable.replace(letterToReplace, replacements[letterToReplace][tone - 1]);
          syllables[i] = replaced.slice(0, replaced.length - 1);
          break;
        }
      }  
    }

  }
  return syllables.join(' ');
};

module.exports.prettify = prettify;




/***/ })
/******/ ]);