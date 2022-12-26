/*!
 * OpenUI5
 * (c) Copyright 2009-2022 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/base/Object"],function(B){"use strict";var M=B.extend("sap.m.p13n.MetadataHelper",{constructor:function(p){B.apply(this,arguments);this._aProperties=p;}});M.prototype.getProperties=function(){return this._aProperties;};M.prototype.getProperty=function(k){return this._aProperties.find(function(p){return p.key===k;});};M.prototype.getPath=function(k){return this.getProperty(k).path;};return M;});
