sap.ui.define([
	"./UI5_1.105.0_SDK/sap/m/p13n/Popup-dbg",
	"./UI5_1.105.0_SDK/sap/m/p13n/SelectionPanel-dbg",
	"./UI5_1.105.0_SDK/sap/m/p13n/SortPanel-dbg",
	"./UI5_1.105.0_SDK/sap/m/p13n/GroupPanel-dbg",
	"sap/ui/comp/util/FormatUtil"
], function (
	p13nPopup,
	SelectionPanel,
	SortPanel,
	GroupPanel,
	FormatUtil
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
		bFiltrable --> Dialogo de filtros
		oVariantManagement --> Control de manejo de variantes sap.ui.comp.variants.VariantManagement
		
		-- Metodos --
		Open --> Abre el dialogo de personalizacion
		FilterTable --> Bindea filtros a la tabla 
		clearFilters --> borra todos los filtros bindeados a la tabla
		getSelectedVariantKey --> obtiene el Key de la variante actual
		applyVariantKey: aplica la variante segun la key
		customPannel: panel extra customizable
		
		customDataSaveCallback --> Callback de datos personalizados de guardado en variante
		customDataLoadCallback --> Callback de datos personalizados cargados en variante
		
		*/
		
		constructor(oProps) {
			
			if (!oProps.oTable) throw "Complete oTable"
			if (!oProps.bSelectable && !oProps.bSorteable && oProps.bGroupable) throw "Select a personalisation option"

			this.bSelectable = !!oProps.bSelectable
			this.bSorteable = !!oProps.bSorteable
			this.bGroupable = !!oProps.bGroupable
			this.bFiltrable = !!oProps.bFiltrable
			
			this.customDataSaveCallback = oProps.customDataSaveCallback
			this.customDataLoadCallback = oProps.customDataLoadCallback
			
			this.customPannel = oProps.customPannel

			this.oTable = oProps.oTable
			this.oOpenBy = oProps.oOpenBy ? oProps.oOpenBy : {}
			this.oVM = oProps.oVariantManagement
			this.sStoreID = this.oVM ? this.oVM.getId() : null
			
			this.oPopup = this._getP13nDialog()
			this.oPopupFilter = this._getP13nDialog()
			this._createPanels()
			if (this.bSelectable) this.oPopup.addPanel(this.oSelectionPanel)
			if (this.bSorteable) this.oPopup.addPanel(this.oSortPanel)
			if (this.bGroupable) this.oPopup.addPanel(this.oGroupPanel)	
			if (this.bFiltrable) this.oPopup.addPanel(this.oFilterPanel)
			if (this.customPannel) this.oPopup.addPanel(this.customPannel)
			
			this.oFilterPanel2 = this.getNewFilterPannel()
			this.oPopupFilter.addPanel(this.oFilterPanel2)
			
			

			this.aComplexFilters = []
			this.aMultiFilter = []

			this.oTable.addDelegate({
				onAfterRendering: this._initAfterRenderTable.call(this)
			});
			
			if (this.bFiltrable){
				this.oTable.getColumns().map(oColumn=>{oColumn.attachColumnMenuOpen(this.onColumnMenuOpen.bind(this))})
			}
		}
		
		onColumnMenuOpen(oEvent){
			oEvent.preventDefault();
			this._pushedColumn = oEvent.getSource()
			if ( !this._pushedColumn.getSortProperty() && !this._pushedColumn.getFilterProperty() ) return
			
			if (!this._oColumnPopover) {
				
				var oContent = new sap.m.VBox()
				oContent.addStyleClass('sapUiTinyMargin')
				
				this._oColumnPopover = new sap.m.Popover({
					content: oContent,
					placement: sap.m.PlacementType.VerticalPreferredBottom,
					showArrow: false,
					showHeader: false,
					contentWidth: '14rem'
				});
				
				this._sortSection = new sap.m.VBox()
				this._sortSection.addItem(
					new sap.m.Button({
					text: 'Sort',
					icon: 'sap-icon://sort',
					width: '100%',
					press: function(){
						this._onColumnSort(this._pushedColumn)
						this._oColumnPopover.close()
					}.bind(this)
				}))
			
			
				this._filterSection = new sap.m.VBox()
				this._filterMultiInput = new sap.m.MultiInput({
						valueHelpRequest: function(){
							this.open(false, true)
						}.bind(this),
						tokenUpdate: function(oEvent){
							this._tokenUpdateFilter(oEvent, this._pushedColumn)
						}.bind(this),
						valueHelpIconSrc: 'sap-icon://add-filter'
					}) 
				this._filterMultiInput.addValidator(function(oEvent){
					this._oColumnPopover.close()
					return this.filterMultiInputValidator(oEvent, this._pushedColumn)
				}.bind(this));
				
				this._filterSection.addItem( new sap.m.Label({text: 'Filters:'}) )
				
				this._filterSection.addItem(this._filterMultiInput)
				
				oContent.addItem(this._sortSection)
				oContent.addItem(this._filterSection)
			}
			
			this._sortSection.setVisible( !!this._pushedColumn.getSortProperty() )
			this._filterSection.setVisible( !!this._pushedColumn.getFilterProperty() )
			this._initMultiInputTokens(this._filterMultiInput, this._pushedColumn)
			
			this._oColumnPopover.openBy(this._pushedColumn)
			
		}
		
		filterMultiInputValidator(oEvent, oColumn){
			var sStringToSearch = oEvent.text;
			var oToken = new sap.m.Token({
            	text: FormatUtil.getFormattedRangeText(sap.ui.model.FilterOperator.Contains, sStringToSearch, '', false),
            	key: oColumn.getFilterProperty()
        	});
        	oToken.oFilter = new sap.ui.model.Filter( oColumn.getFilterProperty(), sap.ui.model.FilterOperator.Contains, sStringToSearch)
        	return oToken
		}
		
		_tokenUpdateFilter(oEvent, oColumn){
			var aRemovedTokens = oEvent.getParameter("removedTokens")
			var aTokens = oEvent.getSource().getTokens()
			
			aTokens = aTokens.filter(item => !aRemovedTokens.includes(item) )
			
			this.aComplexFilters = this.aComplexFilters.filter(oFilter=>oFilter.sPath !== this._pushedColumn.getFilterProperty() )
			this.aComplexFilters = this.aComplexFilters.concat(aTokens.map(oToken=>{
				if (oToken.oFilter) return oToken.oFilter
			}))
			
			this.applyFilters()

		}
		
		_initMultiInputTokens(oMultiInput, oColumn){
			oMultiInput.removeAllTokens()
			this.aComplexFilters.forEach(oFilter=>{
				if (oFilter.sPath !== oColumn.getSortProperty()) return
				var oToken = new sap.m.Token({
		             text: FormatUtil.getFormattedRangeText(oFilter.sOperator, oFilter.oValue1, oFilter.oValue2, oFilter.bExclude)
		         });
		         oToken.oFilter = oFilter

		         oMultiInput.addToken(oToken);

			})
		}
		
		_onColumnSort(oColumn){
			var sSortOrder = oColumn.getSortOrder()
			if (sSortOrder && oColumn.getSorted()) {
				sSortOrder = (sSortOrder === sap.ui.table.SortOrder.Ascending) ? sap.ui.table.SortOrder.Descending : sap.ui.table.SortOrder.Ascending
			} else {
				sSortOrder = sap.ui.table.SortOrder.Ascending
			}
			
			this.oTable.getColumns().map(function (oColumn) {
				oColumn.setSorted(false)
			}.bind(this))
			
			this.oTable.sort(
				oColumn,
				sSortOrder
			)
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

		open(bAllPanels = true, bFilterPanel = false) {
			if (this.bTableAlrredyRender) {
				this.aColumns = this._getCurrentState(this.oTable)

				if (bAllPanels){
					this.openedFilterPannel = this.oFilterPanel
					this._setInitialData()
					this.oPopup.open(this.oOpenBy)
				} else {
					this.openedFilterPannel = this.oFilterPanel2
					this._initFilterPanel(this.oFilterPanel2)
					this.oPopupFilter.open(this.oOpenBy)
				}

			}
		}
		
		_afterClose(oEvent) {
			var sReason = oEvent.getParameter("reason");
			if (sReason === 'Ok') {
				this._parseP13nState();
				this._applyP13n();
			}
			// this._removePanels(oEvent.getSource())
			// if (this.oPopup) this.oPopup.destroy()
			// if (this.oFilterPanel) this.oFilterPanel.destroy()
			// if (this.oGroupPanel) this.oGroupPanel.destroy()
			// if (this.oSortPanel) this.oSortPanel.destroy()
			// if (this.oSelectionPanel) this.oSelectionPanel.destroy()
		}
		

		filter( sStringToSearch, aKeysToFilter, sFilterOperator = sap.ui.model.FilterOperator.Contains){
			if ( !this.oTable.getBinding() ) return
			this.aMultiFilter = []
			
			this.bAnd = false
			if ( sFilterOperator.startsWith('N') ) this.bAnd
			
			if (sStringToSearch){
				this.aMultiFilter = aKeysToFilter.map( function(sKey){
					return new sap.ui.model.Filter( sKey, sFilterOperator, sStringToSearch)
				})
			}
			
			this.applyFilters()
		}
		
		applyFilters(){
			
			if (!this.oTable.getBinding()) return
			
			this.oTable.getBinding().filter( null , "Application" )
			this.oTable.getBinding().filter( null , "Control" )
			
			var sNotControlString = 'NOT__'
			var oFieldFilters = {}
			this.aComplexFilters.map( oFilter=>{
				let sObjectKet = oFilter.sPath
				if (oFilter.sOperator.startsWith('N')) sObjectKet = sNotControlString + sObjectKet
				if (!oFieldFilters[sObjectKet]) oFieldFilters[sObjectKet] = []
				oFieldFilters[sObjectKet].push(oFilter)
			})
			
			var aFilters = Object.keys(oFieldFilters).map(sField=>{
				let bAnd = false
				if (sField.startsWith(sNotControlString)) bAnd = true
				return new sap.ui.model.Filter({ filters: oFieldFilters[sField], and: bAnd }) 
			})
			
			if (this.aMultiFilter.length > 0){ 
				this.oTable.getBinding().filter(  new sap.ui.model.Filter({ 
					filters: new sap.ui.model.Filter({ filters: aFilters, and: true }) , 
					and: this.bAnd }) , "Application" )
			}
			
			if (aFilters.length > 0){ 
				this.oTable.getBinding().filter(  new sap.ui.model.Filter({ filters: aFilters, and: true }) , "Control" )
			}
			
		}
		
		_clearComplexFilter(){
			if ( !this.oTable.getBinding() ) return
			this.oTable.getBinding().filter(  null , "Control" )
			
		}
		
		clearFilters(){
			if ( !this.oTable.getBinding() ) return
			this.oTable.getBinding().filter(  null , "Application" )
			this.oTable.getBinding().filter(  null , "Control" )
			this.aComplexFilters = []
			this.aMultiFilter = []
		}

		_reset() {
			this.aColumns = this.initialState
			this._setInitialData()
		}

		
		_getCurrentState(oTable, bKeepEmptyLabels) {
			var aColums = oTable.getColumns()
			var aColInternal = aColums.map(function (oColumn) {
				return {
					sId: oColumn.getId(),
					sLabel: oColumn.getName(),
					oColumn: oColumn,
					sSortProperty: oColumn.getSortProperty(),
					bVisible: oColumn.getVisible(),
					bDescending: oColumn.getSortOrder() === sap.ui.table.SortOrder.Descending,
					sWidth: oColumn.getWidth()
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
		
		_getP13nDialog(){
			// var oPopup = new sap.m.p13n.Popup({
			return new p13nPopup({
				title: "My Custom View Settings",
				close: this._afterClose.bind(this),
				reset: this._reset.bind(this),
				warningText: "Reset changes?"
			})
			
		}

		_createPanels() {
			if (this.bSelectable) {
				this.oSelectionPanel = new SelectionPanel({
					title: "Columns",
					enableCount:true,
					showHeader:true,
					enableReorder:false
				})
			}

			if (this.bSorteable) {
				this.oSortPanel = new SortPanel({
					icon: 'sap-icon://sort',
					title: "Sort"
				})
				
			}

			if (this.bGroupable) {
				this.oGroupPanel = new GroupPanel({
					title: "Group"
				})
			}
			
			if (this.bFiltrable) {
				this.oFilterPanel = this.getNewFilterPannel()
			}

		}
		
		getNewFilterPannel(){
			let oFilterPannel = new sap.m.P13nFilterPanel({
				title: "Filter"
			})
			
			var aIncludeOperations = oFilterPannel.getIncludeOperations();
			aIncludeOperations.push(sap.m.P13nConditionOperation.Contains);
			aIncludeOperations.push(sap.m.P13nConditionOperation.NotContains);
			aIncludeOperations.sort()
			oFilterPannel.setIncludeOperations(aIncludeOperations);
			oFilterPannel.setExcludeOperations([
				sap.ui.model.FilterOperator.Contains,
				sap.ui.model.FilterOperator.EndsWith,
				sap.ui.model.FilterOperator.StartsWith,
				sap.ui.model.FilterOperator.EQ,
				sap.ui.model.FilterOperator.BT
			]);
			return oFilterPannel
		}

		_removePanels(oPopup){
			//El metodo del control esta bugeado
			var aPanels = oPopup.getPanels()
			for (var i = aPanels.length; i >= 1; i--) {
			  oPopup.removePanel(aPanels[i-1])
			}
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
			
			if (this.bFiltrable) {
				this._initFilterPanel(this.oFilterPanel)
			}

		}
		
		_initFilterPanel(oFilterPanel){
			let bIgnoreEmptyLabel = false
			
			oFilterPanel.removeAllItems()
			var aFiltrableColums = []
			
			this.aColumns.map(function (oColumns) {
				let sLabel = oColumns.oColumn ? oColumns.oColumn.getName() : ''
				if ( ( sLabel || bIgnoreEmptyLabel ) && oColumns.oColumn.getFilterProperty() ) {
					aFiltrableColums.push({
						columnKey: oColumns.oColumn.getFilterProperty(),
						text: sLabel
					})
				}
			}.bind(this));
			
			aFiltrableColums.sort(function(a,b){
				if (a.text > b.text) return 1
				if (a.text < b.text) return -1
				return 0
			})
			aFiltrableColums.map(oCol=>oFilterPanel.addItem(new sap.m.P13nItem(oCol)))

			oFilterPanel.removeAllFilterItems()
			
			this.aComplexFilters.sort(function(a,b){
				if (a.sPath > b.sPath) return 1
				if (a.sPath < b.sPath) return -1
				return 0
			})
			this.aComplexFilters.forEach(oFilter=>{
				let sOperator = oFilter.sOperator
				let bExclude = false
				if (sOperator.startsWith('N')) {
					sOperator = this._getInversFilterOperation(sOperator)
					bExclude = true
				}
				oFilterPanel.addFilterItem(new sap.m.P13nFilterItem({
					columnKey: oFilter.sPath,
					operation: sOperator,
					value1: oFilter.oValue1,
					value2: oFilter.oValue2,
					exclude: bExclude
				}))
			})
			// 
		}

		_setInitialSelection( bIgnoreEmptyLabel) {
			this.aInitialSelection = [];
			this.originalColumnsSort = [];
			this.aColumns.map(function (oColumns) {
				let sLabel = oColumns.oColumn ? oColumns.oColumn.getName() : ''
				if ( sLabel || bIgnoreEmptyLabel ) {
					this.aInitialSelection.push({
						visible: oColumns.bVisible,
						name: oColumns.sId,
						label: sLabel,
					});
					this.originalColumnsSort.push({
						visible: oColumns.bVisible,
						name: oColumns.sId,
						label: sLabel,
					});
				}
			}.bind(this));
			
			this.aInitialSelection.sort(function (a, b) {
				if (a.label < b.label) return -1
				if (a.label > b.label) return 1
				return 0
			});
		}

		_setInitialSort( bIgnoreEmptyLabel ) {

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
			
			var aSortInitial = aSortInitial.sort(function (a, b) {
				if (a.label < b.label) return -1
				if (a.label > b.label) return 1
				return 0
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

			this.originalColumnsSort.map(function (colSortOrig) {
				var oColP13n = this.oP13nState.columns.find(function (oColP13n) {
					return oColP13n.name === colSortOrig.name
				})
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
						oColP13n.descending ? sap.ui.table.SortOrder.Descending : sap.ui.table.SortOrder.Ascending,
						iIndex + 1 === iCantSortedCols ? true : false
					)
				}
			}.bind(this))
			
			if (this.openedFilterPannel){
				this._clearComplexFilter()
				
				this.aComplexFilters = []
				this.openedFilterPannel.getConditions().map( oCondition=>{
					let sOperator = oCondition.operation
					if (oCondition.exclude){
						sOperator = this._getInversFilterOperation(sOperator)
					}
					let oFilter = new sap.ui.model.Filter( oCondition.keyField, sOperator, oCondition.value1, oCondition.value2 )
					this.aComplexFilters.push(oFilter)
				})
				
				this.applyFilters()
				
			}
			
		}
		
		_getInversFilterOperation(sOperator){
			switch (sOperator){
				case sap.ui.model.FilterOperator.Contains:
					return sap.ui.model.FilterOperator.NotContains
				case sap.ui.model.FilterOperator.EndsWith:
					return sap.ui.model.FilterOperator.NotEndsWith
				case sap.ui.model.FilterOperator.StartsWith:
					return sap.ui.model.FilterOperator.NotStartsWith
				case sap.ui.model.FilterOperator.EQ:
					return sap.ui.model.FilterOperator.NE
				case sap.ui.model.FilterOperator.BT:
					return sap.ui.model.FilterOperator.NB
					
				case sap.ui.model.FilterOperator.NotContains:
					return sap.ui.model.FilterOperator.Contains
				case sap.ui.model.FilterOperator.NotEndsWith:
					return sap.ui.model.FilterOperator.EndsWith
				case sap.ui.model.FilterOperator.NotStartsWith:
					return sap.ui.model.FilterOperator.StartsWith
				case sap.ui.model.FilterOperator.NE:
					return sap.ui.model.FilterOperator.EQ
				case sap.ui.model.FilterOperator.NB:
					return sap.ui.model.FilterOperator.BT
			}
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
				// this._createPanels()
				this._applyVariant(oDefaul)
			}
			
			this.oVM.attachManage( this._mangeVariant.bind(this) )
			this.oVM.attachSave( this._saveVariant.bind(this) )
			this.oVM.attachSelect( this._selectVariant.bind(this) )
		}
		
		_mangeVariant(oEvent){
		
			var oStore = this._getVariantStorage()

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
			
			debugger             
			if (this.customDataSaveCallback){
				oVariant.customData = this.customDataSaveCallback()
			}
				
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
					if (!oColumn) return
					
					oCol.oColumn = oColumn
					if (oCol.sWidth) oColumn.setWidth(oCol.sWidth)
					
				}.bind(this))
				this.aColumns.filter(function(oCol){
					return !!oCol.oColumn
				})
				if (oSelected.customData && this.customDataLoadCallback){
					this.customDataLoadCallback(oSelected.customData)
				}
			} else {
				this.aColumns = this.initialState
			}
			
			this._setInitialData( true )
			this._parseP13nState();
			this._applyP13n();
		}
		
	};
});