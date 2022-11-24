sap.ui.define([
    "../utils/ValueHelp",
    'sap/ui/model/FilterOperator',
], function (ValueHelp, FilterOperator) {
    "use strict";

    return {

        onPlantVH: function(oEvent){
			var oProps = {
				oControl: oEvent.getSource(),
				oModel: this.oDataModel,
				sEntity: "/PlantCXSet",
				basicSearch: false,
				aCols: [
					{
						label: this.getText('PLANT'),
						template: "Werks",
						width: "6rem",
						filtrable: true,
						key: true,
						descriptionKey: "Name1"
					},
					{
						label: this.getText('Description'),
						template: "Name1",
						filtrable: "true",
					}
				]
			}
			var oVH = new ValueHelp( oProps );
			oVH.open()
		},

		onMaterialVH: function(oEvent){
			var oProps = {
				oControl: oEvent.getSource(),
				oModel: this.oDataModel,
				sEntity: "/MaterialPlantVHSet",
				basicSearch: false,
				aCols: [
					{
						label: this.getText('Material'),
						template: "Matnr",
						width: "10rem",
						filtrable: true,
						key: true,
						descriptionKey: "Name1"
					},
					{
						label: this.getText('Plant'),
						template: "Werks",
						width: "6rem",
						filtrable: true,
						defaultFilterValue: this.get('/Inputs/Plant')
					},
					{
						label: this.getText('Description'),
						template: "Maktx",
						filtrable: "true",
					}
				]
			}
			var oVH = new ValueHelp( oProps );
			oVH.open()
		},
		
    };
});