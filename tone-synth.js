(function(ext) {

	if (typeof Tone !== 'undefined') {
		console.log('Tone library is already loaded');
		startSynth();
	} else {
		$.getScript('http://ericrosenbaum.github.io/tone-synth-extension/Tone.min.js', startSynth);
	}

	function startSynth() {
		var tone = new Tone();
		
		// synth is a single oscillator

		var synthOptions = {
			oscillator: {
				type: "triangle"
			},
			envelope: {
				attack: 0.03,
				decay: 0,
				sustain: 1,
				release: 0.03
			},
		};			
		
		var synth = new Tone.SimpleSynth(synthOptions);

		synth.portamento = 0;

		// effects chain

		var autoWah = new Tone.AutoWah();
		autoWah.wet.value = 0;
		autoWah.sensitivity.value = -40;

		var delay = new Tone.FeedbackDelay(0.25, 0.5);
		delay.wet.value = 0;
		
		var panner = new Tone.Panner(0.5);
		
		synth.connect(autoWah);
		autoWah.connect(delay);
		delay.connect(panner);
		panner.toMaster();

		// target frequency is used for the reporter, since
		// the actual frequency may ramp, portamento etc.

		var targetFreq = synth.frequency.value;

		var scaleRoot = 48; // root is note C2
		var minNote = 24;
		var maxNote = 100;
		
		// polysynth
		// var polySynth = new Tone.PolySynth(6, Tone.MonoSynth).toMaster();

		/*
		// timers for time interval hats 
		var intervalNames = ['bar', 'two bars', 'four bars', 'eight bars'];
		var intervalNotation = ['1m', '2m', '4m', '8m'];
		var intervalFlags = [];
		for (var i = 0; i < intervalNames.length; i++) {
			intervalFlags[i] = false;
			Tone.Transport.setInterval(function(i, time){
				intervalFlags[i] = true;
			}.bind(undefined, i), intervalNotation[i]);
		}
		Tone.Transport.start();
		Tone.Transport.loop = true;
		*/

		// Cleanup function when the extension is unloaded
		ext._shutdown = function() {
			stopAllSounds();
		};

		// Status reporting code
		// Use this to report missing hardware, plugin or unsupported browser
		ext._getStatus = function() {
			if (typeof AudioContext !== "undefined") {
				return {status: 2, msg: 'Ready'};
			} else {
				return {status: 1, msg: 'Browser not supported'};
			}
		};

		function stopAllSounds() {
			synth.triggerRelease();	
		}

		/// turn synth on and off

		ext.synthOnFor = function(secs) {
			synth.triggerAttackRelease(targetFreq, secs);
		};
		
		ext.synthOnForAndWait = function(secs, callback) {
			synth.triggerAttackRelease(targetFreq, secs);
			window.setTimeout(function() {
	            callback();
	        }, secs*1000);
		};

		ext.synthOn = function() {
			synth.triggerAttack(targetFreq);
		};

		ext.synthOff = function() {
			synth.triggerRelease();
		};

		// synth note control

		ext.synthSetFreq = function(control, val) {
			switch (control) {
				case 'note':
					var note = clamp(val, minNote, maxNote);
					targetFreq = midiToFrequency(note);
					synth.setNote(targetFreq);
					break;
				case 'major scale note':
					var note = majorScaleToMidi(val);
					note = clamp(note, minNote, maxNote);
					targetFreq = midiToFrequency(note);
					synth.setNote(targetFreq);					
					break;
				case 'frequency':
					targetFreq = val;
					synth.setNote(targetFreq);
					break;
			}
		};

		ext.synthChangeFreq = function(control, val) {
			switch (control) {									
				case 'note':
					var ratio = tone.intervalToFrequencyRatio(val);
					targetFreq *= ratio;
					synth.setNote(targetFreq);
					break;
				case 'major scale note':
					var currentNoteName = tone.frequencyToNote(targetFreq);
					var currentMidiNote = tone.noteToMidi(noteName);
					// this requires more work!
					// need to find current nearest major scale degree and octave
					// then modify and convert back to midi then to freq

					break;
				case 'frequency':
					targetFreq += val;
					synth.setNote(targetFreq);
					break;
			}
		};

		ext.synthGetFreq = function(control) {
			switch (control) {
				case 'note':
					var noteName = tone.frequencyToNote(targetFreq);
					var midiNote = tone.noteToMidi(noteName);
					return (midiNote);
					break;
				case 'major scale note':
					// needs work!
					break;
				case 'frequency':
					return targetFreq;
					break;
			}
		};

		function midiToFrequency(noteNum) {
			return tone.toFrequency(tone.midiToNote(noteNum));
		};

		function majorScaleToMidi(note) {
			var majorScale = [0,2,4,5,7,9,11,12];
			note = round(note);
			var scaleDegree = note % majorScale.length;
			var octave = floor(note / majorScale.length);
			var midiNote = scaleRoot + octave * 12 + majorScale[scaleDegree];
			return (midiNote);
		};

		// effects

		ext.setEffect = function(effectName, amt) {
			amt = clamp(amt, 0, 100);
			amt /= 100;

			switch (effectName) {
				case 'echo': 
					delay.wet.value = amt/2;
					break;
				case 'wah': 
					if (amt == 0) {
						autoWah.wet.value = 0;
					} else {
						autoWah.wet.value = 1;
					}
					autoWah.Q.value = amt * 6;
					break;
				case 'pan left/right': 
					panner.pan.value = amt;
					break;
				case 'glide':
					synth.portamento = amt * 0.25; 
					break;
				case 'volume':
					var db = tone.gainToDb(amt);
					Tone.Master.volume.rampTo(db, 0.01);
					break;
			}
		};

		ext.changeEffect = function(effectName, amt) {
			amt /= 100;

			switch (effectName) {
				case 'echo': 
					delay.wet.value += amt/2;
					delay.wet.value = clamp(delay.wet.value, 0, 0.5);
					break;
				case 'wah': 
					autoWah.Q.value += amt * 6;
					autoWah.Q.value = clamp(autoWah.Q.value, 0, 6);
					if (autoWah.Q.value == 0) {
						autoWah.wet.value = 0;
					} else {
						autoWah.wet.value = 1;
					}
					break;
				case 'pan left/right': 
					panner.pan.value += amt;
					panner.pan.value = clamp(panner.pan.value, 0, 1);
					break;
				case 'glide':
					synth.portamento += amt * 0.25; 
					break;
				case 'volume':
					var currentDb = Tone.Master.volume.value;
					var currentVol = tone.dbToGain(currentDb);
					var newVol = currentVol + amt; 
					newVol = clamp(newVol, 0, 1);
					var db = tone.gainToDb(newVol);
					Tone.Master.volume.rampTo(db, 0.01);
					break;
			}
		};

		ext.clearEffects = function() {
			delay.wet.value = 0;
			autoWah.Q.value = 0;
			autoWah.wet.value = 0;
			panner.pan.value = 0.5;
			synth.portamento = 0;
			Tone.Master.volume.rampTo(0, 0.01);
		};

		ext.setDelayTime = function(delayTime) {
			delay.delayTime.value = delayTime;
		};

		ext.setOscType = function(type) {
			synth.oscillator.type = type;
		};

		function clamp(input, min, max) {
			return Math.min(Math.max(input, min), max);
		};

		/*
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

		ext.scheduleNote = function(note, duration, delay) {
			var freq = getFreqForNote(note);
			// polySynth.triggerAttackRelease(freq, duration, '+' + delay);
			Tone.Transport.setTimeout(function(time){
			 	polySynth.triggerAttackRelease(freq, duration, time);
			}, delay);
		};
		*/

        ext._stop = function() {
			synth.triggerRelease();
        };

		// Block and block menu descriptions

		var descriptor = {
			blocks: [

				[' ', 'synth on for %n secs', 'synthOnFor', 0.5],
				['w', 'synth on for %n secs and wait', 'synthOnForAndWait', 0.5],
				[' ', 'synth on', 'synthOn'],
				[' ', 'synth off', 'synthOff'],

				[' ', 'synth set %m.freqControls %n', 'synthSetFreq', 'note', 60],
				[' ', 'synth change %m.freqControls by %n', 'synthChangeFreq', 'note', 1],
				['r', 'synth %m.freqControls', 'synthGetFreq', 'note'],

				[' ', 'set synth effect %m.effects to %n%', 'setEffect', 'echo', 100],
				[' ', 'change synth effect %m.effects by %n%', 'changeEffect', 'echo', 10],
				[' ', 'clear synth effects', 'clearEffects'],

				[' ', 'set echo delay time %n secs', 'setDelayTime', 0.5],

				[' ', 'synth oscillator type %m.oscTypes', 'setOscType', 'square']

			],
				menus: {
					effects: ['echo', 'wah', 'pan left/right', 'glide', 'volume'],
					oscTypes: ['sine', 'triangle', 'square', 'sawtooth', 'pwm'],
					freqControls: ['note', 'frequency']
				}
		};

		// Register the extension
		ScratchExtensions.register('Synth Extension', descriptor, ext);
	
	};

})({});
