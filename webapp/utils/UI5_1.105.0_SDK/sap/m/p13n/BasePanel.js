/*!
 * OpenUI5
 * (c) Copyright 2009-2022 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['sap/ui/model/json/JSONModel','sap/m/VBox','sap/ui/core/Control','sap/m/Column','sap/m/Text','sap/ui/model/Filter',"sap/m/Table","sap/m/OverflowToolbar","sap/m/SearchField","sap/m/ToolbarSpacer","sap/m/OverflowToolbarButton","sap/m/OverflowToolbarLayoutData","sap/ui/core/dnd/DragDropInfo"],function(J,V,C,a,T,F,b,O,S,c,d,e,D){"use strict";var B=C.extend("sap.m.p13n.BasePanel",{metadata:{library:"sap.m",interfaces:["sap.m.p13n.IContent"],associations:{},properties:{title:{type:"string"},enableReorder:{type:"boolean",defaultValue:true}},aggregations:{messageStrip:{type:"sap.m.MessageStrip",multiple:false},_content:{type:"sap.ui.core.Control",multiple:false,visibility:"hidden"},_template:{type:"sap.ui.core.Control",multiple:false,visibility:"hidden"}},events:{change:{reason:{type:"string"},item:{type:"sap.m.p13n.Item|sap.m.p13n.Item[]"}}}},renderer:{apiVersion:2,render:function(r,o){r.openStart("div",o);r.style("height","100%");r.openEnd();r.renderControl(o.getAggregation("_content"));r.close("div");}}});B.prototype.P13N_MODEL="$p13n";B.prototype.CHANGE_REASON_ADD="Add";B.prototype.CHANGE_REASON_REMOVE="Remove";B.prototype.CHANGE_REASON_MOVE="Move";B.prototype.CHANGE_REASON_SELECTALL="SelectAll";B.prototype.CHANGE_REASON_DESELECTALL="DeselectAll";B.prototype.CHANGE_REASON_RANGESELECT="RangeSelect";B.prototype.PRESENCE_ATTRIBUTE="visible";B.prototype.init=function(){C.prototype.init.apply(this,arguments);this._oP13nModel=new J({});this._oP13nModel.setSizeLimit(10000);this.setModel(this._oP13nModel,this.P13N_MODEL);this._oListControl=this._createInnerListControl();this._bFocusOnRearrange=true;this._setInnerLayout();this._oListControl.setMultiSelectMode("ClearAll");};B.prototype._setInnerLayout=function(){this.setAggregation("_content",new V({items:[this._oListControl]}));};B.prototype.setP13nData=function(p){this._getP13nModel().setProperty("/items",p);return this;};B.prototype.getP13nData=function(o){var i=this._getP13nModel().getProperty("/items");if(o){i=i.filter(function(I){return I[this.PRESENCE_ATTRIBUTE];}.bind(this));}return i;};B.prototype.setMessageStrip=function(s){if(!s){this.getAggregation("_content").removeItem(this._oMessageStrip);this._oMessageStrip=null;}else{s.addStyleClass("sapUiSmallMargin");if(this._oMessageStrip){this._oMessageStrip.destroy();}this._oMessageStrip=s;this.getAggregation("_content").insertItem(s,0);}return this;};B.prototype.getMessageStrip=function(){return this._oMessageStrip;};B.prototype.setEnableReorder=function(E){var t=this.getAggregation("_template");if(E){this._addHover(t);}else if(t&&t.aDelegates&&t.aDelegates.length>0){t.removeEventDelegate(t.aDelegates[0].oDelegate);}this._getDragDropConfig().setEnabled(E);this._setMoveButtonVisibility(E);this.setProperty("enableReorder",E);return this;};B.prototype._getDragDropConfig=function(){if(!this._oDragDropInfo){this._oDragDropInfo=new D({enabled:false,sourceAggregation:"items",targetAggregation:"items",dropPosition:"Between",drop:[this._onRearrange,this]});}return this._oDragDropInfo;};B.prototype._getMoveTopButton=function(){if(!this._oMoveTopBtn){this._oMoveTopBtn=new d(this.getId()+"-moveTopBtn",{type:"Transparent",tooltip:this._getResourceText("p13n.MOVE_TO_TOP"),icon:"sap-icon://collapse-group",press:[this._onPressButtonMoveToTop,this],visible:false});this.addDependent(this._oMoveTopBtn);}return this._oMoveTopBtn;};B.prototype._getMoveUpButton=function(){if(!this._oMoveUpButton){this._oMoveUpButton=new d(this.getId()+"-moveUpBtn",{type:"Transparent",tooltip:this._getResourceText("p13n.MOVE_UP"),icon:"sap-icon://navigation-up-arrow",press:[this._onPressButtonMoveUp,this],visible:false});this.addDependent(this._oMoveUpButton);}return this._oMoveUpButton;};B.prototype._getMoveDownButton=function(){if(!this._oMoveDownButton){this._oMoveDownButton=new d(this.getId()+"-moveDownpBtn",{type:"Transparent",tooltip:this._getResourceText("p13n.MOVE_DOWN"),icon:"sap-icon://navigation-down-arrow",press:[this._onPressButtonMoveDown,this],visible:false});this.addDependent(this._oMoveDownButton);}return this._oMoveDownButton;};B.prototype._getMoveBottomButton=function(){if(!this._oMoveBottomButton){this._oMoveBottomButton=new d(this.getId()+"-moveBottomBtn",{type:"Transparent",tooltip:this._getResourceText("p13n.MOVE_TO_BOTTOM"),icon:"sap-icon://expand-group",press:[this._onPressButtonMoveToBottom,this],visible:false});this.addDependent(this._oMoveBottomButton);}return this._oMoveBottomButton;};B.prototype._createInnerListControl=function(){return new b(this.getId()+"-innerP13nList",Object.assign(this._getListControlConfig(),{headerToolbar:new O({content:[this._getSearchField(),new c(),this._getMoveTopButton(),this._getMoveUpButton(),this._getMoveDownButton(),this._getMoveBottomButton()]})}));};B.prototype._addHover=function(r){if(r&&r.aDelegates.length<1){r.addEventDelegate({onmouseover:this._hoverHandler.bind(this),onfocusin:this._focusHandler.bind(this)});}};B.prototype._focusHandler=function(E){if(!this.getEnableReorder()){return;}var h=sap.ui.getCore().byId(E.currentTarget.id);this._handleActivated(h);};B.prototype._hoverHandler=function(E){if(this._oSelectedItem&&!this._oSelectedItem.bIsDestroyed){return;}if(!this.getEnableReorder()){return;}var h=sap.ui.getCore().byId(E.currentTarget.id);this._handleActivated(h);};B.prototype._handleActivated=function(h){this._oHoveredItem=h;};B.prototype._getListControlConfig=function(){return{mode:"MultiSelect",rememberSelections:true,itemPress:[this._onItemPressed,this],selectionChange:[this._onSelectionChange,this],sticky:["HeaderToolbar","ColumnHeaders","InfoToolbar"],dragDropConfig:this._getDragDropConfig()};};B.prototype._getSearchField=function(){if(!this._oSearchField){this._oSearchField=new S(this.getId()+"-searchField",{liveChange:[this._onSearchFieldLiveChange,this],width:"100%",layoutData:new e({shrinkable:true,moveToOverflow:true,priority:"High",maxWidth:"16rem"})});}return this._oSearchField;};B.prototype._setTemplate=function(t){t.setType("Active");this.setAggregation("_template",t);if(t){if(this.getEnableReorder()){this._addHover(t);}this._oSelectionBindingInfo=t.getBindingInfo("selected");if(this._oSelectionBindingInfo&&this._oSelectionBindingInfo.parts){this._oSelectionBindingInfo={parts:this._oSelectionBindingInfo.parts};}}this._bindListItems();return this;};B.prototype._setPanelColumns=function(v){var f;if(v instanceof Array){f=v;}else{f=[v];}this._addTableColumns(f);};B.prototype._getP13nModel=function(){return this.getModel(this.P13N_MODEL);};B.prototype._getResourceText=function(t,v){this.oResourceBundle=this.oResourceBundle?this.oResourceBundle:sap.ui.getCore().getLibraryResourceBundle("sap.m");return t?this.oResourceBundle.getText(t,v):this.oResourceBundle;};B.prototype._addTableColumns=function(f){var r=this._oListControl.removeAllColumns();r.forEach(function(R){R.destroy();});f.forEach(function(v){var o;if(typeof v=="string"){o=new a({header:new T({text:v})});}else{o=v;}this._oListControl.addColumn(o);},this);};B.prototype._bindListItems=function(m){var t=this.getAggregation("_template");if(t){this._oListControl.bindItems(Object.assign({path:this.P13N_MODEL+">/items",key:"name",templateShareable:false,template:this.getAggregation("_template").clone()},m));}};B.prototype._onSelectionChange=function(E){var l=E.getParameter("listItems");var s=this._checkSpecialChangeReason(E.getParameter("selectAll"),E.getParameter("listItems"));l.forEach(function(t){this._selectTableItem(t,!!s);},this);if(s){var m=[];l.forEach(function(t){m.push(this._getModelEntry(t));},this);this.fireChange({reason:s,item:m});}if(s===this.CHANGE_REASON_DESELECTALL){this._getMoveTopButton().setEnabled(false);this._getMoveUpButton().setEnabled(false);this._getMoveDownButton().setEnabled(false);this._getMoveBottomButton().setEnabled(false);}};B.prototype._checkSpecialChangeReason=function(s,l){var f;if(s){f=this.CHANGE_REASON_SELECTALL;}else if(!s&&l.length>1&&!l[0].getSelected()){f=this.CHANGE_REASON_DESELECTALL;}else if(l.length>1&&l.length<this._oListControl.getItems().length){f=this.CHANGE_REASON_RANGESELECT;}return f;};B.prototype._onItemPressed=function(E){var t=E.getParameter('listItem');this._oSelectedItem=t;var o=t.getBindingContext(this.P13N_MODEL);if(this.getEnableReorder()&&o&&o.getProperty(this.PRESENCE_ATTRIBUTE)){this._handleActivated(t);this._updateEnableOfMoveButtons(t,true);}};B.prototype._onSearchFieldLiveChange=function(E){this._oListControl.getBinding("items").filter(new F("label","Contains",E.getSource().getValue()));};B.prototype._onPressButtonMoveToTop=function(){this._moveSelectedItem(0);};B.prototype._onPressButtonMoveUp=function(){this._moveSelectedItem("Up");};B.prototype._onPressButtonMoveDown=function(){this._moveSelectedItem("Down");};B.prototype._onPressButtonMoveToBottom=function(){var i=this._oListControl.getItems().length-1;this._moveSelectedItem(i);};B.prototype._setMoveButtonVisibility=function(v){this._getMoveTopButton().setVisible(v);this._getMoveUpButton().setVisible(v);this._getMoveDownButton().setVisible(v);this._getMoveBottomButton().setVisible(v);};B.prototype._filterBySelected=function(s,l){l.getBinding("items").filter(s?new F(this.PRESENCE_ATTRIBUTE,"EQ",true):[]);};B.prototype._selectTableItem=function(t,s){this._updateEnableOfMoveButtons(t,s?false:true);this._oSelectedItem=t;if(!s){var i=this._getP13nModel().getProperty(this._oSelectedItem.getBindingContext(this.P13N_MODEL).sPath);this.fireChange({reason:i[this.PRESENCE_ATTRIBUTE]?this.CHANGE_REASON_ADD:this.CHANGE_REASON_REMOVE,item:i});}};B.prototype._moveSelectedItem=function(n){var s=this._oSelectedItem;var i=this._oListControl.indexOfItem(s);if(i<0){return;}var N=(typeof n=="number")?n:i+(n=="Up"?-1:1);this._moveTableItem(s,N);};B.prototype._getModelEntry=function(i){return i.getBindingContext(this.P13N_MODEL).getObject();};B.prototype._moveTableItem=function(i,n){var I=this._oListControl.getItems();var f=this._getP13nModel().getProperty("/items");var o=f.indexOf(this._getModelEntry(i));n=(n<=0)?0:Math.min(n,I.length-1);n=f.indexOf(this._getModelEntry(I[n]));if(n==o){return;}f.splice(n,0,f.splice(o,1)[0]);this._getP13nModel().setProperty("/items",f);this._oSelectedItem=this._oListControl.getItems()[n];this._updateEnableOfMoveButtons(this._oSelectedItem,this._bFocusOnRearrange);this._handleActivated(this._oSelectedItem);this.fireChange({reason:this.CHANGE_REASON_MOVE,item:this._getModelEntry(i)});};B.prototype._onRearrange=function(E){var o=E.getParameter("draggedControl");var f=E.getParameter("droppedControl");var s=E.getParameter("dropPosition");var i=this._oListControl.indexOfItem(o);var g=this._oListControl.indexOfItem(f);var A=g+(s=="Before"?0:1)+(i<g?-1:0);this._moveTableItem(o,A);};B.prototype._updateEnableOfMoveButtons=function(t,f){var i=this._oListControl.getItems().indexOf(t);var u=true,g=true;if(i==0){u=false;}if(i==this._oListControl.getItems().length-1){g=false;}this._getMoveTopButton().setEnabled(u);this._getMoveUpButton().setEnabled(u);this._getMoveDownButton().setEnabled(g);this._getMoveBottomButton().setEnabled(g);if(f){t.focus();}};B.prototype.exit=function(){C.prototype.exit.apply(this,arguments);this._bFocusOnRearrange=null;this._oHoveredItem=null;this._oSelectionBindingInfo=null;this._oSelectedItem=null;this._oListControl=null;this._oMoveTopBtn=null;this._oMoveUpButton=null;this._oMoveDownButton=null;this._oMoveBottomButton=null;this._oSearchField=null;};return B;});
