(function(ext) {
    // Cleanup function when the extension is unloaded
    ext._shutdown = function() {};

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function() {
        return {status: 2, msg: 'Ready'};
    };

    ext.test = function() {
        console.log('test block!');
    };

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            // Block type, block name, function name
            [' ', 'this block is a test', 'test'],
        ]
    };

    // Register the extension
    ScratchExtensions.register('Tone Synth extension', descriptor, ext);
})({});