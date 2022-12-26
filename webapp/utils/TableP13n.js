sap.ui.define([
	"./UI5_1.105.0_SDK/sap/m/p13n/Popup-dbg",
	"./UI5_1.105.0_SDK/sap/m/p13n/SelectionPanel-dbg",
	"./UI5_1.105.0_SDK/sap/m/p13n/SortPanel-dbg",
	"./UI5_1.105.0_SDK/sap/m/p13n/GroupPanel-dbg"
], function (
	p13nPopup,
	SelectionPanel,
	SortPanel,
	GroupPanel
) {
	"use strict";

	return class TableP13n {
		
		/*
		
		-- Propiedades objeto constructor--
		
		oTable --> Tabla a personalizar ( probado con sap.ui.Table )
		oOpenBy --> Control q abrio el dialog (opcional)
		bSelectable --> Dialogo de seleccionar columna
		bSorteable --> Dialogo de ordenamiento
		bGroupable --> Dialogo de agrupaciones
		oVariantManagement --> Control de manejo de variantes sap.ui.comp.variants.VariantManagement
		
		-- Metodos --
		Open --> Abre el dialogo de personalizacion
		FilterTable --> Bindea filtros a la tabla 
		clearFilters --> borra todos los filtros bindeados a la tabla
		getSelectedVariantKey --> obtiene el Key de la variante actual
		applyVariantKey: aplica la variante segun la key
		
		*/
		
		constructor(oProps) {
			
			if (!oProps.oTable) throw "Complete oTable"
			if (!oProps.bSelectable && !oProps.bSorteable && oProps.bGroupable) throw "Select a personalisation option"

			this.bSelectable = !!oProps.bSelectable
			this.bSorteable = !!oProps.bSorteable
			this.bGroupable = !!oProps.bGroupable

			this.oTable = oProps.oTable
			this.oOpenBy = oProps.oOpenBy ? oProps.oOpenBy : {}
			this.oVM = oProps.oVariantManagement
			
			this.sStoreID = this.oVM ? this.oVM.getId() : null
			
			
			this.oPopup = this._createP13nDialog()

			this.oTable.addDelegate({
				onAfterRendering: this._initAfterRenderTable.call(this)
			});
			
		}
		
		_initAfterRenderTable() {
			this.initialState = this._getCurrentState(this.oTable, true)
			this.bTableAlrredyRender = true
			
			if (this.oVM) {
				if ( sap.ushell  && sap.ushell.Container && sap.ushell.Container.getService("Personalization") ){
					sap.ushell.Container.getService("Personalization").getContainer(this.sStoreID).done(function (oCC) {
					    this._p13nService = oCC
					    this._initVariantManagment()
					}.bind(this) )
				} else {
					this._initVariantManagment()
				}
			}
		}

		open() {
			if (this.bTableAlrredyRender) {
				this.aColumns = this._getCurrentState(this.oTable)
				this._setInitialData()
				this.oPopup.open(this.oOpenBy)
			}
		}
		
		filter( sStringToSearch, aKeysToFilter, sFilterOperator = "Contains"){
			
			if ( !this.oTable.getBinding() ) return
			
			var bAnd = false
			if ( sFilterOperator.startsWith('N') ) bAnd = true
			
			var aFilters = aKeysToFilter.map( function(sKey){
				return new sap.ui.model.Filter( sKey, sFilterOperator, sStringToSearch)
			})
			
			if (aFilters.length > 0){ 
				this.oTable.getBinding().filter(  new sap.ui.model.Filter({ filters: aFilters, and: bAnd }) , "Application" )
			} else {
				this.clearFilters()
			}
			
		}
		
		clearFilters(){
			if ( !this.oTable.getBinding() ) return
			this.oTable.getBinding().filter(  null , "Application" )
		}

		_reset() {
			this.aColumns = this.initialState
			this._setInitialData()
		}

		
		_getCurrentState(oTable, bKeepEmptyLabels) {
			var aColums = oTable.getColumns()
			var aColInternal = aColums.map(function (oColumn) {
				// let oLabel = oColumn.getLabel()
				return {
					sId: oColumn.getId(),
					// sLabel:  oLabel ? oLabel.getText() : '',
					sLabel: oColumn.getName(),
					oColumn: oColumn,
					sSortProperty: oColumn.getSortProperty(),
					bVisible: oColumn.getVisible(),
					bDescending: oColumn.getSortOrder() === "Descending"
				}
			})

			if (!bKeepEmptyLabels) {
				aColInternal = aColInternal.filter(function (oColInternal) {
					return !!oColInternal.sLabel
				})
			}

			oTable.getSortedColumns().map(function (oSortedColumn, iIndex) {
				let sColId = oSortedColumn.getId()
				let oFindedCol = aColInternal.find(function (oCol) {
					return oCol.sId === sColId
				})
				if (oFindedCol) {
					oFindedCol.iSortOrder = iIndex + 1
				}
			})

			return aColInternal
		}

		_createP13nDialog() {

			// var oPopup = new sap.m.p13n.Popup({
			var oPopup = new p13nPopup({
				title: "My Custom View Settings",
				close: this._afterClose.bind(this),
				reset: this._reset.bind(this),
				warningText: "Reset changes?"
			})

			if (this.bSelectable) {
			// 	this.oSelectionPanel = new sap.m.p13n.SelectionPanel({
				this.oSelectionPanel = new SelectionPanel({
					title: "Columns",
					enableCount:true,
					showHeader:true,
				})
				oPopup.addPanel(this.oSelectionPanel)
			}

			if (this.bSorteable) {
				this.oSortPanel = new SortPanel({
					title: "Sort"
				})
				oPopup.addPanel(this.oSortPanel)
			}

			if (this.bGroupable) {
				this.oGroupPanel = new GroupPanel({
					title: "Group"
				})
				oPopup.addPanel(this.oGroupPanel)
			}

			return oPopup
		}

		_afterClose(oEvent) {
			var sReason = oEvent.getParameter("reason");
			if (sReason === 'Ok') {
				this._parseP13nState();
				this._applyP13n();
			}
			// this.oPopup.destroy()
		}

		_parseP13nState() {
			this.oP13nState = {
				columns: this.oSelectionPanel ? this.oSelectionPanel.getP13nData() : [],
				sort: this.oSortPanel ? this.oSortPanel.getP13nData() : [],
				group: this.oGroupPanel ? this.oGroupPanel.getP13nData() : []
			};
		}

		_setInitialData( bIgnoreEmptyLabel = false ) {
			if (this.bSelectable) {
				this._setInitialSelection(bIgnoreEmptyLabel)
				this.oSelectionPanel.setP13nData(this.aInitialSelection)
			}

			if (this.bSorteable) {
				this._setInitialSort(bIgnoreEmptyLabel)
				this.oSortPanel.setP13nData(this.aInitialSort)
			}
		}

		_setInitialSelection( bIgnoreEmptyLabel) {
			this.aInitialSelection = []
			this.aColumns.map(function (oColumns) {
				let sLabel = oColumns.oColumn ? oColumns.oColumn.getName() : ''
				if ( sLabel || bIgnoreEmptyLabel ) {
					this.aInitialSelection.push({
						visible: oColumns.bVisible,
						name: oColumns.sId,
						label: sLabel,
					})
				}
			}.bind(this))
		}

		_setInitialSort( bIgnoreEmptyLabel ) {

			var aSortCols = this.aColumns.sort(function (a, b) {
				if (!b.iSortOrder) return -1
				if (a.iSortOrder < b.iSortOrder) return -1
				if (a.iSortOrder > b.iSortOrder) return 1
				return 0
			})

			var aSortInitial = []
			this.aInitialSort = this.aColumns.map(function (oColumns) {
				let sLabel = oColumns.oColumn ? oColumns.oColumn.getName() : ''
				if (oColumns.sSortProperty && ( sLabel || bIgnoreEmptyLabel ) ) {
					aSortInitial.push({
						sorted: !!oColumns.iSortOrder,
						name: oColumns.sId,
						label: sLabel,
						descending: oColumns.bDescending,
					})
				}
			})

			this.aInitialSort = aSortInitial
		}

		_applyP13n() {

			//Selected
			this.oTable.getColumns().map(function (oColumn) {
				if ( oColumn.getName() ){
					this.oTable.removeColumn(oColumn.getId())
				}
			}.bind(this))

			this.oP13nState.columns.map(function (oColP13n, iIndex) {
				var oCol = this.aColumns.find(function (oCol) {
					return oColP13n.name === oCol.sId
				})

				if (oCol && oCol.oColumn) {
					oCol.oColumn.setVisible(oColP13n.visible)
					this.oTable.addColumn(oCol.oColumn)
				}
			}.bind(this))

			//Sorted
			this.oTable.getColumns().map(function (oColumn) {
				oColumn.setSorted(false)
			}.bind(this))

			var iCantSortedCols = this.oP13nState.sort.reduce(function (iCounter, oCol) {
				if (oCol.sorted) iCounter = iCounter + 1
				return iCounter
			}, 0);

			this.oP13nState.sort.map(function (oColP13n, iIndex) {
				var oCol = this.aColumns.find(function (oCol) {
					return oColP13n.name === oCol.sId
				})
				if (oColP13n.sorted && oCol && oCol.oColumn) {
					this.oTable.sort(
						oCol.oColumn,
						oColP13n.descending ? 'Descending' : 'Ascending',
						iIndex + 1 === iCantSortedCols ? true : false
					)
				}
			}.bind(this))

		}
		
		_getVariantStorage(){
			var oStore
			
			if (!this._p13nService){
				var oLocalStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				oStore = oLocalStorage.get( this.sStoreID );
			} else {
				oStore = this._p13nService.getItemValue( 'p13nTable' )
			}
			
			if ( !oStore || !oStore.aVariant || !Array.isArray(oStore.aVariant)){
				oStore = { aVariant : [] }
			}
			return oStore
		}
		
		_setVariantStorage(oStore){
			if (!this._p13nService){
				var oLocalStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				oLocalStorage.put( this.sStoreID, oStore );
			} else {
				oStore = this._p13nService.setItemValue( 'p13nTable' , oStore )
				this._p13nService.save()
			}
		}
				
		_initVariantManagment(){

			var oStore = this._getVariantStorage()
			var oDefaul = null
			
			if ( oStore && oStore.aVariant && Array.isArray(oStore.aVariant)){
				oStore.aVariant.map(function(oVariant){
					this.oVM.addVariantItem( new sap.ui.comp.variants.VariantItem({ 
						text: oVariant.name,
						key: oVariant.key
					}) )
					if (oVariant.def === true) oDefaul = oVariant
				}.bind(this))
				
			}
			if (oDefaul) {
				this.oVM.setDefaultVariantKey(oDefaul.key)
				this.oVM._setSelection( this.oVM.getItemByKey(oDefaul.key), oDefaul.key)
				this._applyVariant(oDefaul)
			}
			
			this.oVM.attachManage( this._mangeVariant.bind(this) )
			this.oVM.attachSave( this._saveVariant.bind(this) )
			this.oVM.attachSelect( this._selectVariant.bind(this) )
		}
		
		_mangeVariant(oEvent){
		
			var oStore = this._getVariantStorage()
			// if ( !oStore || !oStore.aVariant || !Array.isArray(oStore.aVariant)){
			// 	oStore = { aVariant : [] }
			// }
			
			//Delete
			oStore.aVariant = oStore.aVariant.filter(function(oVariant){
				return !oEvent.mParameters.deleted.find(function(e){
					return e === oVariant.key
				})
			})
			
			//Default
			var oDefault = oStore.aVariant.map(function(oVariant){
				if (oVariant.key === oEvent.mParameters.def) {
					oVariant.def = true
				} else {
					oVariant.def = false
				}
			})
			
			//rename
			oStore.aVariant.map(function(oVariant){
				let oNewName = oEvent.mParameters.renamed.find(function(e){
					return e.key === oVariant.key
				})
				if (oNewName) oVariant.name = oNewName.name
			}) 
			
			this._setVariantStorage(oStore)
			
		}
		
		_saveVariant(oEvent){

			var oStore = this._getVariantStorage()

			var aTableData = this._getCurrentState(this.oTable).map(function(e){
				delete e.oColumn
				delete e.sLabel
				return e
			})
			var oVariant = {... oEvent.mParameters}
			oVariant.aTableData = aTableData
			
			if ( !oStore || !oStore.aVariant || !Array.isArray(oStore.aVariant)){
				oStore = { aVariant : [] }
			}
			
			if (oEvent.mParameters.def){
				oStore.aVariant.map(function(e){ e.def = false })
			}
			oStore.aVariant.push( oVariant )
			
			this._setVariantStorage(oStore)
			
		}
		
		getSelectedVariantKey(){
			return this.oVM.getSelectionKey()
		}
		
		_selectVariant(oEvent){
			var oStore = this._getVariantStorage()
			var sKey = oEvent.mParameters.key
			this.applyVariantKey(sKey)
		}
		
		applyVariantKey(sKey){
			var oStore = this._getVariantStorage()
			var oSelected = {}
			if ( oStore && oStore.aVariant && Array.isArray(oStore.aVariant)){
				oSelected = oStore.aVariant.find(function(e){
					return e.key === sKey
				})
			}

			this._applyVariant(oSelected) 
			
		}
		
		_applyVariant(oSelected){
			if (oSelected){
				this.oVM._setVariantText(oSelected.name)
				this.aColumns = oSelected.aTableData
				this.aColumns.map(function(oCol){
					let oColumn = this.oTable.getColumns().find(function(e){
						return e.getId() === oCol.sId
					})
					if (oColumn)  oCol.oColumn = oColumn
				}.bind(this))
				this.aColumns.filter(function(oCol){
					return !!oCol.oColumn
				})
			} else {
				this.aColumns = this.initialState
			}
			
			this._setInitialData( true )
			this._parseP13nState();
			this._applyP13n();
		}
		
	};
});