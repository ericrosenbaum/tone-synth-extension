$.getScript('http://cdn.tonejs.org/latest/Tone.min.js', function()
{
	(function(ext) {
	
		var osc = new Tone.Oscillator(440, "sine").toMaster();
		osc.volume.value = -10;

		// Cleanup function when the extension is unloaded
		ext._shutdown = function() {};

		// Status reporting code
		// Use this to report missing hardware, plugin or unsupported browser
		ext._getStatus = function() {
			return {status: 2, msg: 'Ready'};
		};

		ext.oscOn = function() {
			osc.start();
		};
		ext.oscOff = function() {
			osc.stop();
		};

		// Block and block menu descriptions
		var descriptor = {
			blocks: [
				// Block type, block name, function name
				[' ', 'oscillator on', 'oscOn'],
				[' ', 'oscillator off', 'oscOff'],
			]
		};

		// Register the extension
		ScratchExtensions.register('Tone Synth extension', descriptor, ext);
	})({});
});
