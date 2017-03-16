'use strict';

const
	spawn = require('child_process').spawn,
	os = require('os'),
	path = require('path'),
	fs = require('fs-extra');

let appcExe = path.join(__dirname, '..', 'node_modules', '.bin', 'appc');
if (os.platform() === 'win32') {
	appcExe += '.cmd';
}

const
	NO_FLAGS = ['--no-banner', '--no-colors', '--no-prompt', '--no-services'],
	TYPE_BRANCH = 0,
	TYPE_URL_ZIP = 1;

class AppcUtil {
	/**
		Determine which titanium mobile SDK source to install from
		and return an object representing that selection.

		@param {String} branch - titanium mobile branch
		@param {String} sdkUrl - URL to titanium mobile SDK
		@param {String} sdkZip - path to titanium mobile SDK zip
		@return {Object} - {type: number, val: string}
	**/
	static getSDKSrc(branch, sdkUrl, sdkZip) {
		const sdkSrc = {
			type: TYPE_BRANCH,
			val: branch
		};
		if (sdkUrl || sdkZip) {
			sdkSrc.type = TYPE_URL_ZIP;
			sdkSrc.val = sdkUrl || sdkZip;
		}
		return sdkSrc;
	}

	/**
		Install the specified SDK version and make it the default.

		@param {Object} sdkSrc - branch/zip/url of SDK to install
		@param {Function} done - async callback
	**/
	static installSDK(sdkSrc, done) {
		let args = ['ti', 'sdk', 'install', '-d'];
		if (sdkSrc.type === TYPE_BRANCH) {
			args.push('-b');
		}
		args.push(sdkSrc.val);
		args = args.concat(NO_FLAGS);

		const appcCmd = this.spawnConvert(appcExe, args);

		console.log(`Installing SDK with args: ${args}`);
		const prc = spawn(appcCmd, args);
		prc.stdout.on('data', data => {
			console.log(data.toString().trim());
		});
		prc.on('exit', code => {
			if (code !== 0) {
				done('Failed to install SDK');
			} else {
				done();
			}
		});
	}

	/**
		Look up the full path to the SDK we just installed (the SDK we'll be hacking
		to add our locally built Windows SDK into).

		@param {Function} done - generic callback
	**/
	static getSDKInstallDir(done) {
		let args = [
			'ti', 'info',
			'-o', 'json',
			'-t', 'titanium'
		];
		args = args.concat(NO_FLAGS);

		const
			appcCmd = this.spawnConvert(appcExe, args),
			prc = spawn(appcCmd, args);

		let
			output = '',
			isErr = false;
		prc.stdout.on('data', data => {
			output += data.toString();
		});
		prc.on('error', err => {
			isErr = true;
			done(`Failed to get SDK install dir: ${err}`);
		});
		prc.on('exit', () => {
			if (isErr) return;

			const
				jsonOut = JSON.parse(output),
				selectedSDK = jsonOut.titaniumCLI.selectedSDK; // may be null!
			if (selectedSDK) {
				done(null, jsonOut.titanium[selectedSDK].path);
			} else {
				// Hope first sdk listed is the one we want
				done(null, jsonOut.titanium[Object.keys(jsonOut.titanium)[0]].path);
			}
		});
	}

	/**
		Runs 'appc new' to generate a titanium project for the specific platforms.

		@param {String} projName - project name
		@param {String} workspace - project workspace that the project will be created in
		@param {Array} platforms - array of valid platform strings
		@param {Function} done - async callback
	**/
	static generateProject(projName, workspace, platforms, done) {
		let args = [
			'new', '--force', '--classic',
			'--type', 'app',
			'--id', 'com.appcelerator.testApp.testing',
			'--url', 'http://www.appcelerator.com',
			'--platforms', platforms.join(','),
			'--name', projName,
			'--project-dir', path.join(workspace, projName) // yes, this is different from titanium cli and it's by design
		];
		args = args.concat(NO_FLAGS);

		const
			appcCmd = this.spawnConvert(appcExe, args),
			prc = spawn(appcCmd, args);

		prc.stdout.on('data', _handler);
		prc.stderr.on('data', _handler);
		prc.on('exit', code => {
			if (code !== 0) {
				done('Failed to create project');
			} else {
				done();
			}
		});

		function _handler(data) {
			console.log(data.toString().trim());
		}
	}

	/**
		Runs 'appc run' to launch the mobile app.

		@param {String} projDir - path to mobile app
		@param {String} platform - valid platform to run the mobile app against
		@param {Function} spawnHandler - the caller's function to handle the 'appc run' ChildProcess
		@param {Function} done - can either be a generic or a promise callback
	**/
	static runBuild(projDir, platform, spawnHandler, done) {
		const thisArgs = Array.from(arguments);
		if (platform === 'ios') {
			thisArgs.push('killSimu');
		}
		_coreBuild(thisArgs);
	}

	/**
		Runs 'appc run' to only build the mobile app.

		@param {String} projDir - path to mobile app
		@param {String} platform - valid platform to run the mobile app against
		@param {Function} spawnHandler - the caller's function to handle the 'appc run' ChildProcess
	**/
	static buildOnly(projDir, platform, spawnHandler) {
		const thisArgs = Array.from(arguments);
		thisArgs.push('buildOnly');
		_coreBuild(thisArgs);
	}

	/**
		Runs 'appc ti clean' to clean a titanium project

		@param {String} projDir - path to mobile app
		@param {String} platform - valid platform to run the mobile app against
		@param {Function} done - promise function
	**/
	static cleanProject(projDir, platform, done) {
		let args = [
			'ti', 'clean',
			'--project-dir', projDir,
			'--platforms', platform
		];
		args = args.concat(NO_FLAGS);

		const
			appcCmd = this.spawnConvert(appcExe, args),
			prc = spawn(appcCmd, args);

		prc.stdout.on('data', _handler);
		prc.stderr.on('data', _handler);
		prc.on('exit', () => {
			done();
		});

		function _handler(data) {
			console.log(data.toString().trim());
		}
	}

	/**
		Wrapper for running 'appc ti sdk list -o json'.
		The returned results (JSON object) will be passed to the done callback.

		@param {Function} done - promise function to call when task is complete
		@param {Function} bail - promise function to call when unexecpted error occurs
	**/
	static getSDKList(done, bail) {
		let args = ['ti', 'sdk', 'list', '-o', 'json'];
		args = args.concat(NO_FLAGS);

		const
			appcCmd = this.spawnConvert(appcExe, args),
			prc = spawn(appcCmd, args);

		let
			output = '',
			isErr = false;
		prc.stdout.on('data', data => {
			output += data.toString();
		});
		prc.on('error', err => {
			isErr = true;
			bail(`Failed to get list of SDKs: ${err}`);
		});
		prc.on('exit', () => {
			if (isErr) return;
			done(JSON.parse(output));
		});
	}

	/**
		Remove all CI SDKs installed. Skip GA releases, and skip the passed in SDK path we just installed.

		@param {String} sdkPath - The SDK we just installed for testing. Keep this one in case next run can use it.
		@param {Function} done - generic function
	**/
	static cleanNonGaSDKs(sdkPath, done) {
		new Promise((resolve, reject) => {
			this.getSDKList(resolve, reject);
		})
		.then(sdkList => {
			let p = Promise.resolve();
			const installedSdks = sdkList.installed;

			for (let sdkVer in installedSdks) {
				// skip GA releases
				if (sdkVer.slice(-2) === 'GA') {
					continue;
				}
				// skip SDK we just installed
				const thisSdkPath = installedSdks[sdkVer];
				if (thisSdkPath === sdkPath) {
					continue;
				}
				/* jshint -W083 */
				fs.remove(thisSdkPath, err => {
					// doesn't make sense to stop the entire flow if we can't remove a sdk
					if (err) console.log(`cleanNonGaSDKs: ${err.stack || err.toString()}`);
				});
			}

			done();
		})
		.catch(done);
	}

	/**
		Convert ChildProcess.spawn() arguments to be more cross-platform

		@param {String} cmd - the external program/process to call
		@param {Array} flags - the flags that will be passed to the external program/process
		@return {String} - returns the same program or cmd.exe
	**/
	static spawnConvert(cmd, flags) {
		switch (os.platform()) {
			case 'win32':
				flags.unshift('/c', cmd);
				return 'cmd.exe';

			default: // macOS
				return cmd;
		}
	}

	/**
		If the file or directory exist, delete it.

		@param {String} dir - path to the file or directory to be deleted
		@param {Function} done - can either be a generic or a promise callback
	**/
	static rm(dir, done) {
		if (fs.existsSync(dir)) {
			fs.removeSync(dir);
		}
		done();
	}
}
module.exports = AppcUtil;

/**
	An internal method, used by runBuild() and buildOnly(), to spawn a ChildProcss for 'appc run' command.

	@param {Array} lotsOfArgs - array of arguments passed from runBuild() or buildOnly()
**/
function _coreBuild(lotsOfArgs) {
	const
		projDir = lotsOfArgs[0],
		platform = lotsOfArgs[1],
		spawnHandler = lotsOfArgs[2];

	let
		done = null,
		extra = '';

	if (typeof lotsOfArgs[3] === 'string') {
		extra = lotsOfArgs[3];
	} else {
		done = lotsOfArgs[3];
		extra = lotsOfArgs[4];
	}

	let args = [
		'run',
		'--log-level', 'info',
		'--project-dir', projDir,
		'--platform', platform,
		'--target', (platform === 'android') ? 'emulator' : 'simulator'
	];
	switch (extra) {
		case 'killSimu':
			args.push('--hide-error-controller');
			spawn('killall', ['Simulator']);
		break;

		case 'buildOnly':
			args.push('--build-only');
		break;
	}
	args = args.concat(NO_FLAGS);

	const
		appcCmd = AppcUtil.spawnConvert(appcExe, args),
		prc = spawn(appcCmd, args);

	if (done) {
		spawnHandler(prc, done);
	} else {
		spawnHandler(prc);
	}
}