sap.ui.define([

], function (

) {
	"use strict";

	return {

		abapDateToDate: function (sDate) {
			if (!sDate || sDate.length < 8) return sDate;
			var dDate = new Date(sDate.substr(0, 4), sDate.substr(4, 2) - 1, sDate.substr(6, 2));
			return dDate
		},

		leadingZeros: function (number) {
			if (isNaN(number)) { //Si no es parseable lo devuelvo como esta
				return number;
			} else {
				return parseInt(number, 10);
			}
		},

		formatDate: function (sDate) {
			if (!sDate || sDate.length < 8) return sDate
			var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "MMM d, yyyy"
			});
			var oNow = new Date(sDate.substring(0, 4), sDate.substring(4, 6) - 1, sDate.substring(6, 8));
			return oDateFormat.format(oNow);
		},

	};

});