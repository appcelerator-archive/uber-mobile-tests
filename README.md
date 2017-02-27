# uber-mobile-tests (WIP)

The purpose of this repo is to combine https://github.com/appcelerator/titanium-mobile-mocha-suite and https://github.com/appcelerator/appium-tests into a singular test framework.

# TODO:
- `test.js` will contain the main loop.
  - Using commander, it should provide the following options:
    - -b, --branch [branchName] -> Install a specific branch of the SDK to test with; defaults to `master`
    - -p, --platforms <platform1,platform2> -> Run unit tests and appium tests on the given platforms; defaults to both `andrdoid` and `ios`
    - -s, --suites <suite1,suite2> -> Run specified suite; defaults to running all suites
      - **THIS PART IS NOT INTEGRATED YET**; pulled from https://github.com/appcelerator/appium-tests
      - Add this later when time permits.
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
    8. **TODO:** follow `appium-tests` main loop: [here](https://github.com/appcelerator/appium-tests/blob/master/README.md#main-loop), minus `buildTestApps()`; the unit_test app should be enough.

	  1. `runAppium()` - launches the local Appium server.
	  2. `buildTestApps()` - if `--use-sdk` flag is passed, then build all the test apps before moving onto the next task.

	    **TODO:**
		  - Use local titanium module to build project; build mobile project with titanium.
		  - Need to replace SDK with `ti sdk list -o json` activeSDK.
		  - Don't need to use ti sdk select since that will already be selected in the unit tests.
		  - **Need to decide to either use Appc CLI or Titanium CLI**.

	  3. `createTests()` - create a data structure from `--suites` and loop through the data structure. While looping:

	    **TODO:** For now, use `Help.transform(null)` to pass to `Help.createTests()`; this will run all the appium test suites.

	    1. `launchGeny()` - if the test app needs to be tested on an Android platform, launch the designated Genymotion emulator first. iOS simulators will be launched in the next step by Appium.
	    2. `startClient()` - after the simulator/genymotion is launched, install the test app to the device and connect to the Appium local server.
	    3. `new Mocha().addFile().run()` - run the associated mocha test suite.
	    4. `stopClient()` - after a mocha test suite is finished running, disconnect the mobile device from the Appium local server. Depending on the `desiredCapabilities`, iOS simulators can be left running or killed.
	    5. `quitGeny()` - if a Genymotion emulator is launched, gracefully kill the process.
	  4. `killAppium()` - after all the test suites are executed, kill the Appium local server.

	    **TODO:** Hmmm, need to watch out for this part.