var blockList = "var outSideBlockList = [";

function loop() {
	var blockScript = document.createElement('script');
	blockScript.type = 'text/javascript';
	blockScript.text = 'window.gmgetsetting=\'' + window.gmgetsetting + '\';';
	document.body.appendChild(blockScript);

	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = safari.extension.baseURI + 'Scripts/automute.js';
	document.body.appendChild(script);

	console.log('Add script');
}

function performMessage(event) {
	if (event.name == "mutekeyword") {
		
		window.gmgetsetting = event.message;
		window.setTimeout(loop, 2000);
	}
}

function dataMonitor() {
	var v = document.getElementById('proxy_for_data');
	if (v) {
		if (v.innerText && v.innerText.length > 0) {
			var text = v.innerText;
			v.innerText = '';
			console.log('Set to global setting.');
			safari.self.tab.dispatchMessage('update', text);
		}
	}
	window.setTimeout(dataMonitor, 1000);
}

if (window.top === window) {
	console.log('PlurkHelper');

	safari.self.addEventListener("message", performMessage, false);
	safari.self.tab.dispatchMessage("fetch", 1);

	var span = document.createElement('span');
	span.id = 'proxy_for_data';
	span.style.display = 'none';
	document.body.appendChild(span);

	window.setTimeout(dataMonitor, 1000);
}