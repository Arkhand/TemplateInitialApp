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

sap.ui.define([
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/type/String',
    'sap/m/SearchField',
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog"
], function (
    JSONModel,
    TypeString,
    SearchField,
    ValueHelpDialog
) {
    "use strict";


    return class ValueHelp {

        constructor(oProps) {
            if (!oProps.oControl) throw "Complete oControl"
            if (!oProps.oModel) throw "Complete oModel"
            if (!oProps.sEntity) throw "Complete sEntity"
            if (!oProps.aCols) throw "Complete aCols"

            this.oControl = oProps.oControl
            this.oModel = oProps.oModel
            this.sEntity = oProps.sEntity
            this.aFitlers = oProps.aCols.filter(function (oCol) { return !!oCol.filtrable })
            this.aCols = oProps.aCols.filter(function (oCol) { return !oCol.hideColumn })
            this.title = oProps.title ? oProps.title : ''
            this.basicSearchText = oProps.basicSearchText ? oProps.basicSearchText : ''
            this.basicSearch = oProps.basicSearch ? oProps.basicSearch : false
            this.supportRanges = !!oProps.supportRanges
            this.supportRangesOnly = !!oProps.supportRangesOnly
            this.aAlwaysFilters = oProps.aFilters
            this.waitGoButton = !!oProps.waitGoButton
            this.aCols.forEach(function (oCol) {
                if (oCol.key) {
                    this.key = oCol.template
                    this.descriptionKey = oCol.descriptionKey ? oCol.descriptionKey : oCol.template
                    this.title = oCol.label
                    this.maxLengthKey = oCol.maxLength
                }
            }.bind(this))

            this._determineMultiSelect()

            this.supportRanges = !!(oProps.supportRanges && this.supportMultiselect)
            this.supportRangesOnly = !!(oProps.supportRangesOnly && this.supportMultiselect)

            this._oValueHelpDialog = new ValueHelpDialog({
                maxConditions: '1', //Se setea una sola condicion para Ranges ( En BackEnd hay probelmas al recibir mas de una condicion Exclude )
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
                onAfterRendering: function () {
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

            this._oValueHelpDialog.getTableAsync().then(this._prepareTable.bind(this));

        }

        open() {
            this._oValueHelpDialog.open();
        }

        afterSelect(fCallBack) {
            this.afterSelectCallback = fCallBack;
        }

        afterSet(fCallBack) {
            this.afterSet = fCallBack;
        }

        _onValueHelpCancelPress() {
            this._oValueHelpDialog.close();
        }

        _onValueHelpAfterClose() {
            this._oValueHelpDialog.destroy();
        }

        _determineMultiSelect() {
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

        _buildInputs() {
            this.aFilterInputs = []
            this.aFilterGroupItem = []

            this.aFitlers.forEach(function (oCol) {

                let oFilterInput = new sap.m.Input({
                    name: oCol.template,
                    value: oCol.defaultFilterValue ? oCol.defaultFilterValue : '',
                    showValueHelp: !!oCol.valueHelpRequest,
                    valueHelpRequest: oCol.valueHelpRequest ? oCol.valueHelpRequest : ''
                })

                oFilterInput.FilterOperator = oCol.FilterOperator ? oCol.FilterOperator : sap.ui.model.FilterOperator.Contains

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

        _mobileColumnsTemplate() {
            let aCells = this.aCols.map(function (column) {
                return new sap.m.Label({
                    text: {
                        path: column.template,
                        formatter: column.formatter
                    }
                })
            })
            return new sap.m.ColumnListItem({ cells: aCells })
        }

        _prepareTable(oTable) {
            this.oTable = oTable

            if (oTable.bindRows) { //sap.ui.table.Table
                this.aCols.map(function (column) {
                    oTable.addColumn(new sap.ui.table.Column({
                        label: column.label,
                        template: new sap.m.Text({
                            text: {
                                path: column.template,
                                formatter: column.formatter
                            }
                        })
                    }))
                })
            }

            if (oTable.bindItems) { //sap.m.Table 
                this.oTable = oTable
                this.oColModel = new JSONModel({ cols: this.aCols });
                oTable.setModel(this.oColModel, "columns");

            }

            if (!this.waitGoButton) {
                this._onFilterBarSearch();
            }
        }

        _bindTable(oTable, oFilter) {
            let oFilterToApply = oFilter?.aFilters?.length ? oFilter : null
            oTable.setModel(this.oModel);

            if (oTable.bindRows) { //sap.ui.table.Table
                oTable.bindAggregation("rows", {
                    path: this.sEntity,
                    filters: oFilterToApply,
                    parameters: { countMode: sap.ui.model.odata.CountMode.None }
                });
            }

            if (oTable.bindItems) { //sap.m.Table                 
                oTable.bindAggregation(
                    "items",
                    this.sEntity,
                    this._mobileColumnsTemplate.bind(this),
                    null,
                    oFilterToApply
                );
            }

            this.bTableBinded = true;
            return true
        }

        _onValueHelpOkPress(oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            this.selectedTokens = aTokens;

            if (this.afterSelectCallback) {
                let aSelectedData = []
                let aKeys = []
                if (this.oTable.getBinding("rows")) {
                    try {
                        aKeys = this.oTable.getSelectedIndices().map(function (iIndex) { return this.oTable.getBinding("rows").aKeys[iIndex] }.bind(this))
                        aSelectedData = aKeys.map(function (sPath) { return { ...this.oModel.getProperty("/" + sPath) } }.bind(this))
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

            if (this.afterSelectCallback) this.afterSelectCallback(aTokens, aSelectedData)
            this._oValueHelpDialog.close();
            this.afterSet();
        }



        _onFilterBarSearch() {

            var sSearchQuery = this._oBasicSearchField.getValue()
            var aFilters = this.aFilterInputs.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new sap.ui.model.Filter({
                        path: oControl.getName(),
                        operator: oControl.FilterOperator,
                        value1: oControl.getValue()
                    }));
                }
                return aResult;
            }, []);

            var aDefaultsFilters = this.aCols.filter(oCol => !oCol.filtrable && !!oCol.defaultFilterValue)
            aDefaultsFilters.map(function (oCol) {
                aFilters.push(new sap.ui.model.Filter({
                    path: oCol.template,
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: oCol.defaultFilterValue
                }));
            })

            if (sSearchQuery) {
                let aQueryFilters = []
                this.aCols.forEach(function (oCol) {
                    aQueryFilters.push(new sap.ui.model.Filter({
                        path: oCol.template,
                        operator: sap.ui.model.FilterOperator.Contains,
                        value1: sSearchQuery
                    }))
                })
                aFilters.push(new sap.ui.model.Filter({
                    filters: aQueryFilters,
                    and: false
                }));
            }

            if (this.aAlwaysFilters) {
                aFilters = aFilters.concat(this.aAlwaysFilters)
            }

            this._filterTable(new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            }));
        }

        _filterTable(oFilter) {
            var oValueHelpDialog = this._oValueHelpDialog;
            oValueHelpDialog.getTableAsync().then(function (oTable) {
                this._bindTable(oTable, oFilter)
                oValueHelpDialog.update();
                oTable.updateBindings(true)
            }.bind(this));
        }

    };
}); 