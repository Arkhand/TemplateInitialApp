sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"../model/ODataPromise",
	'sap/ui/core/Fragment',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/library"
], function (
	Controller,
	History,
	UIComponent,
	library,
	ODataPromise,
	Fragment,
	Filter,
	FilterOperatory,
	coreLibrary
	) {
	"use strict";

	var URLHelper = library.URLHelper;
	var ValueState = coreLibrary.ValueState;
	var MessageType = coreLibrary.MessageType;

	return Controller.extend("com.blueboot.smartplanning.controller.BaseController", {

		set: function(sProperty, value){
			if (!sProperty) {
				console.error('Property unknow')
				return
			}
			var oGlobalModel = sap.ui.getCore().getModel();
			return oGlobalModel.setProperty(sProperty, value)
			
		},

		get: function(sProperty){
			if (!sProperty) {
				console.error('Property unknow')
				return
			}
			var oGlobalModel = sap.ui.getCore().getModel();
			return oGlobalModel.getProperty(sProperty)
		},

		getBase64: function (file) {
			debugger
			var reader = new FileReader();
			return new Promise((resolve, reject) => {
				reader.readAsDataURL(file);
				reader.onload = function (theFile) {
					let base64_marker = ";base64,"
					let fileContent = reader.result;
					let base64index = fileContent.indexOf(base64_marker);
					let base64 = base64_marker + fileContent.substring(base64index + base64_marker.length).match(/.{1,76}/g).join("\n");
					resolve({file, base64}) 
				};
				reader.onerror = function (error) { reject(error) };
			})
		},

		addMessage: function(sMessage, sType = 'E' ){

			switch (sType) {
				case 'E':
					sType = MessageType.Error
					break;
				case 'S':
					sType = MessageType.Success
					break;
				case 'W':
					sType = MessageType.Warning
					break;
				case 'I':
					sType = MessageType.Information
					break;
				default:
					sType = MessageType.Error
					break;
			}
			
			var oMessage = new sap.ui.core.message.Message({
				message: sMessage,
				type: sType,
				// target: "/Dummy",
				// processor: this.getView().getModel()
			});
			sap.ui.getCore().getMessageManager().addMessages(oMessage);
		},

		onNavBack : function() {
			var oHistory, sPreviousHash;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("TargetWorklist", {}, true /*no history*/);
			}
		},
		
		byFragmentId: function(sFragment,sControl) {
			return this.byId(sap.ui.core.Fragment.createId(sFragment,sControl))
		},
		
		getRouter : function () {
			return UIComponent.getRouterFor(this);
		},


		getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
		
		setbusy: function (bValue, sView = "appView") {
			this.getModel(sView).setProperty("/busy", bValue);
		},

		getText: function (sTextKey) {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sTextKey);
		},
		
		createOdataPromse: function (oModel) {
			if (this._oData !== undefined)  return 
			this._oData = new ODataPromise(oModel);
		},
		
		_getName : function () {
			var sName = this.getOwnerComponent().getMetadata().getComponentName();
			return sName
		},
		
		_getMessagePopover: function () {
			var oView = this.getView();
			if (!this._pMessagePopover) {
				this._pMessagePopover = Fragment.load({
					id: oView.getId(),
					name: this._getName() + ".view.Fragments.MessagePopover",
				}).then(function (oMessagePopover) {
					oView.addDependent(oMessagePopover);
					return oMessagePopover;
				});
			}
			return this._pMessagePopover;
		},

		openMessagePopover: function(){
			let fShow = function(){
				var oMessagesIndicator = this.byId('MessagesIndicator')
				this._getMessagePopover().then(function(oMessagePopover){
					oMessagePopover.openBy(oMessagesIndicator);
				});
			}.bind(this)
	
			if (sap.ui.getCore().getMessageManager().getMessageModel().getData().length){
				setTimeout( fShow , 10 );
			}	
		},
		
		toggleMessagePopover: function(oEvent){
			var oSourceControl = oEvent.getSource ? oEvent.getSource() : oEvent;
			this._getMessagePopover().then(function(oMessagePopover){
				if (oMessagePopover.isOpen()){
					oMessagePopover.close()
				} else{ 
					oMessagePopover.openBy(oSourceControl) 
				}
			});
		},		

	});

});