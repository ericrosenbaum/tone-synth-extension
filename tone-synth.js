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
		
		var osc = new Tone.SimpleSynth(synthOptions);
		var lowPassFilt = new Tone.Filter(20000, "lowpass");
		lowPassFilt.Q = 10;
		osc.connect(lowPassFilt);
		lowPassFilt.toMaster();
		var targetFreq = osc.frequency.value;
		
		var intervalNames = ['eighth note', 'quarter note', 'half note', 'bar', 'two bars', 'four bars'];
		var intervalNotation = ['8n', '4n', '2n', '1m', '2m', '4m'];
		var intervalFlags = [];
		for (var i = 0; i < intervalNames.length; i++) {
			intervalFlags[i] = false;
			Tone.Transport.setInterval(function(i, time){
				intervalFlags[i] = true;
			}.bind(undefined, i), intervalNotation[i]);
		}
		Tone.Transport.start();

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
		
		ext.oscSetNote = function(note) {
			targetFreq = getFreqForNote(note);
			osc.setNote(targetFreq);
		};

		ext.oscChangeNoteBy = function(semitones) {
			var ratio = tone.intervalToFrequencyRatio(semitones);
			targetFreq *= ratio;
			osc.setNote(targetFreq);
		};

		ext.getFreq = function() {
			return targetFreq;
		};
		
		function getFreqForNote(noteNum) {
			return tone.toFrequency(tone.midiToNote(noteNum + 12));
		}
		
		ext.freqForNote = function(noteNum) {
			//return tone.toFrequency(tone.midiToNote(noteNum + 12));
			return getFreqForNote(noteNum);
		};
		
		ext.setLowPassFreq = function(freq) {
			lowPassFilt.frequency.value = freq;
		};

		ext.changeLowPassFreqBy = function(freq) {
			lowPassFilt.frequency.value += freq;
		};

		ext.intervalHat = function(interval) {
			for (var i = 0; i < intervalNames.length; i++) {
				if (interval == intervalNames[i]) {
					if (intervalFlags[i]) {
						intervalFlags[i] = false;
						return true;
					} else {
						return false;
					}
				}
			}
		};

		// Block and block menu descriptions
		var descriptor = {
			blocks: [
				// Block type, block name, function name
				[' ', 'oscillator on', 'oscOn'],
				[' ', 'oscillator off', 'oscOff'],
				[' ', 'set oscillator frequency %nHz', 'oscSetFreq', 440],
				[' ', 'change oscillator frequency by %nHz', 'oscChangeFreqBy', 20],
				[' ', 'set oscillator to note %n', 'oscSetNote', 60],
				[' ', 'change oscillator note by %n', 'oscChangeNoteBy', 2],
				['r', 'oscillator frequency', 'getFreq'],
				['r', 'frequency of note %n', 'freqForNote', 60],
				[' ', 'set lowpass filter frequency %nHz', 'setLowPassFreq', 200],
				[' ', 'change lowpass filter frequency by %nHz', 'changeLowPassFreqBy', 200],
				['h', 'every %m.intervals', 'intervalHat'],
			],
			menus: {
				intervals: intervalNames
			}
		};

		// Register the extension
		ScratchExtensions.register('Tone Synth extension', descriptor, ext);
	})({});
});
