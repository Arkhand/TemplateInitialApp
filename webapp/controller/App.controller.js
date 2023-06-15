sap.ui.define(
    [
      "./BaseController",
      "sap/ui/model/json/JSONModel"
    ],
    function(
      BaseController,
      JSONModel
      ) {
      "use strict";
  
      return BaseController.extend("com.blueboot.TemplateApp.controller.App", {

        oDataModel: null,
        oGlobalModel: null,
        oMessageManager: null,

	      onInit() {
	
	        this.initializations()
	
	        //Models
	        this.oDataModel = sap.ui.getCore().getModel("PM_SRV");
	        this.oGlobalModel = sap.ui.getCore().getModel();
	        this.createOdataPromse(this.oDataModel);
	
	        this.oMessageManager = sap.ui.getCore().getMessageManager();
	        this.getView().setModel(this.oMessageManager.getMessageModel(), "message");
	        this.oMessageManager.registerObject(this.getView(), true);
	
	        this.set('/appView', { busy: true, delay: 0 })
	        var fnSetAppNotBusy = function() {
				this.set("/appView", {
					busy : false,
					delay : iOriginalBusyDelay
				})
			}.bind(this);
			var fnMetadataFail = function(error) {
				fnSetAppNotBusy()
				var errorText
				if (error?.responseText) errorText = new DOMParser().parseFromString(error.responseText,"application/xml")?.querySelector("message")?.getInnerHTML()
				errorText = errorText ? errorText : error.responseText
				sap.m.MessageBox.error(errorText)
			}.bind(this);

			// disable busy indication when the metadata is loaded and in case of errors
			this.oDataModel.metadataLoaded().then(fnSetAppNotBusy);
			this.oDataModel.attachMetadataFailed(fnMetadataFail);
			this.oDataModel.metadataLoaded(true).then().catch(fnMetadataFail);
	
	        
	      },
	
	      initializations: function () {
	        
	      }
	      
      });
    }
  );
  