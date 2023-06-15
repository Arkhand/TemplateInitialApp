sap.ui.define([ ], function ( ) {
	"use strict";

	return class ODataPromise {
		constructor(model) {
				this.model = model;
		}

		create(path, data, parameters) {
			return new Promise((resolve, reject) => {
				let completeParameters = this._addReturns(parameters, resolve, reject);

				this.model.create(path, data, completeParameters);
			});
		}

		read(path, parameters) {
			return new Promise((resolve, reject) => {
				this.model.read(path, this._addReturns(parameters, resolve, reject));
			});
		}

		remove(path, parameters) {
			return new Promise((resolve, reject) => {
				this.model.remove(path, this._addReturns(parameters, resolve, reject));
			});
		}

		update(path, data, parameters) {
			return new Promise((resolve, reject) => {
				this.model.update(path, data, this._addReturns(parameters, resolve, reject));
			});
		}

		_addReturns(receivedParameters, resolve, reject) {
			let parameters = Object.assign({}, receivedParameters);

			parameters.success = data => resolve(data);
			parameters.error = error => reject(error);
			return parameters;
		}
	};
});