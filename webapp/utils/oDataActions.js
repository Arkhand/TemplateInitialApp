sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	], function (
		Filter,
		FilterOperator
	) {
	"use strict";

	return {
		
		getUserData: function(){
			var pUserData;
			pUserData = this.get('/pUserData');
			if (pUserData) return pUserData;
			
			pUserData = this._oData.read("/UserDataSet('')")
			.then(function (oData) {
				this.set("/UserData", oData );
			}.bind(this));
			this.set('/pUserData', pUserData)
			
			return pUserData;
		},
		

	};

});