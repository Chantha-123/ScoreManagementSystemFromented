(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewLoanApplicationReference: function (scope, routeParams, resourceFactory, location, dateFilter) {

            scope.loanApplicationReferenceId = routeParams.loanApplicationReferenceId;
            var curIndex = 0;
            scope.isCBCheckReq = false;
            scope.riskCaluculation = {};
            scope.riskCheckDone = false;
            scope.showRiskDetail =false;

            resourceFactory.loanApplicationReferencesResource.getByLoanAppId({loanApplicationReferenceId: scope.loanApplicationReferenceId}, function (data) {
                scope.formData = data;
                if(scope.formData.loanProductId && scope.formData.status.id < 300){
                    resourceFactory.loanProductResource.getCreditbureauLoanProducts({loanProductId: scope.formData.loanProductId,associations: 'creditBureaus'},function (creditbureauLoanProduct) {
                        scope.creditbureauLoanProduct = creditbureauLoanProduct;
                        if(scope.creditbureauLoanProduct.isActive == true){
                            scope.isCBCheckReq = true;
                        }
                    });
                }
                scope.loanProductChange(scope.formData.loanProductId);
                resourceFactory.loanApplicationReferencesResource.getChargesByLoanAppId({
                    loanApplicationReferenceId: scope.loanApplicationReferenceId,
                    command: 'loanapplicationcharges'
                }, function (loanAppChargeData) {
                    scope.loanAppChargeData = loanAppChargeData;
                    for(var i = 0; i < scope.loanAppChargeData.length; i++){
                        if(scope.loanAppChargeData[i].chargeId){
                            scope.constructExistingCharges(i,scope.loanAppChargeData[i].chargeId);
                        }else{
                            curIndex++;
                        }
                    }
                });
                if(scope.formData.status.id > 200){
                    resourceFactory.loanApplicationReferencesResource.getByLoanAppId({
                        loanApplicationReferenceId: scope.loanApplicationReferenceId,
                        command: 'approveddata'
                    }, function (data) {
                        scope.formData.approvedData = {};
                        scope.formData.approvedData = data;
                    });
                };
            });

            function fetchRiskCalculation (){
                resourceFactory.riskCalculation.getForLoanAppId({loanApplicationReferenceId: scope.loanApplicationReferenceId},
                    function (data) {
                        scope.riskCalculation = data;
                        if(scope.riskCalculation !== undefined && scope.riskCalculation.status !== undefined){
                            scope.riskCheckDone = false;
                        }
                    }
                );
            }
            fetchRiskCalculation();

            scope.doRiskCheck = function () {
                resourceFactory.riskCalculation.save({loanApplicationReferenceId: scope.loanApplicationReferenceId},{}, function (response) {
                    fetchRiskCalculation();
                });
            }

            scope.triggerRiskDetail = function(){
                if(scope.showRiskDetail){
                    scope.showRiskDetail = false;
                }else{
                    scope.showRiskDetail = true;
                }
            }

            scope.loanProductChange = function (loanProductId) {

                scope.inparams = {resourceType: 'template', activeOnly: 'true'};
                if (scope.formData.clientId && scope.formData.groupId) {
                    scope.inparams.templateType = 'jlg';
                } else if (scope.formData.groupId) {
                    scope.inparams.templateType = 'group';
                } else if (scope.formData.clientId) {
                    scope.inparams.templateType = 'individual';
                }
                if (scope.formData.clientId) {
                    scope.inparams.clientId = scope.formData.clientId;
                }
                if (scope.formData.groupId) {
                    scope.inparams.groupId = scope.formData.groupId;
                }
                scope.inparams.staffInSelectedOfficeOnly = true;
                scope.inparams.productId = loanProductId;

                resourceFactory.loanResource.get(scope.inparams, function (data) {
                    scope.loanaccountinfo = data;
                    if (data.clientName) {
                        scope.clientName = data.clientName;
                    }
                    if (data.group) {
                        scope.groupName = data.group.name;
                    }
                });
            };

            scope.requestApprovalLoanAppRef = function () {
                resourceFactory.loanApplicationReferencesResource.update({loanApplicationReferenceId: scope.loanApplicationReferenceId,command: 'requestforapproval'},{}, function (data) {
                    location.path('/viewclient/' + scope.formData.clientId + '/viewloanapplicationreference/'+ scope.loanApplicationReferenceId +'/surveys');
                });
            };




            scope.charges = [];
            scope.constructExistingCharges = function (index,chargeId,isMandatory) {
                resourceFactory.chargeResource.get({chargeId: chargeId, template: 'true'}, function (data) {
                    data.chargeId = data.id;
                    scope.charges.push(data);
                    curIndex++;
                    if(curIndex == scope.loanAppChargeData.length){
                        for(var i = 0 ; i < scope.charges.length; i++){
                            for(var j = 0; j < scope.loanAppChargeData.length; j++){
                                if(scope.charges[i].chargeId == scope.loanAppChargeData[j].chargeId){
                                    scope.charges[i].loanAppChargeId = scope.loanAppChargeData[j].loanAppChargeId;
                                    scope.charges[i].loanApplicationReferenceId = scope.loanAppChargeData[j].loanApplicationReferenceId;
                                    scope.charges[i].dueDate = scope.loanAppChargeData[j].dueDate;
                                    scope.charges[i].amount = scope.loanAppChargeData[j].amount;
                                    scope.charges[i].isMandatory = scope.loanAppChargeData[j].isMandatory;
                                }
                            }
                        }
                    }
                });
            };

            scope.undoApprovalLoanAppRef = function () {
                resourceFactory.loanApplicationReferencesResource.update({
                    loanApplicationReferenceId: scope.loanApplicationReferenceId,
                    command: 'undoapprove'
                }, {}, function (data) {
                    location.path('/viewclient/' + scope.formData.clientId);
                });
            };

            scope.rejectApprovalLoanAppRef = function () {
                resourceFactory.loanApplicationReferencesResource.update({
                    loanApplicationReferenceId: scope.loanApplicationReferenceId,
                    command: 'reject'
                }, {}, function (data) {
                    location.path('/viewclient/' + scope.formData.clientId);
                });
            };
        }
    });
    mifosX.ng.application.controller('ViewLoanApplicationReference', ['$scope', '$routeParams', 'ResourceFactory', '$location', 'dateFilter', mifosX.controllers.ViewLoanApplicationReference]).run(function ($log) {
        $log.info("ViewLoanApplicationReference initialized");
    });
}(mifosX.controllers || {}));