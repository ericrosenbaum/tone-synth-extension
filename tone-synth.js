$.getScript('http://cdn.tonejs.org/latest/Tone.min.js', function()
{
	(function(ext) {
	
		var tone = new Tone();
		
		// synth is a single oscillator

		var synthOptions = {
			oscillator: {
				type: "sine"
			},
			envelope: {
				attack: 0.03,
				decay: 0,
				sustain: 1,
				release: 0.03
			},
			portamento: 0
		};			
		
		var synth = new Tone.SimpleSynth(synthOptions);

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
		ext._shutdown = function() {};

		// Status reporting code
		// Use this to report missing hardware, plugin or unsupported browser
		ext._getStatus = function() {
			return {status: 2, msg: 'Ready'};
		};


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
		
		/// synth frequency control

		ext.synthSetFreq = function(freq) {
			targetFreq = freq;
			synth.setNote(targetFreq);
		};

		ext.synthChangeFreq = function(freq) {
			targetFreq += freq;
			synth.setNote(targetFreq);
		};

		ext.synthGetFreq = function() {
			return targetFreq;
		};

		// synth note control

		ext.synthSetNote = function(note) {
			note = clamp(note, 24, 127);
			targetFreq = MidiToFrequency(note);
			synth.setNote(targetFreq);
		};

		function MidiToFrequency(noteNum) {
			return tone.toFrequency(tone.midiToNote(noteNum));
		}

		ext.synthChangeNote = function(semitones) {
			var ratio = tone.intervalToFrequencyRatio(semitones);
			targetFreq *= ratio;
			synth.setNote(targetFreq);
		};

		ext.synthGetNote = function() {
			var noteName = tone.frequencyToNote(targetFreq);
			var midiNote = tone.noteToMidi(noteName);
			return (midiNote);
		};

		// synth volume
		
		ext.synthSetVolume = function(vol) {
			vol = clamp(vol, 0, 100);
			var db = tone.gainToDb(vol/100);
			Tone.Master.volume.rampTo(db, 0.01);
		};

		ext.synthChangeVolume = function(vol) {
			var currentDb = Tone.Master.volume.value;
			var currentVol = tone.dbToGain(currentDb)*100;
			vol += currentVol; 
			vol = clamp(vol, 0, 100);
			var db = tone.gainToDb(vol/100);
			Tone.Master.volume.rampTo(db, 0.01);
		};

		ext.synthGetVolume = function() {
			return (tone.dbToGain(Tone.Master.volume.value)*100);
		};

		// effects
		ext.setEffect = function(effectName, amt) {
			amt = clamp(amt, 0, 100);

			switch (effectName) {
				case 'echo': 
					delay.wet.value = (amt/2)/100;
					break;
				case 'wah': 
					if (amt == 0) {
						autoWah.wet.value = 0;
					} else {
						autoWah.wet.value = 1;
					}
					autoWah.Q.value = (amt / 100) * 6;
					break;
				case 'pan left/right': 
					panner.pan.value = amt/100;
					break;
			}
		};

		ext.changeEffect = function(effectName, amt) {
			switch (effectName) {
				case 'echo': 
					delay.wet.value += (amt/2)/100;
					delay.wet.value = clamp(delay.wet.value, 0, 0.5);
					break;
				case 'wah': 
					autoWah.Q.value += (amt / 100) * 6;
					autoWah.Q.value = clamp(autoWah.Q.value, 0, 6);
					if (autoWah.Q.value == 0) {
						autoWah.wet.value = 0;
					} else {
						autoWah.wet.value = 1;
					}
					break;
				case 'pan left/right': 
					panner.pan.value += amt/100;
					break;
			}
		};

		ext.clearEffects = function() {
			delay.wet.value = 0;
			autoWah.Q.value = 0;
			autoWah.wet.value = 0;
			panner.pan.value = 0.5;
		};

		ext.setDelayTime = function(delayTime) {
			delay.delayTime.value = delayTime;
		};

		ext.setOscType = function(type) {
			synth.oscillator.type = type;
		}

		function clamp(input, min, max) {
			return Math.min(Math.max(input, min), max);
		}

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

		// Block and block menu descriptions

		var descriptor = {
			blocks: [

				[' ', 'synth on for %n secs', 'synthOnFor', 0.5],
				['w', 'synth on for %n secs and wait', 'synthOnForAndWait', 0.5],
				[' ', 'synth on', 'synthOn'],
				[' ', 'synth off', 'synthOff'],

				[' ', 'set synth frequency %n Hz', 'synthSetFreq', 200],
				[' ', 'change synth frequency by %n Hz', 'synthChangeFreq', 50],
				['r', 'synth frequency', 'synthGetFreq'],

				[' ', 'set synth note %n', 'synthSetNote', 60],
				[' ', 'change synth note by %n', 'synthChangeNote', 1],
				['r', 'synth note', 'synthGetNote'],

				[' ', 'synth volume %n%', 'synthSetVolume', 50],
				[' ', 'synth change volume by %n%', 'synthChangeVolume', 10],
				['r', 'synth volume', 'synthGetVolume'],

				[' ', 'set synth effect %m.effects to %n%', 'setEffect', 'echo', 100],
				[' ', 'change synth effect %m.effects by %n%', 'changeEffect', 'echo', 10],
				[' ', 'clear synth effects', 'clearEffects'],
				[' ', 'set echo delay time %n secs', 'setDelayTime', 0.25],

				[' ', 'synth oscillator type %m.oscTypes', 'setOscType', 'sine']

			],
				menus: {
					effects: ['echo', 'wah', 'pan left/right'],
					oscTypes: ['sine', 'triangle', 'square', 'sawtooth', 'pwm']
				}
		};

		// Register the extension
		ScratchExtensions.register('Synth Extension', descriptor, ext);
	})({});
});
