sap.ui.define([
	'sap/ui/comp/library',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/type/String',
	'sap/m/ColumnListItem',
	'sap/m/Label',
	'sap/m/SearchField',
	'sap/m/Token',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/core/Fragment',
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog"
], function (
	compLibrary,
	Controller,
	JSONModel,
	TypeString,
	ColumnListItem,
	Label,
	SearchField,
	Token,
	Filter,
	FilterOperator,
	Fragment,
	ValueHelpDialog
) {
	"use strict";
	
	/*
		Ej parametros:

		oControl --> Control Input o MutiInput
		oModel --> Modelo JSON o modelo ODATA
		sEntity --> Entidad a filtrar ej: "/ProductCollection"
		title = Titulo de la ventana ej. 'test'
		basicSearchText =   Esto no se para q corno es. ej ''
		basicSearch = si soporta busqueda por texto libre ej: false
		waitGoButton = espera por el boton de GO antes de disparar una busqueda (valor por defecto true) ej true
		aFilters = (opcional) Filtros q se van a aplicar siempre
		
		modelo de columnas:
		aCols = [
		    {
		        "label": "ProductId",        // label
		        "template": "ProductId",     // ID del Property
		        "width": "5rem",             // (opcional) ancho 
		        "filtrable": true,           // (opcional) si se puede filtrar
		        "key": true                  // (opcional) si es la clave a obtener
		        "descriptionKey": "Name"     // (opcional) Property del nombre de la clave 
			    "defaultFilterValue": "001"  // (opcional) Filtro por defecto
			    "valueHelpRequest": function // (opcional) Funcion de VH del 
			    "FilterOperator": 'EQ'		 // (opcional) El operador por defecto es "Contains"
		    	"hideColumn":				 // (opcion) ocular como columna de la tabla (usar solo como filtro)
			    "formatter":				 // (opcional) formatter function,
			    "supportRanges":		     // (opcional) uso rango
			    "supportRangesOnly":		 // (opcional) rango obligatorios.
			    "maxLength",				 // (opcional) Es necesario solo para usar RANGOS
		    },
		    {
		        "label": "Product Name",
		        "template": "Name",
		        "filtrable": "true"
		    },
		    {
		        "label": "Category",
		        "template": "Category"

		    }
		]
		
		Metodos:
		open --> Abre el VH
		afterSelect -->  recibe un function callback q se ejecuta luego de seleccionar los valores, Recive los parametros ( oToken, aValuesSelected )
		afterSet --> recibe un function callback q se ejecuta luego de setear los valores al input o multInput 
	*/
	return class ValueHelp {
		
		constructor(oProps) {
			if (!oProps.oControl) throw "Complete oControl"
			if (!oProps.oModel) throw "Complete oModel"
			if (!oProps.sEntity) throw "Complete sEntity"
			if (!oProps.aCols) throw "Complete aCols"
			
			this.oControl = oProps.oControl
			this.oModel = oProps.oModel
			this.sEntity = oProps.sEntity
			this.aFitlers = oProps.aCols.filter(function(oCol){return !!oCol.filtrable})
			this.aCols = oProps.aCols.filter(function(oCol){return !oCol.hideColumn})
			this.title = oProps.title ? oProps.title : ''
			this.basicSearchText = oProps.basicSearchText ? oProps.basicSearchText : ''
			this.basicSearch = oProps.basicSearch ? oProps.basicSearch : false
			this.supportRanges = !!oProps.supportRanges
			this.supportRangesOnly = !!oProps.supportRangesOnly
			this.aAlwaysFilters = oProps.aFilters
			
			this.waitGoButton =  !!oProps.waitGoButton
			
			this.aCols.forEach(function (oCol) {
				if (oCol.key) {
					this.key = oCol.template
					this.descriptionKey = oCol.descriptionKey ? oCol.descriptionKey : oCol.template
					this.title = oCol.label
					this.maxLengthKey = oCol.maxLength
				}
			}.bind(this))

			this._determineMultiSelect()

			this._oValueHelpDialog = new ValueHelpDialog({
				basicSearchText: this.basicSearchText,
				title: this.title,
				supportMultiselect: this.supportMultiselect,
				supportRanges: this.supportRanges,
				supportRangesOnly: false,
				key: this.key,
				descriptionKey: this.descriptionKey,
				ok: this._onValueHelpOkPress.bind(this),
				cancel: this._onValueHelpCancelPress.bind(this),
				afterClose: this._onValueHelpAfterClose.bind(this)
			});
			
			//Ocultar el filtro de advanced search en Celulares
			this._oValueHelpDialog.addDelegate({
				onAfterRendering: function(){
					if (this._oValueHelpDialog._oAdvancedSearchLink) this._oValueHelpDialog._oAdvancedSearchLink.setVisible(false)
				}.bind(this)
			});
			
			this._oValueHelpDialog.setRangeKeyFields([{
				label: this.descriptionKey,
				key: this.key,
				type: "string",
				typeInstance: new TypeString({}, {
					maxLength: this.maxLengthKey
				})
			}]);

			this._buildInputs()

			var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
				filterGroupItems: this.aFilterGroupItem,
				search: this._onFilterBarSearch.bind(this)
			});

			this._oBasicSearchField = new SearchField({ showSearchButton: false });
			
			this._oValueHelpDialog.setFilterBar(oFilterBar)

			if (this.basicSearch) this._oValueHelpDialog.getFilterBar().setBasicSearch(this._oBasicSearchField);
			
			this._oValueHelpDialog.getTableAsync().then( this._prepareTable.bind(this) );

		}

		open() {
			this._oValueHelpDialog.open();
		}
		
		afterSelect(fCallBack){
        	this.afterSelect = fCallBack;
        }
        
		afterSet(fCallBack){
        	this.afterSet = fCallBack;
        }
        
        _determineMultiSelect(){
		    if (this.supportMultiselect === null || this.supportMultiselect === undefined) {
				switch (this.oControl.getMetadata().getName()) {
				case 'sap.m.MultiInput':
					this.supportMultiselect = true
					break;
				case 'sap.m.Input':
					this.supportMultiselect = false
					break;
				default:
					this.supportMultiselect = false
					break
				}
			}
        }
        
        _buildInputs(){
        	this.aFilterInputs = []
        	this.aFilterGroupItem = []
        	
        	this.aFitlers.forEach(function (oCol) {
		
				let oFilterInput = new sap.m.Input({
					name: oCol.template,
					value: oCol.defaultFilterValue ? oCol.defaultFilterValue : '',
					showValueHelp: !!oCol.valueHelpRequest,
					valueHelpRequest: oCol.valueHelpRequest ? oCol.valueHelpRequest : ''
				})
				
				oFilterInput.FilterOperator = oCol.FilterOperator ? oCol.FilterOperator : FilterOperator.Contains
				
				oFilterInput.onsapenter = ((oEvent) => {
				    this._onFilterBarSearch()
				});


				this.aFilterInputs.push(oFilterInput)
				this.aFilterGroupItem.push(new sap.ui.comp.filterbar.FilterGroupItem({
					groupTitle: "Basic",
					groupName: "Basic",
					name: oCol.template,
					label: oCol.label,
					control: oFilterInput,
					visibleInFilterBar: true
				}))
			}.bind(this))
        }
        
        _prepareTable(oTable){
        	
        	this.oTable = oTable
        	this.oColModel = new JSONModel({ cols: this.aCols });
			oTable.setModel(this.oColModel, "columns");

			// if (oTable.bindRows && oTable.getColumns().length == 0) {
			// 	this.aCols.map(function(oCol){
			// 		oTable.addColumn( new sap.ui.table.Column({label: oCol.label, template: oCol.template }) );
			// 	}.bind(this))
			// }
			// if (oTable.bindItems  && oTable.getColumns().length  0 ) {
			// 	this.aCols.map(function(oCol){
			// 		oTable.addColumn( new sap.m.Column( {header: new sap.m.Label({text: "Product Code"} ) }));
			// 	}.bind(this))
			// }
			// this._oValueHelpDialog.update();
			
			if (!this.waitGoButton) {
				this._onFilterBarSearch();
			}
        }
        
        _bindTable(oTable, oFilter){
        	// if (this.bTableBinded) return false
        	
        	oTable.setModel(this.oModel);
			if (oTable.bindRows) {
				// oTable.bindAggregation("rows", { path: this.sEntity } );
				oTable.bindAggregation("rows", { path: this.sEntity, filters: oFilter, parameters: { countMode: sap.ui.model.odata.CountMode.None} } );
			}
			if (oTable.bindItems) {
				
				var fTemplate = function () {
					return new ColumnListItem({
						cells: this.aCols.map(function (column) {
							return new Label( { text: "{" + column.template + "}" });
						})
					});
				}
				
				oTable.bindAggregation("items", this.sEntity, fTemplate.bind(this) , null, oFilter );
			}
			
			this.bTableBinded = true;
			
			return true
        }
     
		_onValueHelpOkPress(oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			this.selectedTokens = aTokens;
            if (this.afterSelect) {
				let aSelectedData = []
				let aKeys = []
				if (this.oTable.getBinding("rows")) {
					try {
						aKeys = this.oTable.getSelectedIndices().map(function (iIndex) { return this.oTable.getBinding("rows").aKeys[iIndex] }.bind(this))
						aSelectedData = aKeys.map(function (sPath) { return { ... this.oModel.getProperty("/" + sPath) } }.bind(this))
					} catch { }
					try {
						if (!aSelectedData.length) {
							aSelectedData = this.oTable.getSelectedIndices().map(function (iIndex) { return this.oTable.getBinding("rows").oList[iIndex] }.bind(this))
						}
					} catch { }
				} else {
					try {
						aKeys = this.oTable.getSelectedItems().map(function (oSI) { return oSI.getBindingContext().sPath }.bind(this))
						aSelectedData = aKeys.map(function (sPath) { return { ... this.oModel.getProperty(sPath) } }.bind(this))
					} catch { }
				}
				this.afterSelect(aTokens, aSelectedData)
			}
			switch (this.oControl.getMetadata().getName()) {
			case 'sap.m.MultiInput':
				this.oControl.setTokens(aTokens);
				this.oControl.fireTokenUpdate();
				this.oControl.fireChange()
				break;
			case 'sap.m.Input':
				if (aTokens.length) this.oControl.setValue(aTokens[0].getKey());
				this.oControl.fireChange()
				break;
			}
			this._oValueHelpDialog.close();
			this.afterSet();
		}

		_onValueHelpCancelPress() {
			this._oValueHelpDialog.close();
		}

		_onValueHelpAfterClose() {
			this._oValueHelpDialog.destroy();
		}

		_onFilterBarSearch() {
			var sSearchQuery = this._oBasicSearchField.getValue()
			var aFilters = this.aFilterInputs.reduce(function (aResult, oControl) {
				if (oControl.getValue()) {
					aResult.push(new Filter({
						path: oControl.getName(),
						operator: oControl.FilterOperator,
						value1: oControl.getValue()
					}));
				}
				return aResult;
			}, []);
			if (sSearchQuery) {
				let aQueryFilters = []
				this.aCols.forEach(function (oCol) {
					aQueryFilters.push(new Filter({
						path: oCol.template,
						operator: FilterOperator.Contains,
						value1: sSearchQuery
					}))
				})
				aFilters.push(new Filter({
					filters: aQueryFilters,
					and: false
				}));
			}
			if (this.aAlwaysFilters) {
				aFilters = aFilters.concat(this.aAlwaysFilters)
			}
			this._filterTable(new Filter({
				filters: aFilters,
				and: true
			}));
		}

		_filterTable(oFilter) {
			var oValueHelpDialog = this._oValueHelpDialog;
			oValueHelpDialog.getTableAsync().then(function (oTable) {
				
				// var bFirstBind = 
				this._bindTable(oTable, oFilter)
				
				// if (!bFirstBind){
				// 	if (oTable.bindRows) {
				// 		oTable.getBinding("rows").filter(oFilter);
				// 	}
				// 	if (oTable.bindItems) {
				// 		oTable.getBinding("items").filter(oFilter);
				// 	}
				// }
				
				oValueHelpDialog.update();
				oTable.updateBindings(true)
			}.bind(this));
		}

	};
});