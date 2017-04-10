module.exports = {
	"extends": "eslint:recommended",
	"env": {
		"es6": true,
		"node": true,
		"mocha": true
	},
	"globals": {
		"Ti": true,
		"Titanium": true
	},
	"rules": {
		"no-console": "off",
		"no-case-declarations": "off",
		"block-scoped-var" : "warn",
		"dot-notation": "error",
		"eqeqeq": "error",
		"no-eval": "error",
		"no-multi-spaces": "error",
		"no-empty-function": "error", // need to leave a comment why there are empty functions
		"space-in-parens": [
			"error",
			"never"
		],
		"object-curly-spacing": [
			"error",
			"never"
		],
		"keyword-spacing": [
			"error",
			{
				"before": true,
				"after": true
			}
		],
		"key-spacing": [
			"error",
			{
				"beforeColon": false,
				"afterColon": true,
				"mode": "strict"
			}
		],
		"func-call-spacing": [
			"error",
			"never"
		],
		"eol-last": [
			"error",
			"never"
		],
		"computed-property-spacing": [
			"error",
			"never"
		],
		"comma-dangle": [
			"error",
			"never"
		],
		"comma-spacing": [
			"error",
			{
				"before": false,
				"after": true
			}
		],
		"comma-style": [
			"error",
			"last"
		],
		"brace-style": [
			"error",
			"1tbs"
		],
		"array-bracket-spacing": [
			"error",
			"never"
		],
		"default-case": [
			"error",
			{ "commentPattern": "^NOTE:" } // need to leave a comment why there's no default case
		],
		"curly": [
			"error",
			"all"
		],
		"indent": [
			"error",
			"tab",
			{ "SwitchCase": 1 }
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"semi": [
			"error",
			"always"
		]
	}
}