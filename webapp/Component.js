sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/blueboot/TemplateApp/model/models",
	"sap/ui/fl/FakeLrepConnectorLocalStorage"
], function (UIComponent, Device, models, FakeLrepConnectorLocalStorage) {
	"use strict";

	return UIComponent.extend("com.blueboot.TemplateApp.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
            //Fake LRP: ODATA Repository as Local Repository
            if ( !(sap.ushell  && sap.ushell.Container && sap.ushell.Container.getService("Personalization")) ){
                FakeLrepConnectorLocalStorage.enableFakeConnector();
            }

            // models.createODataModel(this);
            models.attachRequestFailed(this.getModel("PM_SRV"))
            models.createGlobalModel.call(this);

            //UI5 native
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();
            let deviceModel = models.createDeviceModel()
            this.setModel(deviceModel, "device");
		
            //Globalizacion de modelos
            sap.ui.getCore().setModel(this.getModel());
            sap.ui.getCore().setModel(this.getModel("PM_SRV"),"PM_SRV")
            sap.ui.getCore().setModel(deviceModel, "device");
            sap.ui.getCore().setModel(this.getModel('i18n'), "i18n");
		}
	});
});