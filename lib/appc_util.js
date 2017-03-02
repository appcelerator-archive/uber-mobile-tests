'use strict';

class AppcUtil {
	/**
		Install the specified SDK version and make it the default

		@param version {String} sdk version
		@param done {Function} callback function
	**/
	static installSDK(version, done) {

	}

	/**
		Look up the full path to the SDK we just installed (the SDK we'll be hacking
		to add our locally built Windows SDK into).

		@param done {Function} callback function
	**/
	static getSDKInstallDir(done) {

	}

	/**
		Runs `appc new` to generate a project for the specific platforms.

		@param platforms {Array} array of valid platform strings
		@param done {Function} callback function
	**/
	static generateProject(platforms, done) {

	}

	/**
		Runs `appc run`

		@param platform {String} a valid platorm
		@param done {Function} callback function
	**/
	static runBuild(platform, done) {

	}

	/**
		Remove all CI SDKs installed. Skip GA releases, and skip the passed in SDK path we just installed.

		@param sdkPath  {String}  The SDK we just installed for testing. Keep this one in case next run can use it.
		@param done {Function} callback function
	**/
	static cleanNonGaSDKs(sdkPath, done) {

	}
}
module.exports = AppcUtil;