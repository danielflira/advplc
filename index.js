#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var program = require('commander')
var child_process = require('child_process');
var prompt_wizard = require('prompt-wizard');

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

        args.push("--compileInfo=".concat(this.getCompileInfo()));
        args.push("--source=".concat(filename));

        child = child_process.spawn(bridge, args);

        child.stdout.on('data', function(data) {
            last_data += data;
        });

        child.on('exit', function() {
            if ( last_data ) {
                callback(JSON.parse(last_data));
            } else {
                console.log('ended with no response from bridge');
            }
        });
    },

    'loadConfigure': function (next) {
        fs.readFile('.advplc', function(err, data) {
            if ( data ) {
                configure = JSON.parse(data);
            }

            if ( err ) {
                console.log(err);
                return;
            }

            if ( next ) {
                next(configure);
            }
        });
    },

    'getCompileInfo': function() {
        return JSON.stringify(configure);
    }
};


function compileResource(parameters, configure, resource) {
    if ( ! parameters.env ) {
        console.log('you must inform environment to compile, see --env')
    }

    configure.selectedEnvironment = parameters.env;

    advplc.compileFile(path.resolve(resource), function(result) {
        for ( let i = 0; i < result.msgs.length; i++ ) {
            let msg = result.msgs[i];
            console.log(msg);
        }
    });
}


function wizardCfg(parameters, configure) {
    if ( ! parameters.cfg ) {
        return wizardAdd1(parameters, configure);
    }

    var wizard = prompt_wizard.create([
        {
            'prompt': 'authorization generation date',
            'key': 'authorization_generation',
            'default': configure.authorization_generation
        },
        {
            'prompt': 'authorization validation date',
            'key': 'authorization_validation',
            'default': configure.authorization_validation
        },
        {
            'prompt': 'authorization permission',
            'key': 'authorization_permission',
            'default': configure.authorization_permission
        },
        {
            'prompt': 'authorization code',
            'key': 'authorization_code',
            'default': configure.authorization_code
        },
        {
            'prompt': 'start program from smartclient',
            'key': 'startProgram',
            'default': configure.startProgram ? 
                configure.startProgram :
                "sigaadv"
        },
        {
            'prompt': 'compile files regex',
            'key': 'compileFolderRegex',
            'default': configure.compileFolderRegex ? 
                configure.compileFolderRegex : 
                '.*\\.(prw|prx|apw|aph|tres|png|bmp|tres)'
        }
    ]);

    wizard.execute().then(function wizardCfgQuiz(quiz) {
        Object.assign(configure, quiz);
        return wizardAdd1(parameters, configure);
    });
}


function wizardAdd1(parameters, configure) {
    if ( ! parameters.add ) {
        return saveConfigure(configure);
    }

    var wizard = prompt_wizard.create([
        {
            'prompt': 'environment name',
            'key': 'environment',
            'default': 'environment'
        }
    ]);

    wizard.execute().then(function wizardAdd1Quiz(quiz) {
        let environment = {};
        let add = true;

        if ( ! configure.environments ) {
            configure.environments = [];
        }

        for ( let i = 0; i < configure.environments.length; i++ ) {
            let cfgenv = configure.environments[i];
            if ( cfgenv.environment.toLowerCase() == quiz.environment ) {
                environment = cfgenv;
                add = false;
                break;
            }
        }

        if ( add ) {
            environment = quiz;
            configure.environments.push(environment);
        }

        return wizardAdd2(parameters, configure, environment);
    });
}


function wizardAdd2(parameters, configure, environment) {
    var actualPassword = environment.passwordCipher;

    var wizard = prompt_wizard.create([
        {
            'prompt': 'server binary version',
            'key': 'serverVersion',
            'default': environment.serverVersion ? 
                environment.serverVersion : 
                '131227A'
        },
        {
            'prompt': 'server address',
            'key': 'server',
            'default': environment.server ? 
                environment.server : 
                'localhost'
        },
        {
            'prompt': 'server port',
            'key': 'port',
            'default': environment.port ? 
                environment.port : 
                '5555'
        },
        {
            'prompt': 'environment language',
            'key': 'language',
            'default': environment.language ? 
                environment.language : 
                'PORTUGUESE'
        },
        {
            'prompt': 'object repository type',
            'key': 'rpoType',
            'default': environment.rpoType ? 
                environment.rpoType : 
                'TOP'
        },
        {
            'prompt': 'environment user',
            'key': 'user',
            'default': environment.user ? 
                environment.user : 
                'admin'
        },
        {
            'prompt': 'environment password',
            'key': 'passwordCipher',
            'default': environment.passwordCipher ? 
                environment.passwordCipher : 
                ''
        },
        {
            'prompt': 'environment default start program',
            'key': 'startProgram',
            'default': environment.startProgram ? 
                environment.startProgram : 
                'sigaadv'
        },
        {
            'prompt': 'smartclient path',
            'key': 'smartClientPath',
            'default': environment.smartClientPath ? 
                environment.smartClientPath : 
                'C:\\TOTVS\\Protheus\\bin\\smartclient\\'
        },
        {
            'prompt': 'include list',
            'key': 'includeList',
            'default': environment.includeList ? 
                environment.includeList : 
                'C:\\caminho1\\include\\;C:\\caminho2\\include\\'
        },
    ]);

    wizard.execute().then(function wizardAdd2Quiz(quiz) {
        Object.assign(environment, quiz);

        // password has changed
        if ( quiz.passwordCipher !== actualPassword ) {
            advplc.cipherPassword(quiz.passwordCipher, function(password) {
                quiz.passwordCipher = password;
                saveConfigure(configure);
            });
        }

        // just save file
        else {
            saveConfigure(configure);
        }
    });
}


function saveConfigure(configure) {
    fs.writeFile('.advplc', JSON.stringify(configure, null, '\t'),
            function(err) {
        if ( err ) {
            console.log(err);
        } else {
            console.log('configure changed successfully');
        }
    });
}


program
    .arguments('<resource>')
    .option('-e, --env <env>', 'environment from .advplc to compile')
    .option('--cfg', 'configure .advplc generic options')
    .option('--add', 'add .advplc environment options')
    .action(function(resource) {
        advplc.loadConfigure(function(configure) {
            if ( program.add ||program.cfg ) {
                wizardCfg(program, configure);
            } else {
                compileResource(program, configure, resource);
            }
        });
    })
    .parse(process.argv)