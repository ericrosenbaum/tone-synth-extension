$.getScript('http://cdn.tonejs.org/latest/Tone.min.js', function()
{
	(function(ext) {
	
		var tone = new Tone();
		
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
		
		var targetFreq = osc.frequency.value;

		// Cleanup function when the extension is unloaded
		ext._shutdown = function() {};

		// Status reporting code
		// Use this to report missing hardware, plugin or unsupported browser
		ext._getStatus = function() {
			return {status: 2, msg: 'Ready'};
		};

		ext.oscOn = function() {
			osc.frequency.value = targetFreq;
			osc.triggerAttack();
		};
		
		ext.oscOff = function() {
			osc.triggerRelease();
		};
		
		ext.oscSetFreq = function(freq) {
			targetFreq = freq;
			osc.setNote(targetFreq);
		};

		ext.oscChangeFreqBy = function(freq) {
			targetFreq += freq;
			osc.setNote(targetFreq);
		};
		
		ext.getFreq = function() {
			return targetFreq;
		};
		
		ext.freqForNote = function(noteNum) {
			return tone.toFrequency(tone.midiToNote(noteNum + 12));
		};

		// Block and block menu descriptions
		var descriptor = {
			blocks: [
				// Block type, block name, function name
				[' ', 'oscillator on', 'oscOn'],
				[' ', 'oscillator off', 'oscOff'],
				[' ', 'set oscillator frequency %nHz', 'oscSetFreq', 440],
				[' ', 'change oscillator frequency by %nHz', 'oscChangeFreqBy', 20],
				['r', 'oscillator frequency', 'getFreq'],
				['r', 'frequency of note %n', 'freqForNote'],
			]
		};

		// Register the extension
		ScratchExtensions.register('Tone Synth extension', descriptor, ext);
	})({});
});
