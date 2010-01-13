// The contents of this file are subject to the Mozilla Public License
// Version 1.1 (the "License"); you may not use this file except in
// compliance with the License. You may obtain a copy of the License at
// http://www.mozilla.org/MPL/

// Software distributed under the License is distributed on an "AS IS"
// basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
// License for the specific language governing rights and limitations
// under the License.

// Copyright (C) 2009-2010, Balagopal Komarath, All Rights Reserved.

// INTRO

// This extension allows users to organize ff tabs more easily
// by grouping tabs into "workspaces". A workspace is simply a
// set of tabs.

// There are two workspaces "default" and "alternate".

// "alternate" workspace consists of only "about:blank" tab, initially.

// When ff starts all tabs opened belong to "default" workspace.

// When "Switch Workspace" button is clicked, "alternate" workspace
// is loaded. All tabs opened after this belong to "alternate" workspace.

// The user can switch back and forth between 2 workspaces by clicking
// "Switch Workspace" button.

// The concept is borrowed from "Multiple Desktop" feature found in Linux
// window managers.



// Design

// A workspace is an array of tabs.
// There is an array of workspaces

// End of design

var debug = false;

var debugPrint = function(msg)
{
    if(debug)
	alert(msg);
}

var WorkspaceSwitcher = {

    // Print state of variablef addon
    printState: function() {
       	// This is a reference to the browser
	// This has methods loadTabs(), addTab(), removeTab() to manipulate tabs
	var browser = Components.classes["@mozilla.org/appshell/window-mediator;1"].
	getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser').getBrowser();

	var str =
	'nWs = ' + this.nWorkspaces +
	',cWs = ' + this.currentWorkspace + '\n';

	var i, j;

	for(i = 0;i < this.nWorkspaces;++i) {
	    str = str + 'WS: ' + i + ', ' + this.workspaces[i].length + ' tabs\n';
	    for(j = 0;j < this.workspaces[i].length;++j) {
		var b = browser.getBrowserForTab(this.workspaces[i][j]);
		if(b && "currentURI" in b && b.currentURI) {
		    str += b.currentURI.spec + ',';
		}
	    }
	    str = str + '\n';
	}

	debugPrint(str);
    },

    init: function(e) {
       	// This is a reference to the browser
	// This has methods loadTabs(), addTab(), removeTab() to manipulate tabs
	var browser = Components.classes["@mozilla.org/appshell/window-mediator;1"].
	getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser').getBrowser();

	var prefs = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefService)
	.getBranch("wss.");
	prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		
	this.nWorkspaces = prefs.getIntPref("num_wss");

	debugPrint("num = " + this.nWorkspaces);
	
	this.currentWorkspace = 0;
	this.workspaces = new Array(this.nWorkspaces); // array of workspaces
	var i;
	for(i = 0;i < this.workspaces.length;++i)
	    {
		this.workspaces[i] = new Array(); // each workspace is an array of tabs
	    }

	this.workspaces[0].push(browser.selectedTab);
	this.workspaces[0].selected = browser.selectedTab;	
	for(i = 0;i < browser.tabContainer.itemCount;++i) {
	    if(browser.tabContainer.getItemAtIndex(i) != browser.selectedTab) {
		this.workspaces[0].push(browser.tabContainer.getItemAtIndex(i));
	    }
	}

	// add blank tab to all other workspaces
	for(i = 1;i < this.nWorkspaces;++i) {
	    this.currentWorkspace = i; // Switch workspace so that handleTabOpen works properly
	    var tab = browser.addTab("about:blank");
	    this.workspaces[i].selected = tab;
	    tab.hidden = true;
	}

	this.currentWorkspace = 0; // Start off @ first workspace

	this.printState();
    },

    // Return the number of tabs in a workspace
    // ws: Workspace ID
    nTabs: function(ws) {
	return this.workspaces[ws].length;
    },

    // Get next workspace id
    next: function(ws) {
	return (ws + 1) % this.nWorkspaces;
    },

    switchTo: function(oldws, newws) {
	var i;
       	// This is a reference to the browser
	// This has methods loadTabs(), addTab(), removeTab() to manipulate tabs
	var browser = Components.classes["@mozilla.org/appshell/window-mediator;1"].
	getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser').getBrowser();

	this.printState();

	// hide all tabs in old workspace
	for(i = 0;i < this.workspaces[oldws].length;++i) {
	    this.workspaces[oldws][i].hidden = true;
	}
	this.workspaces[oldws].selected = browser.selectedTab; // save the selected tab

	// show all tabs in new workspace
	for(i = 0;i < this.workspaces[newws].length;++i) {
	    this.workspaces[newws][i].hidden = false;
	}
	this.currentWorkspace = newws;
	browser.selectedTab = this.workspaces[newws].selected; // Restore selected tab

	this.printState();
    },

    // Flash the current workspace to user
    showWSSwitch: function() {
	// User is notified by a label above tabbrowser
	var label = document.getElementById("wss-label");
	var appcontent = document.getElementById("appcontent");

	if(label == null) { // if label doesn't exist
	    label = document.createElement("label"); // create
	    appcontent.insertBefore(label, appcontent.firstChild); // and add to GUI
	} else { // label exists
	    clearTimeout(this.showWSSwitch.clearLabelTimeout); // We are going to paint over it, don't remove now
	}

	label.setAttribute("value", "Workspace " + this.currentWorkspace);
	label.id = "wss-label";
	label.control = "content";
	// Now remove the message after 3 seconds
	var clearWSLabel = "var appcontent = document.getElementById(\"appcontent\"); var label = document.getElementById(\"wss-label\"); appcontent.removeChild(label); ";
	this.showWSSwitch.clearLabelTimeout = setTimeout(clearWSLabel, 3000);
    },

    run: function() {
	this.switchTo(this.currentWorkspace, this.next(this.currentWorkspace));
	this.showWSSwitch(); // Notify user about the switch
    },

    handleTabSelect: function(e) {
	// This has methods loadTabs(), addTab(), removeTab() to manipulate tabs
	var browser = Components.classes["@mozilla.org/appshell/window-mediator;1"].
	getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser').getBrowser();
	var tab = e.originalTarget;
	this.printState();
	
	var i;
	var tabInThisWorkspace = false; // is selected tab in current workspace?

	for(i = 0;i < this.workspaces[this.currentWorkspace].length;++i) {
	    if(tab == this.workspaces[this.currentWorkspace][i]) {
		debugPrint('tab in this');
		tabInThisWorkspace = true;
		break;
	    }
	}
	if(!tabInThisWorkspace) { // NO
	    debugPrint('tab not in this');
	    browser.selectedTab = this.workspaces[this.currentWorkspace][0]; // Select first tab in current workspace
	}
    },

    // add opened tab to current workspace
    handleTabOpen: function(e) {
	// This has methods loadTabs(), addTab(), removeTab() to manipulate tabs
	var browser = Components.classes["@mozilla.org/appshell/window-mediator;1"].
	getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser').getBrowser();

	debugPrint('open');

	this.workspaces[this.currentWorkspace].push(e.originalTarget);

	this.printState();
    },

    handleTabClose: function(e) {
	var i;
       	// This is a reference to the browser
	// This has methods loadTabs(), addTab(), removeTab() to manipulate tabs
	var browser = Components.classes["@mozilla.org/appshell/window-mediator;1"].
	getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser').getBrowser();
	var rtab = e.originalTarget; // The removed tab

	// Splice out from workspace
	for(i = 0;i < this.workspaces[this.currentWorkspace].length;++i) {
	    if(this.workspaces[this.currentWorkspace][i] == rtab) {
		this.workspaces[this.currentWorkspace].splice(i, 1);
		break;
	    }
	}

	// If current workspace has become empty
	if(this.nTabs(this.currentWorkspace) == 0) {
	    var atab = browser.addTab("about:blank"); // add a blank tab
	}
    }
};


// Listener registrations
window.addEventListener("load", function(e) { WorkspaceSwitcher.init(e); }, false);
window.addEventListener("TabSelect", function(e) { WorkspaceSwitcher.handleTabSelect(e); }, false);
window.addEventListener("TabOpen", function(e) { WorkspaceSwitcher.handleTabOpen(e); }, false);
window.addEventListener("TabClose", function(e) { WorkspaceSwitcher.handleTabClose(e); }, false);
