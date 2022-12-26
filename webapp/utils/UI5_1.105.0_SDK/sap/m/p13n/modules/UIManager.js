/*!
 * OpenUI5
 * (c) Copyright 2009-2022 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/base/Object","sap/ui/mdc/util/loadModules","sap/base/Log"],function(B,l,L){"use strict";var E="UIManager: This class is a singleton and should not be used without an AdaptationProvider. Please use 'sap.m.p13n.Engine.getInstance().uimanager' instead";var u;var U=B.extend("sap.m.p13n.UIManager",{constructor:function(a){if(u){throw Error(E);}this.oAdaptationProvider=a;B.call(this);}});U.prototype.show=function(c,p,s){var P=p instanceof Array?p:[p];var r=sap.ui.getCore().getLibraryResourceBundle("sap.m");var t=this;s=Object.assign({},s);if(!this.hasActiveP13n(c)){this.setActiveP13n(c,p);return this.create(c,p,s).then(function(i){return l(["sap/m/p13n/Popup"]).then(function(m){var T;if(!s.title&&P.length===1){T=i[0].getTitle();}else{T=s.title||r.getText("p13n.VIEW_SETTINGS");}var a=m[0];var o=new a({mode:s.mode,warningText:s.warningText||r.getText("p13n.RESET_WARNING_TEXT"),title:T,close:function(e){var R=e.getParameter("reason");if(R=="Ok"){t.oAdaptationProvider.handleP13n(c,P);}o.removeAllPanels();t.setActiveP13n(c,null);o.destroy();},reset:function(){t.oAdaptationProvider.reset(c,P);}});i.forEach(function(b,I){o.addPanel(b,P[I]);});c.addDependent(o);o.open(s.source,s);return o._oPopup;});},function(e){this.setActiveP13n(c,null);L.error("UIManager failure:"+e.stack);}.bind(this));}else{return Promise.resolve();}};U.prototype.create=function(c,p){var P=p instanceof Array?p:[p];var t=this;return this.oAdaptationProvider.initAdaptation(c,P).then(function(){var s=this.oAdaptationProvider.getUISettings(c,P);if(s instanceof Promise){return s;}else{var a=[],b=[];Object.keys(s).forEach(function(S){var v=s[S];if(v&&v.hasOwnProperty("adaptationUI")){var d=v.adaptationUI;a.push(d);b.push({key:S,settings:v});}});return Promise.all(a).then(function(d){var m={};d.forEach(function(o,i){if(o){var e=b[i];var C=e.settings.containerSettings;if(C.title){o.setTitle(C.title);}m[e.key]={panel:o};}});return m;});}}.bind(this)).then(function(s){var i=[];Object.keys(s).forEach(function(a,I){var o=s[a].panel;if(o.attachChange instanceof Function){o.attachChange(function(e){t.oAdaptationProvider.validateP13n(c,P[I],e.getSource());});}i.push(o);});return i;});};U.getInstance=function(a){if(!u){this._checkValidInterface(a);u=new U(a);}return u;};U.prototype.setActiveP13n=function(c,k){if(this.oAdaptationProvider.setActiveP13n instanceof Function){this.oAdaptationProvider.setActiveP13n(c,k);}};U.prototype.hasActiveP13n=function(c){var a=false;if(this.oAdaptationProvider.hasActiveP13n instanceof Function){a=this.oAdaptationProvider.hasActiveP13n(c);}return a;};U._checkValidInterface=function(a){if(!a||!a.isA("sap.m.p13n.AdaptationProvider")){throw Error("The UIManager singleton must not be accessed without an AdaptationProvider interface!");}};U.prototype.destroy=function(){B.prototype.destroy.apply(this,arguments);u=null;};return U;});
