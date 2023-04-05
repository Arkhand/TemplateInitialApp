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
	        var fnSetAppNotBusy = function () {
	          this.set("/appView/busy", false);
	          this.set("/appView/delay", this.getView().getBusyIndicatorDelay());
	        }.bind(this)
	
	        this.getOwnerComponent().getModel("PM_SRV").metadataLoaded().then(fnSetAppNotBusy);
	        this.getOwnerComponent().getModel("PM_SRV").attachMetadataFailed(fnSetAppNotBusy);
	
	        
	      },
	
	      initializations: function () {
	        
	      }
	      
      });
    }
  );
  