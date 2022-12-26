sap.ui.define([
	"./BaseController",
	"../utils/formatter",
	"../utils/FilterUtils",
	"../utils/oDataActions",
	"../utils/TableP13n",
	"../controller/VH",
], function (
	BaseController,
	formatter,
	FilterUtils,
	oDataActions,
	TableP13n,
	VH
) {
	"use strict";

	return BaseController.extend("com.blueboot.TemplateApp.controller.Worklist", {
		oDataModel: null,
		oGlobalModel: null,
		oMessageManager: null,

		formatter: formatter,

		_smartFilterBar: null,
		_MessagesIndicator: null,
		VH: VH,

		onInit: function () {
			window.worklist = this //debug
			
			this._MessagesIndicator = this.byId('MessagesIndicator');

			//Models
			this.oDataModel = sap.ui.getCore().getModel("PM_SRV");
			this.oGlobalModel = sap.ui.getCore().getModel();
			this.createOdataPromse(this.oDataModel);

			//Message manger registration
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");
			this.oMessageManager.registerObject(this.getView(), true);
			
			//EJEMPLO DE LLAMADA A ODATA
			oDataActions.getUserData.call(this)

		},

	});
});