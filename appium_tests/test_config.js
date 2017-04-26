'use strict';

module.exports = {
	// the appium server you want to talk to
	server: {
		host: 'localhost',
		port: 4723
	},

	// collection of tests from the tests/ directory
	// NOTE: as this grows, probably should put this in a proper database
	tests: {
		ios: {
			// valid appium properties from https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/caps.md
			desiredCapabilities: {
				automationName: 'XCUITest',
				noReset: true
			},
			'ti.ui.listview': {
				proj: 'ListView',
				testDevices: [
					// these are simulators
					{
						deviceName: 'iPhone 7 Plus',
						platformVersion: '10.2'
					}
				]
			}
		},

		android: {
			desiredCapabilities: {
				automationName: 'Appium',
				noReset: true
			},
			'ti.ui.listview': {
				proj: 'ListView',
				appPackage: 'com.appc.listview',
				appActivity: '.ListviewActivity',
				testDevices: [
					{
						deviceName: 'Custom Phone - 7.0.0 - API 24 - 768x1280',
						platformVersion: '7.0'
					}
				]
			}
		}
	}
};