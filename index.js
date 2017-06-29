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
            var configure = {}
            
            if ( data ) {
                configure = JSON.parse(data);
            }

            if ( callback ) {
                callback(configure);
            }
        });
    },

    'getCompileInfo': function() {
        return JSON.stringify(configure);
    }
};


function compileResource(env, resource) {
    advplc.loadConfigure(function(configure) {
        advplc.compileFile(path.resolve(resource), function(result) {
            for ( let i = 0; i < result.msgs.length; i++ ) {
                let msg = result.msgs[i];
                console.log(msg);
            }
        });
    });
}


function runWizard(parameters) {
    advplc.loadConfigure(function(configure) {

        if ( parameters.cfg ) {
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

            wizard.execute().then(function(quiz){
                Object.assign(configure, quiz);
            });
        }

        if ( parameters.add ) {
            let environment = {}

            var wizard1 = prompt_wizard.create([
                {
                    'prompt': 'environment name',
                    'key': 'environment',
                    'default': 'environment'
                }
            ]);

            wizard1.execute().then(function(quiz){
                let update = false;

                // first environment register
                if ( ! configure.environments ) {
                    configure.environments = [];
                }

                // search existent environment and load configuration
                for ( let i = 0; i < configure.environments.length; i++ ) {
                    let envcfg = configure.environments[i];
                    if ( envcfg.environment.toLowerCase() == quiz.environment ) {
                        environment = envcfg;
                        update = true;
                        break;
                    }
                }

                // if environment doesn't exists create new
                if ( ! environment.environment ) {
                    Object.assign(environment, quiz);
                }

                var wizard2 = prompt_wizard.create([
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

                wizard2.execute().then(function(quiz){
                    advplc.cipherPassword(quiz.passwordCipher, function(cipher){
                        quiz.passwordCipher = cipher;
                        if ( ! update ) {
                            configure.environments.push(quiz);
                        }
                    });
                });
            });
        }
    });
}


program
    .arguments('<resource>')
    .option('-e, --env <env>', 'environment from .advplc to compile')
    .option('--cfg', 'configure .advplc generic options')
    .option('--add', 'add .advplc environment options')
    .action(function(resource) {

        // check if compile or if configure
        if ( program.cfg || program.add ) {
            runWizard(program);

        // compile
        } else {
            if ( program.env ) {
                compileResource(program.env, resource);
            } else {
                console.log('point .advplc environment to use')
            }
        }
    })
    .parse(process.argv)