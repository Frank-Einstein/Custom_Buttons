﻿// http://infocatcher.ucoz.net/js/cb/toggleFlash.js
// https://github.com/Infocatcher/Custom_Buttons/tree/master/Toggle_Flash

// Toggle Flash button for Custom Buttons
// (code for "initialization" section)

// (c) Infocatcher 2012-2013
// version 0.1.3.1 - 2013-02-16

var options = {
	pluginName: "Shockwave Flash", // Or name of any other plugin
	searchInTypes: ["plugin"], // Use "extension" to toggle restartless extensions
	// Button styles, possible values:
	// checked:       [true|false]
	// style:         "any valid CSS"
	// iconStyle:     "any valid CSS"
	// iconGrayscale: [true|false]
	// iconOpacity:   0..1
	styleEnabled: {
		checked: false,
		style: "",
		iconStyle: "",
		iconGrayscale: false,
		iconOpacity: 1,
	},
	styleClickToPlay: {
		checked: false,
		style: "",
		iconStyle: "",
		iconGrayscale: false,
		iconOpacity: 0.65
	},
	styleDisabled: {
		checked: false,
		style: "",
		iconStyle: "",
		iconGrayscale: true,
		iconOpacity: 0.65
	}
};

function _localize(s, key) {
	var strings = {
		"%N: %S": { // Example: "Some plugin: Enabled"
			ru: "%N: %S"
		},
		"Enabled": {
			ru: "Включено"
		},
		"Disabled": {
			ru: "Выключено"
		},
		"Ask to activate": {
			ru: "Включать по запросу"
		}
	};
	var locale = Application.prefs.getValue("general.useragent.locale", "en").match(/^[a-z]*/)[0];
	_localize = !locale || locale == "en"
		? function(s) {
			return s;
		}
		: function(s) {
			return strings[s] && strings[s][locale] || s;
		};
	return _localize.apply(this, arguments);
}

var _addon, _addonId;
this._pluginDisabled = undefined;
this.__defineGetter__("pluginDisabled", function() {
	return this._pluginDisabled;
});
this.__defineSetter__("pluginDisabled", function(dis) {
	if(this._pluginDisabled == dis)
		return;
	this._pluginDisabled = dis;

	var style;
	var state;
	if("STATE_ASK_TO_ACTIVATE" in AddonManager && dis == AddonManager.STATE_ASK_TO_ACTIVATE) {
		style = options.styleClickToPlay;
		state = _localize("Ask to activate");
	}
	else if(!dis) {
		style = options.styleEnabled;
		state = _localize("Enabled");
	}
	else {
		style = options.styleDisabled;
		state = _localize("Disabled");
	}

	if(style.hasOwnProperty("checked"))
		this.checked = style.checked;
	if(style.hasOwnProperty("style"))
		this.style.cssText = style.style;
	if(
		style.hasOwnProperty("iconStyle")
		|| style.hasOwnProperty("iconGrayscale")
		|| style.hasOwnProperty("iconOpacity")
	) {
		var icon = this.ownerDocument.getAnonymousElementByAttribute(this, "class", "toolbarbutton-icon");
		if(icon) {
			if(style.hasOwnProperty("iconStyle"))
				icon.style.cssText = style.iconStyle;
			if(style.hasOwnProperty("iconGrayscale"))
				icon.style.filter = style.iconGrayscale ? 'url("chrome://mozapps/skin/extensions/extensions.svg#greyscale")' : "";
			if(style.hasOwnProperty("iconOpacity"))
				icon.style.opacity = style.iconOpacity;
		}
	}

	this.tooltipText = _localize("%N: %S")
		.replace("%N", options.pluginName)
		.replace("%S", state);
});
Components.utils.import("resource://gre/modules/AddonManager.jsm");

this.initAddonListener = function() {
	var addonListener = {
		button: this,
		onEnabled: function(addon) {
			this._updateButton(addon);
		},
		onDisabled: function(addon) {
			this._updateButton(addon);
		},
		onInstalled: function(addon) {
			if(
				!_addon
				&& options.searchInTypes.indexOf(addon.type) != -1
				&& addon.name.indexOf(options.pluginName) != -1
			) {
				_addon = addon;
				_addonId = addon.id;
				this.button.pluginDisabled = addon.userDisabled;
			}
		},
		onUninstalled: function(addon) {
			if(_addon && addon.id == _addonId) {
				_addon = _addonId = undefined;
				this.button.pluginDisabled = true;
			}
		},
		onPropertyChanged: function(addon, properties) {
			if(properties && properties.indexOf("userDisabled") != -1)
				this._updateButton(addon);
		},
		_updateButton: function(addon) {
			if(addon.id == _addonId)
				this.button.pluginDisabled = addon.userDisabled;
		}
	};
	AddonManager.addAddonListener(addonListener);
	this.onDestroy = function() {
		AddonManager.removeAddonListener(addonListener);
	};
};

var btn = this;
AddonManager.getAddonsByTypes(options.searchInTypes, function(addons) {
	addons.some(function(addon) {
		if(addon.name.indexOf(options.pluginName) == -1)
			return false;
		_addon = addon;
		_addonId = addon.id;
		btn.pluginDisabled = addon.userDisabled;
		return true;
	});
	if(!_addon)
		btn.pluginDisabled = true;
	btn.initAddonListener();
});

this.onclick = function(e) {
	if(e.button != 0)
		return;
	if(!_addon) {
		alert(options.pluginName + " not installed!");
		return;
	}
	// Note: we manually updates styles because this is a bit faster, than callback in case of addon changes
	_addon.userDisabled = this.pluginDisabled = getNewDisabled(_addon);
};
function getNewDisabled(addon) {
	// disabled -> STATE_ASK_TO_ACTIVATE -> enabled -> ...
	var curDis = addon.userDisabled;
	if("STATE_ASK_TO_ACTIVATE" in AddonManager && curDis == AddonManager.STATE_ASK_TO_ACTIVATE)
		newDis = false;
	else if(!curDis)
		newDis = true;
	else {
		if(isAskToActivateAddon(addon))
			newDis = AddonManager.STATE_ASK_TO_ACTIVATE;
		else
			newDis = false;
	}
	return newDis;
}
function isAskToActivateAddon(addon) {
	return addon.type == "plugin"
		&& "STATE_ASK_TO_ACTIVATE" in AddonManager
		&& Application.prefs.getValue("plugins.click_to_play", false);
}