# uber-mobile-tests

A singular test framework that merged both https://github.com/appcelerator/titanium-mobile-mocha-suite and https://github.com/appcelerator/appium-tests.

# Requirements

1. Minimum node version 4.X.
2. Minimum NPM version 3.X.
3. GA Appc CLI Core should be installed on your machine and logged in.
  **Note:** Appc CLI NPM is a node dependency for this framework.
4. Genymotion emulator installed; the Appium Tests depend on it.

# Setup

1. Run `npm install`.
2. Install `appium-doctor`: `[sudo] npm install -g appium-doctor`.
3. Run `appium-doctor` and fix any issues that may come up.

# How To

## Flags

## Unit Tests

## Appium Tests

# Notes on Structure

- `test.js` will contain the main loop.
  - Using commander, it should provide the following options:
    - -b, --branch [branchName] -> Install a specific branch of the SDK to test with; defaults to `master`
    - -p, --platforms <platform1,platform2> -> Run unit tests and appium tests on the given platforms; defaults to both `andrdoid` and `ios`
  - at a high-level, the main loop should do the following:

    1. In parallel, install new sdk and delete old test app.
    2. Record the SDK we just installed so we retain it when we clean up at end.
    3. Create a titanium project.
    4. Copy assets from `lib/unit_test/app` into the titanium project.

      a. Populate `lib/unit_test/templates/app.ejs` with the test suites from `./unit_tests`.

      b. Render `lib/unit_test/templates/app.ejs` into the titanium project.

    5. Add required properties for our unit tests.
    6. Run unit test builds for each platform, and spit out JUnit report.
    7. Remove all CI SDKs installed.
    8. Follow `appium-tests` main loop:

	  1. `_runAppium()` - launches the local Appium server.
	  2. `_buildTestApps()` - build all the test apps using the active sdk.
	  3. `_createTests()` - create a data structure from `_transform()` and loop through the data structure. While looping:

	    1. `_launchGeny()` - if the test app needs to be tested on an Android platform, launch the designated Genymotion emulator first. iOS simulators will be launched in the next step by Appium.
	    2. `_startClient()` - after the simulator/genymotion is launched, install the test app to the device and connect to the Appium local server.
	    3. `new Mocha().addFile().run()` - run the associated mocha test suite.
	    4. `_stopClient()` - after a mocha test suite is finished running, disconnect the mobile device from the Appium local server. Depending on the `desiredCapabilities`, iOS simulators can be left running or killed.
	    5. `_quitGeny()` - if a Genymotion emulator is launched, gracefully kill the process.

	  4. `_killAppium()` - after all the test suites are executed, kill the Appium local server.