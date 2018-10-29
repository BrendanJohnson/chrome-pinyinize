document.addEventListener("DOMContentLoaded", function(event) { 
	  chrome.storage.sync.get({
	    includeLinkText: true,
	    annotationType: "pinyin"
	  }, function(items) {
	    document.getElementById('includelinktext_inp').checked = items.includeLinkText;
	    document.getElementById('furigana_display').value = items.annotationType;
	  });
});

document.getElementById('save').addEventListener('click', function() {
  chrome.storage.sync.set({
    includeLinkText: document.querySelector('#includelinktext_inp').checked,
    annotationType: document.querySelector('#furigana_display').value
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    chrome.runtime.sendMessage({message: "config_updated"});
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
});