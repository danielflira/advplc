#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var advplc = {

    'configure': null,

    'getBridgePath': function() {
        let modules = require.main.paths;
        let binary_path = path.join('advpl-vscode', 'bin');
        let module_path = "";

        for ( let i = 0; i < modules.length; i++ ) {
            module_path = path.join(modules[i], binary_path);
            try {
                fs.accessSync(module_path);
                break;
            } catch(err) {
                module_path = null;
            };
        }

        return module_path;
    },

    'getBridgeBin': function() {
        if ( process.platform == 'darwin' ) {
            return 'AdvplDebugBridgeMac';
        } else if ( process.platform == 'win32' ) {
            return 'AdvplDebugBridge.exe';
        } else {
            return '';
        }
    },

    'getBridge': function() {
        return path.join(this.getBridgePath(), this.getBridgeBin());
    },

    'cipherPassword': function(password, callback) {
        let args = [];
        let child = null;
        let last_data = '';

        args.push("--CipherPassword="+password);
        child = child_process.spawn(this.getBridge(), args);
        
        child.stdout.on('data', function(data) {
            last_data += data;
        });

        child.stdout.on('end', function() {
            callback(last_data);
        });
    },

    'compileFile': function(filename, callback) {
        let args = [];
        let child = null;
        let bridge = this.getBridge();
        var last_data = '';

        args.push("--compileInfo=" + this.getCompileInfo());
        args.push("--source=" + filename);

        child = child_process.spawn(bridge, args);

        child.stdout.on('data', function(data) {
            last_data +=  data;
        });

        child.on('exit', function() {
            callback(JSON.parse(last_data));
        });
    },

    'loadConfigure': function(callback) {
        fs.readFile('.advplc', function(err, data) {
            configure = JSON.parse(data);
            if ( callback ) {
                callback(configure);
            }
        });
    },

    'getCompileInfo': function() {
        return JSON.stringify(configure);
    }
};

advplc.loadConfigure(function(configure) {
    advplc.compileFile(path.resolve('asdf1.prw'), function(result) {
        for ( let i = 0; i < result.msgs.length; i++ ) {
            let msg = result.msgs[i];
            console.log(msg);
        }
    });
});