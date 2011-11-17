function loop() {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = safari.extension.baseURI + 'Scripts/automute.js';
	document.body.appendChild(script);

	console.log('Inject script');
}

if (window.top === window) {
	console.log('PlurkHelper');
	window.setTimeout(loop, 500);
}