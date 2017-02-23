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
    1. In parallel, install new sdk and delete old test app: [here](./lib/unit_test/helper.js#L362-L371)
    2. Record the SDK we just installed so we retain it when we clean up at end: [here](./lib/unit_test/helper.js#L376)
    3. Create a titanium project: [here](./lib/unit_test/helper.js#L387)
    4. **TODO:** Copy assets from `lib/unit_test/app` into the titanium project: [here](./lib/unit_test/helper.js#L390)
      a. **TODO:** populate `lib/unit_test/app.ejs` with the unit tests from `./unit_tests`.
      b. **TODO:** copy `lib/unit_test/app.ejs` into the titanium project.
    5. Add required properties for our unit tests: [here](./lib/unit_test/helper.js#L391)
    6. Run unit test builds for each platform, and spit out JUnit report: [here](./lib/unit_test/helper.js#L394-L401)
    7. Remove all CI SDKs installed: [here](./lib/unit_test/helper.js#L407)
    8. **TODO:** follow `appium-tests` main loop: [here](https://github.com/appcelerator/appium-tests/blob/master/README.md#main-loop), minus `buildTestApps()`; the unit_test app should be enough.
      a. **TODO:** need to poupulate `appium_tests` folder with the this structure [here](https://github.com/appcelerator/appium-tests/tree/master/tests)
