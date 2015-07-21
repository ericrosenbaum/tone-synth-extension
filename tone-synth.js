$.getScript('http://cdn.tonejs.org/latest/Tone.min.js', function()
{
	(function(ext) {
	
		var synthOptions = {
			oscillator: {
				type: "square"
			},
			envelope: {
				attack: 0.03,
				decay: 0.1,
				sustain: 0.1,
				release: 0.03
			},
			portamento: 0.05
		};			
		var osc = new Tone.SimpleSynth(synthOptions).toMaster();

		// Cleanup function when the extension is unloaded
		ext._shutdown = function() {};

		// Status reporting code
		// Use this to report missing hardware, plugin or unsupported browser
		ext._getStatus = function() {
			return {status: 2, msg: 'Ready'};
		};

		ext.oscOn = function() {
			osc.triggerAttack();
		};
		
		ext.oscOff = function() {
			osc.triggerRelease();
		};
		
		ext.oscSetFreq = function(freq) {
			osc.setNote(freq);
		};

		ext.oscChangeFreqBy = function(freq) {
			osc.setNote(osc.frequency.value + freq);
		};

		// Block and block menu descriptions
		var descriptor = {
			blocks: [
				// Block type, block name, function name
				[' ', 'oscillator on', 'oscOn'],
				[' ', 'oscillator off', 'oscOff'],
				[' ', 'set oscillator frequency %nHz', 'oscSetFreq', 440],
				[' ', 'change oscillator frequency by %nHz', 'oscChangeFreqBy', 20],
			]
		};

		// Register the extension
		ScratchExtensions.register('Tone Synth extension', descriptor, ext);
	})({});
});
