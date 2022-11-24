sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
    function (JSONModel, Device) {
        "use strict";

        return {
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },

            attachRequestFailed: function(oDataModel){
                oDataModel.attachRequestFailed(this.parseError);
            },
    
            createGlobalModel: function(){
                var oGDModel = new JSONModel();
                oGDModel.setDefaultBindingMode("TwoWay");
                this.setModel(oGDModel);
            },
            
            parseError: function(oEvent){
                var oError = oEvent.getParameter("response")
                var sMessage
                try {
                    sMessage = JSON.parse(oError.responseText).error.message.value
                } catch {}
                if (!sMessage && oError.messageoError) sMessage = oError.messageoError.responseText
                if (!sMessage) sMessage = oError.responseText
                
                sap.m.MessageBox.show(
                    sMessage,
                    sap.m.MessageBox.Icon.ERROR,
                    oError.message
                );
                
                console.error(oError);
            }
            
        };
});