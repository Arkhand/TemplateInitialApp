sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Token"
], function(Filter, FilterOperator, Token) {
	"use strict";

	return class FilterUtils {
		
		constructor(oProps) {
			this.sVariantParameter = 'svariant'
			this.oFilterBar = oProps.oFilterBar
			this.aFilterControls = oProps.aFilterControls ? oProps.aFilterControls : []
			this.aFilterControls = this.aFilterControls.filter(function(e){ return !!e})
			
			this.texts = oProps.texts ? oProps.texts : {}
			this.texts.sSubject = this.texts.sSubject ? this.texts.sSubject : ''
			this.texts.sMessage = this.texts.sMessage ? this.texts.sMessage : ''
			this.texts.ShareAsEmail = this.texts.sSubject ? this.texts.sSubject : 'Share As Email'
			this.texts.SaveAsTile = this.texts.sSubject ? this.texts.sSubject : 'Save As Tile'
			
			if (oProps.fGetOtherTilesParamerts ) {
			this.fGetOtherTilesParamerts = oProps.fGetOtherTilesParamerts 
			} else{
				this.fGetOtherTilesParamerts = function(){ return ''}
			}
			if (oProps.fReturnTilesParameters ) {
			this.fReturnTilesParameters = oProps.fReturnTilesParameters 
			} else{
				this.fReturnTilesParameters = function(){}
			}
			
		}
		
		setCustomVariantManage(){
			this.oFilterBar.attachBeforeVariantFetch( this._onBeforeVariantSave.bind(this) )
			this.oFilterBar.attachAfterVariantLoad( this._onAfterVariantLoad.bind(this) )
		}
		
		_onAfterVariantLoad (oEvent) {
			if (!oEvent.getSource()) return;
			var oFilterData = oEvent.getSource().getFilterData();
			var oCustomFieldData = oFilterData["_CUSTOM"];
			oCustomFieldData = JSON.parse( oCustomFieldData )
			if (oCustomFieldData && oCustomFieldData.oFieldValues) {
				Object.keys(oCustomFieldData.oFieldValues).forEach(function(sControlId) {
					let oControl = this.aFilterControls.find(function(e){ return e.getId() === sControlId })
					if (!oControl) return
					this.setVariantDataComponent ( oControl , oCustomFieldData.oFieldValues[sControlId] );
				}.bind(this));
			}
			if (oCustomFieldData && oCustomFieldData.aVisibleFilters) {
				this.setVisibleFilters(this.oFilterBar, oCustomFieldData.aVisibleFilters);
			}
		}
		
		_onBeforeVariantSave(oEvent) {
			if (!oEvent.getSource()) return;
			var aComponents = this._aFiltersControls
			var oCustomData = { 
				_CUSTOM: { 
					oFieldValues: {},
					aVisibleFilters: this.getVisibleFilters(this.oFilterBar),
				} 
			};
			this.aFilterControls.forEach(function(oControl){
				let sControlId = oControl.getId()
				oCustomData._CUSTOM.oFieldValues[sControlId] = this.getVariantDataComponent( oControl );
			}.bind(this));
			oCustomData._CUSTOM = JSON.stringify(oCustomData._CUSTOM) 
			oEvent.getSource().setFilterData( oCustomData );
		}

		setVisibleFilters(oSmartFilter, aVisibleFilters){
			
			var fSetFields =  function(){
				oSmartFilter.getFilterGroupItems().map(function(oFilterControl){
					let bVisible = !!aVisibleFilters.find(function(e){ return e === oFilterControl.getName() })
					oFilterControl.setVisibleInFilterBar(bVisible)	
				}.bind(this))
			}
			
			if (oSmartFilter.isInitialised()) {
				fSetFields.call(this)
			} else {
				oSmartFilter.attachInitialise( fSetFields.bind(this) );
			}
		}
		
		getVisibleFilters(oSmartFilter){
			var aVisibleFilters = []
			oSmartFilter.getFilterGroupItems().map(function(oFilterControl){
				if ( oFilterControl.getVisibleInFilterBar() ) aVisibleFilters.push( oFilterControl.getName() )
			}.bind(this))
			return aVisibleFilters
		}

		getControlFilter( oComponent , sProperty = 'DUMMY'){
			var sControlType = oComponent.getMetadata().getName();
				switch (sControlType) {
					case 'sap.m.Input':
						return this.getInputFilter( oComponent, sProperty);
					case 'sap.m.MultiInput':
						return this.getMultiInputFilter( oComponent, sProperty);
					case 'sap.ui.comp.smartmultiinput.SmartMultiInput':
						return this.getMultiInputFilter( oComponent, sProperty);
					case 'sap.ui.comp.smartmultiinput.MultiComboBox':
						return this.getMultiComboBoxFilter( oComponent, sProperty);
					case 'sap.m.MultiComboBox':
						return this.getMultiComboBoxFilter( oComponent, sProperty); 
					case 'sap.m.DateRangeSelection':
						return this.getDateRangeFilter( oComponent, sProperty);
					case 'sap.m.DatePicker':
						return this.DatePickerFilter( oComponent, sProperty);
					case 'sap.ui.comp.smartfield.SmartField':
						return this.getInputFilter( oComponent, sProperty);
					case 'sap.ui.comp.smartmultiinput.ComboBox':
						return this.getComboBoxFilter( oComponent, sProperty);
					case 'sap.m.ComboBox':
						return this.getComboBoxFilter( oComponent, sProperty); 
					case 'sap.m.DynamicDateRange':
						return this.getDynamicDateRangeFilter(oComponent, sProperty);
				}
		}
		
		getVariantDataComponent(oComponent) {
			if (!oComponent) return
			var sControlType = oComponent.getMetadata().getName();
			switch (sControlType) {
				case 'sap.m.Input':
					return oComponent.getValue();
				case 'sap.m.MultiInput':
					return this.getValuesFromToken(oComponent.getTokens());
				case 'sap.ui.comp.smartmultiinput.SmartMultiInput':
					return oComponent.getRangeData();
				case 'sap.ui.comp.smartmultiinput.MultiComboBox':
					return oComponent.getSelectedKeys();
				case 'sap.m.MultiComboBox':
					return oComponent.getSelectedKeys();
				case 'sap.m.DateRangeSelection':
					return this.getDateRange(oComponent)
				case 'sap.m.DatePicker':
					return oComponent.getDateValue();
				case 'sap.ui.comp.smartfield.SmartField':
					return oComponent.getValue();
				case 'sap.ui.comp.smartmultiinput.ComboBox':
					return oComponent.getSelectedKeys();
				case 'sap.m.ComboBox':
					return oComponent.getSelectedKeys();
				case 'sap.m.DynamicDateRange':
					return oComponent.getValue() ? oComponent.getValue() : null;
			}
		}
		
		setVariantDataComponent(oComponent, data) {
			oComponent.addDelegate({
				onAfterRendering: this.onAfterRenderDataComponent.call(this, oComponent, data)
			});
		}
		
		onAfterRenderDataComponent(oComponent, data){
			if (!oComponent) return
			if (!data && data!=="") return
			var sControlName = oComponent.getMetadata().getName();
			switch (sControlName) {
				case 'sap.m.Input':
					oComponent.setValue(data);
					break
				case 'sap.m.MultiInput':
					oComponent.setTokens(this.getTokensFromValues(data));
					break;
				case 'sap.ui.comp.smartmultiinput.SmartMultiInput':
					oComponent.setRangeData(data);
					break;
				case 'sap.ui.comp.smartmultiinput.MultiComboBox':
					oComponent.setSelectedKeys(data);
					break;
				case 'sap.m.MultiComboBox':
					oComponent.setSelectedKeys(data);
					break;
				case 'sap.m.DateRangeSelection':
					if ( data && data.dateValue && data.secondDateValue ){
						oComponent.setDateValue(new Date(data.dateValue))
						oComponent.setSecondDateValue(new Date(data.secondDateValue))
					} else {
						oComponent.setDateValue( )
						oComponent.setSecondDateValue( )
					}
					break;
				case 'sap.m.DatePicker':
					oComponent.setDateValue(new Date(data));
					break;
				case 'sap.ui.comp.smartfield.SmartField':
					oComponent.setValue(data);
					break
				case 'sap.ui.comp.smartmultiinput.ComboBox':
					oComponent.setSelectedKeys(data);
					break
				case 'sap.m.ComboBox':
					oComponent.setSelectedKeys(data);
					break
				case 'sap.m.DynamicDateRange':
					oComponent.setValue(data)
					break;
			}
		}
		
		DatePickerFilter( oDatePicker , sProperty){
			var aFilters = [];
				if (oDatePicker.getDateValue()) {
					aFilters.push(new Filter({
						path: sProperty,
						operator: FilterOperator.EQ,
						value1: oDatePicker.getDateValue().toLocaleDateString('en-GB').split('/').reverse().join('')
					} )
				);
			}
			return aFilters;
		}
		
		getInputFilter( oSmartField , sProperty){
			var aFilters = [];
				if (oSmartField.getValue()) {
					aFilters.push(new Filter({
						path: sProperty,
						operator: FilterOperator.EQ,
						value1: oSmartField.getValue()
					} )
				);
			}

			return aFilters;
		}
	
		getDateRange( oDateRange ){
			var oData =  {
				dateValue: null,
				secondDateValue: null,
			}
			if (oDateRange.getDateValue() && oDateRange.getSecondDateValue()) {
				oData.dateValue = oDateRange.getDateValue()
				oData.secondDateValue = oDateRange.getSecondDateValue()
			}
			return oData
		}
		
		getDateRangeFilter( oDateRange , sProperty){
			var aFilters = [];
			if (oDateRange.getDateValue() && oDateRange.getSecondDateValue()) {
				aFilters.push(new Filter({
					path: sProperty,
					operator: FilterOperator.BT,
					value1: oDateRange.getDateValue().toLocaleDateString('en-GB').split('/').reverse().join(''),
					value2: oDateRange.getSecondDateValue().toLocaleDateString('en-GB').split('/').reverse().join('')
				}));
			}
			return aFilters;
		}
		
		getDynamicDateRangeFilter(oDynamicDate, sProperty) {
			var aFilters = [];
			var oValue = oDynamicDate.getValue();
			if (oValue) {
				if (oValue.operator === "PARSEERROR") return aFilters
				var aDates = DynamicDateUtil.toDates(oValue);
				if (oValue.operator === "FROM" || oValue.operator === "FROMDATETIME") {
					aFilters.push(new Filter({
						path: sProperty,
						operator: FilterOperator.GT,
						value1: aDates[0].toLocaleDateString('en-GB').split('/').reverse().join(''),
					}));
				} else if (oValue.operator === "TO" || oValue.operator === "TODATETIME") {
					aFilters.push(new Filter({
						path: sProperty,
						operator: FilterOperator.LT,
						value1: aDates[0].toLocaleDateString('en-GB').split('/').reverse().join(''),
					}));
				} else {
					aFilters.push(new Filter({
						path: sProperty,
						operator: FilterOperator.BT,
						value1: aDates[0].oDate.toLocaleDateString('en-GB').split('/').reverse().join(''),
						value2: aDates[1].oDate.toLocaleDateString('en-GB').split('/').reverse().join('')
					}));
				}
			}
			return aFilters
		}
		
		getMultiInputFilter( oMultiInput , sProperty){
			var aFilters = [];
			var aTokens = oMultiInput.getTokens();
			aTokens.forEach(function(oToken){
				let oRange = {... oToken.data().range }
				if (Object.entries(oRange).length){
					if ( oRange.operation === 'Empty' ) {
						oRange.operation = oRange.value1 && oRange.value1.includes('*') ?  FilterOperator.Contains : FilterOperator.EQ
					}
					if ( oRange.operation === FilterOperator.EQ && oRange.exclude === true) {
						oRange.operation = FilterOperator.NE
					}
					aFilters.push(new Filter({
						path: sProperty,
						operator: oRange.operation,
						value1: oRange.value1,
						value2: oRange.value2
					}));
				} else {
					let sValue = oToken.getKey()
					let sOperator = sValue.includes('*') ? FilterOperator.Contains : FilterOperator.EQ
					aFilters.push(new Filter({
						path: sProperty,
						operator: sOperator,
						value1: sValue
					}));
				}
			}.bind(this));
			
			//No tokenizado
			if ( oMultiInput.getValue() && oMultiInput.getValue().length > 0 ){
					let sValue = oMultiInput.getValue()
					let sOperator = sValue.includes('*') ? FilterOperator.Contains : FilterOperator.EQ
					aFilters.push(new Filter( {
						path: sProperty,
						operator: sOperator,
						value1: oMultiInput.getValue()
					}));
			}
			return aFilters;
		}
		
		getMultiComboBoxFilter( MultiComboBox , sProperty){
			var aFilters = [];
			var aSelectedKeys = MultiComboBox.getSelectedKeys();
			aSelectedKeys.forEach(function(oSelectedKeys){
				aFilters.push(new Filter({
					path: sProperty,
					operator: FilterOperator.EQ,
					value1: oSelectedKeys
				}));
			}.bind(this));
			return aFilters;
		}
		
		getComboBoxFilter( ComboBox , sProperty){
			var aFilters = [];
			var SelectedKey = ComboBox.getSelectedKey();
			if(SelectedKey){
				aFilters.push(new Filter({
					path: sProperty,
					operator: FilterOperator.EQ,
					value1: SelectedKey
				}));
			}
			
			return aFilters;
		}
		
		getValuesFromToken(aTokens){
			return aTokens.map(function(oToken){
				return { 
					key: oToken.getKey(),
					text: oToken.getText() 
				}
			})
		}
		
		getTokensFromValues(aValues){
			return aValues.map(function(oValue){
				return new Token({
					key: oValue.key,
					text: oValue.text
				} ) 
			})
		}
		
		getBookMarkButton(){
			return sap.ushell && sap.ushell.ui && sap.ushell.ui.footerbar && sap.ushell.ui.footerbar.AddBookmarkButton ? new sap.ushell.ui.footerbar.AddBookmarkButton : null
		}
		
		addShareAndSave( oSmartFilter = this.oFilterBar ){
			var oMenuButton = new sap.m.MenuButton({
		        icon:"sap-icon://action",
		        menu: new sap.m.Menu({})
		    })
		    oMenuButton.addStyleClass("sapUiTinyMarginEnd")
		    
			var oMenu = oMenuButton.getMenu();
			oMenu.addItem( new sap.m.MenuItem({ 
				text: this.texts.SaveAsTile,
				icon: 'sap-icon://bookmark',
				press:  this.saveVariantAsTile.bind(this) ,
			}) )
			
			oMenu.addItem( new sap.m.MenuItem({ 
				text: this.texts.ShareAsEmail,
				icon: 'sap-icon://email',
				press:  this.shareAsEmail.bind(this) //Remplazar con subject y body
			}) )
			
			oSmartFilter._oToolbar.addContent(oMenuButton)
		}
		
		shareAsEmail() {
			var sURL = window.location.href.split('#')[0]
			
			var sObjectAction = new sap.ui.core.routing.HashChanger().getHash().split(/[?&/]+/).shift()
			
			sURL = sURL + '#' + sObjectAction
			
			var sCurrentVariantId = this.oFilterBar.getVariantManagement().getCurrentVariantId();
			if (sCurrentVariantId) sURL = sURL + '?' + this.sVariantParameter + '=' + sCurrentVariantId
			
			sap.m.URLHelper.triggerEmail(
				null,
				this.texts.sSubject,
				this.texts.sMessage + `\n ${ sURL }`
			);	
		}
		
		saveVariantAsTile(){
			
			if ( !this.getBookMarkButton() ) {
				sap.m.MessageBox.error("Error getting Shell Services");
				return
			}
			
			var oBookMarkButton = this.getBookMarkButton();
			var sCurrentVariantId = this.oFilterBar.getVariantManagement().getCurrentVariantId();
			var sCurrentKey = this.oFilterBar.getVariantManagement().getCurrentVariantKey()
			var oCurrentVariantItem = this.oFilterBar.getVariantManagement().getItemByKey(sCurrentKey)
			var sVariantName = oCurrentVariantItem.getText()
			var sURL = ''
			var appTitle = ''
			
			appTitle = sap.ui.getCore().byId('shellAppTitle');
			if(appTitle){
				appTitle = appTitle.getText();
			}
			
			if (sCurrentVariantId || this.fGetOtherTilesParamerts() ) {
				var sObjectAction = new sap.ui.core.routing.HashChanger().getHash().split(/[?&/]+/).shift()
				sURL = '#' + sObjectAction + '?' + this.sVariantParameter + '=' + sCurrentVariantId + this.fGetOtherTilesParamerts()
				oBookMarkButton.setCustomUrl(sURL)
				oBookMarkButton.setSubtitle('Variant: ' + sVariantName)
			} else {
				 oBookMarkButton.setCustomUrl()
				 oBookMarkButton.setSubtitle()
			}
		
			oBookMarkButton.setTitle(appTitle)
			oBookMarkButton.firePress()
	
		}
		
		setVariantFromTile(){
			
			var urlParams = new URLSearchParams(window.location.search);
			var sVariantIdToApply = urlParams.get( this.sVariantParameter )
			 
			 var sParams = window.location.href.split('?').pop()
			 if (!sParams) return
			 
			 this.fReturnTilesParameters(sParams)
			 
			 var sVariantIdToApply = new URLSearchParams(sParams).get('svariant')
			 if (!sVariantIdToApply) return
			
			var fApplyVariant = function (evt){
				if (!this.oFilterBar.getVariantManagement()._getVariantById(sVariantIdToApply)){
					// sap.m.MessageBox.error("Selected variant does not exists");
					return;
				}
				this.oFilterBar.getSmartVariant().setCurrentVariantId(sVariantIdToApply)
			}

			if (this.oFilterBar.isInitialised()){
			  this.fApplyVariant();
			} else {
			  this.oFilterBar.attachInitialise(fApplyVariant.bind(this));
			}

		}
		
		// setVariantFromTile(){
			
		// 	var oSmartFilter = this.oFilterBar
			
		// 	var sParams = window.location.href.split('?').pop()
		// 	if (!sParams) return
			 
		// 	var sVariantIdToApply = new URLSearchParams(sParams).get('svariant')
		// 	if (!sVariantIdToApply) return
			
		// 	var bApplyExecuted = false
		// 	var fGetVariantManagment = function (aVariants){
		// 		if (bApplyExecuted) return
		// 		bApplyExecuted = true
		// 		if ( !aVariants.find(function(e){return e.key === sVariantIdToApply}) ){
		// 			// sap.m.MessageBox.error("Selected variant does not exists");
		// 			return;
		// 		}
		// 		oSmartFilter.getSmartVariant().setCurrentVariantId(sVariantIdToApply)
		// 	}

		// 	var fAfterRenderVariant = function (evt){
		// 		oSmartFilter.getVariantManagement().getVariantsInfo(fGetVariantManagment)
		// 	}
			
		// 	var fAfterInitialiceSmartFilterBar = function(){
		// 		oSmartFilter.getVariantManagement().addDelegate({
		// 			onAfterRendering: fAfterRenderVariant.bind(this)
		// 		});
		// 	}
			
		// 	if (oSmartFilter.isInitialised()){
		// 	  fAfterInitialiceSmartFilterBar();
		// 	} else {
		// 	  oSmartFilter.attachInitialise(fAfterInitialiceSmartFilterBar.bind(this));
		// 	}
		// }
		
		
	};
});