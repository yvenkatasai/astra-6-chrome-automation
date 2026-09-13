function edonationConfirmCurrentSrivaniController($scope, $location, $compile, $route, serviceFactory, commonDataFactory, $rootScope, $timeout, $interval, $document) {
  function userAuthenticatedCallBack(response) {
    if (response.data) {
      dccsc.pageDetails.userId = response.data.userId;
      var loginData = {};
      loginData.userId = response.data.userId, commonDataFactory.setDonationHistoryData(loginData), localStorage.setItem("userId", response.data.userId), getUserDetails();
    } else $location.path("/userLogin");
  }
  function getUserDetails() {
    function userDetailscallback(response) {
      return $("#loader").css("display", "none"), dccsc.userDetails = response.data, "1001" !== dccsc.userDetails.userCountry ? void $("#NonIndianPop").show() : void ("23" === dccsc.pageDetails.selectedTrustName && dccsc.getSrivaniCurrentDay());
    }
    if ("undefined" != typeof loginUserData.userId) {
      dccsc.pageDetails.userId = loginUserData.userId;
      var loginData = {};
      loginData.userId = loginUserData.userId, commonDataFactory.setDonationHistoryData(loginData), localStorage.setItem("userId", loginUserData.userId);
    }
    if (dccsc.pageDetails.userId) {
      var serviceUrl = "common/getUserDetail/" + dccsc.pageDetails.userId;
      $("#loader").css("display", "block"), serviceFactory.serviceCall(serviceUrl, "POST", "", userDetailscallback);
    }
  }
  function darshanSummarySuccessCB(response) {
    if (calendarData = response, angular.element(".tkts_uparw").addClass("sevamaxdis"), angular.element(".tkts_dwnarw").addClass("sevamaxdis"), angular.element(".cal_dwnarw").addClass("sevamaxdis"), angular.element(".cal_uparw").addClass("sevamaxdis"), response.data) {
      $scope.availableDatesList = [], $scope.blockedDatesList = [], $scope.bookedDatesList = [], $scope.availableDatesList = response.data.availableDatesList, dccsc.darshanCost = response.data.darshanAmount, dccsc.availableDatesListSrivani = [], dccsc.availableDatesListSrivani = response.data.availableDatesListSrivani, $scope.blockedDatesList = response.data.blockedDates ? response.data.blockedDates : [], $scope.bookedDatesList = response.data.bookedDates ? response.data.bookedDates : [], $scope.frequency = "", $scope.frequencyList = [], $scope.frequency = response.data.frequency, $scope.frequencyList = response.data.frequencyList, properties.accomodation.frequencyList = [], properties.accomodation.frequencyList = response.data.frequencyList, properties.accomodation.availableDatesList = [], properties.accomodation.blockedDatesList = [], properties.accomodation.bookedDatesList = [], properties.accomodation.availableDatesList = response.data.availableDatesList, properties.accomodation.blockedDatesList = response.data.blockedDates ? response.data.blockedDates : [], properties.accomodation.bookedDatesList = response.data.bookedDates ? response.data.bookedDates : [], $scope.startDate = response.data.startAndEndDates[0], properties.accomodation.startDate = response.data.startAndEndDates[0], $scope.endDate = response.data.startAndEndDates[1], properties.accomodation.endDate = response.data.startAndEndDates[1];
      var startDate = $scope.startDate, endDate = $scope.endDate;
      moment(endDate, "DD-MMM-YYYY").diff(moment(startDate, "DD-MMM-YYYY")) / 864e5;
      startMonth = moment(startDate, "DD-MMM-YYYY").month(), currentLastMonth = moment(startDate, "DD-MMM-YYYY").add(2, "months"), currentLastMonthDate = moment(currentLastMonth, "DD-MMM-YYYY").format("DD-MMM-YYYY"), currentLastMonthLastDay = currentLastMonth.daysInMonth() + "-" + moment(currentLastMonth, "DD-MMM-YYYY").format("MMM-YYYY"), currentCalRange = moment(currentLastMonthLastDay, "DD-MMM-YYYY").diff(moment(startDate, "DD-MMM-YYYY")) / 864e5, $scope.day = moment(), properties.accomodation.noOfCalendars = 4, $scope.days = [{ day: moment(), id: "cal0" }, { day: moment(), id: "cal1" }, { day: moment(), id: "cal2" }, { day: moment(), id: "cal3" }];
    }
    angular.element("#loader").css("display", "none"), $("#myModalDarshan").show(), "Accommodation" === dccsc.redeemTitle && (dccsc.accomAllowList = [], dccsc.accomAllowList = angular.copy(response.data.availableDatesList));
  }
  function invArray(array) {
    return "[object Number]" == Object.prototype.toString.call(array) && (array = String(array)), "[object String]" == Object.prototype.toString.call(array) && (array = array.split("").map(Number)), array.reverse();
  }
  function validate(array) {
    for (var c = 0, invertedArray = invArray(array), i2 = 0; i2 < invertedArray.length; i2++) c = d[c][p[i2 % 8][invertedArray[i2]]];
    return 0 === c;
  }
  function proofType(proofCode) {
    switch (proofCode) {
      case 1015:
        return "AadharCard";
      case 1014:
        return "DrivingLicense";
      case 1011:
        return "PANCard";
      case 1013:
        return "Passport";
      case 1012:
        return "RationCard";
      case 1016:
        return "VoterID";
      default:
        return "AadharCard";
    }
  }
  var dccsc = this;
  "" != localStorage.getItem("userId") && void 0 != localStorage.getItem("userId") && null != localStorage.getItem("userId") || $location.path("/userLogin"), $rootScope.headerName = "Donation", commonDataFactory.setSevaCalendarData({}), commonDataFactory.setvirtualSevaCalendarData({}), commonDataFactory.setvirtualSevaPATCalendarData({}), commonDataFactory.setPilgrimDetailsPATK({}), commonDataFactory.setSedSriOptions({}), commonDataFactory.setpatSevaCalendarData({}), commonDataFactory.setUserData({}), dccsc.pageDetails = { userData: {}, trustDetails: [], trustSubScheme: [], selectedTrustName: "", subTrustList: [], userDetails: {}, jointDonorDetails: {}, states: [], countries: [], photoId: "", photoIds: "", genderkal: {}, selectedOptions: {}, savedUserData: {}, persons: [] }, properties.proofTypes = [{ id: "AadharCard", type: "Aadhaar Card " }, { id: "Passport", type: "Passport " }], dccsc.pageDetails.behalf = "", dccsc.pageDetails.behalffff = "", dccsc.proofTypes = [], dccsc.pageDetails.jointDonorDetails.gender = true, dccsc.pageDetails.jointDonorDetails.dob = "", dccsc.pageDetails.duplicatePan = false, dccsc.pageDetails.displayTrustList = true, dccsc.pageDetails.offeringId = null, dccsc.pageDetails.schemeMandatory = false, dccsc.pageDetails.jointDonorDetails.isSameAddress = false, dccsc.pageDetails.disableSelectScheme = true, dccsc.userDetails = {}, dccsc.pageDetails.notIndia = false, dccsc.pageDetails.userPanNo = "", dccsc.pageDetails.note = true, dccsc.pageDetails.selectedCountryName = "", dccsc.pageDetails.schemeName = "", dccsc.pageDetails.userImage = "content/img/profile.png", dccsc.pageDetails.userId = "", dccsc.amountFlag = true, dccsc.onBack = false, dccsc.isPANMandatory = false, dccsc.testmin = "", dccsc.checkamounterror = false, dccsc.otherPrivilegesPop = false, dccsc.pageDetails.newPanProofIDNum = null, dccsc.indianErrorMsg = "", dccsc.pageDetails.noOfPilgrims = "", dccsc.currentCaptcha = "", dccsc.countdown = 0, dccsc.timerStarted = false, dccsc.pendingSubmit = false;
  dccsc.pageDetails.selectedTrustName = "23", dccsc.pageDetails.selectedTrust = "Sri Venkateswara Aalayala Nirmanam Trust (SRIVANI TRUST)", angular.element("#generalInstructions").show(), dccsc.srivanidetails = JSON.parse(localStorage.getItem("srivanidetails")), dccsc.srivanidetails ? (dccsc.pageDetails.amount = dccsc.srivanidetails.offeringAmount, dccsc.checkamount = dccsc.srivanidetails.checkamount, dccsc.indian = dccsc.srivanidetails.indian) : $location.path("/userLogin");
  var loginUserData = {}, userData = {}, pilgrimdetails = {};
  if (userData = commonDataFactory.getUserData(), Object.keys(commonDataFactory.getLoginUserData()).length > 1 ? (loginUserData = commonDataFactory.getLoginUserData(), dccsc.pageDetails.userId = loginUserData.userId, getUserDetails()) : serviceFactory.serviceCall("user/getUserContext", "POST", "", userAuthenticatedCallBack), $("#hdrDirective").show(), dccsc.pageDetails.countryCode = "91", dccsc.pageDetails.country2Code = "in", Object.keys(userData).length > 1 && (dccsc.pageDetails.selectedTrustName = userData.trustId, "10003" === dccsc.pageDetails.selectedTrustName && (dccsc.pageDetails.note = false), dccsc.pageDetails.amount = userData.offeringAmount, dccsc.Type = userData.donationType, dccsc.checkamount = userData.checkamount, dccsc.pageDetails.behalf = userData.onBehalfOf, dccsc.pageDetails.userPanNo = userData.userPANId, dccsc.pageDetails.offeringId = userData.orderId, "" !== userData.schemeId || "null" !== userData.schemeId || null !== userData.schemeId || "undefined" !== userData.schemeId ? (dccsc.pageDetails.disableSelectScheme = false, dccsc.pageDetails.selectedScheme = userData.schemeId) : dccsc.pageDetails.disableSelectScheme = true), 1 === Object.keys(userData).length && (dccsc.pageDetails.offeringId = userData.orderId), dccsc.validateAmount = function() {
    function validateAmountcallback(response) {
      dccsc.pageDetails.validateAmount = response.data;
    }
    var requestData = { amount: dccsc.pageDetails.amount.toString() };
    serviceFactory.serviceCall("dms/validateAmount", "POST", requestData, validateAmountcallback);
  }, Object.keys(commonDataFactory.getPilgrimDetailsK()).length > 1) {
    angular.element("#generalInstructions").hide(), dccsc.validateAmount(), pilgrimdetails = commonDataFactory.getPilgrimDetailsK(), dccsc.pageDetails.noOfPilgrims = pilgrimdetails.PilgrimDetails.noOfPilgrims;
    var persons = [];
    if (dccsc.pageDetails.noOfPilgrims >= 1) for (var i = 0; i < dccsc.pageDetails.noOfPilgrims; i++) persons[i] = i;
    dccsc.persons = persons, dccsc.pageDetails.amount = pilgrimdetails.PilgrimDetails.amount, dccsc.checkamount = pilgrimdetails.memberDetails.checkamount;
    for (var i = 1; i <= pilgrimdetails.memberDetails.length; i++) {
      idProofTypes = angular.copy(properties.proofTypes), dccsc["proofTypes" + i] = idProofTypes, dccsc.pageDetails["fName" + i] = pilgrimdetails.memberDetails[i - 1].firstName, dccsc.pageDetails["age" + i] = pilgrimdetails.memberDetails[i - 1].age, dccsc.pageDetails["gender" + i] = pilgrimdetails.memberDetails[i - 1].gender, dccsc.pageDetails["selectedProof" + i] = proofType(pilgrimdetails.memberDetails[i - 1].idProofType), pilgrimdetails.memberDetails[i - 1].userAadharNumber ? dccsc.pageDetails["photoId" + i] = pilgrimdetails.memberDetails[i - 1].userAadharNumber : dccsc.pageDetails["photoId" + i] = pilgrimdetails.memberDetails[i - 1].userPassportNumber;
      var selectedProof = dccsc.pageDetails["selectedProof" + i];
      "AadharCard" === selectedProof ? (dccsc.pageDetails["regex" + i] = /^[0-9]{12}$/, dccsc.pageDetails["pattern" + i] = "Please enter a valid Aadhaar Number") : "Passport" === selectedProof && (dccsc.pageDetails["regex" + i] = /^[A-Za-z0-9]{5,15}$/, dccsc.pageDetails["pattern" + i] = "Please enter a valid Passport Number");
    }
  }
  dccsc.getNoOfPilgrimsFunction = function() {
    function noOfPersonsCallBack(response) {
      if (dccsc.pageDetails.noOfPilgrims = response.data.NoOfPersons, dccsc.pageDetails.noOfPilgrims) {
        var persons2 = [];
        if (dccsc.pageDetails.noOfPilgrims >= 1) for (var i2 = 0; i2 < dccsc.pageDetails.noOfPilgrims; i2++) persons2[i2] = i2;
        if (dccsc.persons = persons2, dccsc.pageDetails.noOfPilgrims >= 1) for (var i2 = Number(dccsc.pageDetails.noOfPilgrims) + 1; i2 <= 4; i2++) delete dccsc.pageDetails["fName" + i2], delete dccsc.pageDetails["age" + i2], delete dccsc.pageDetails["gender" + i2], delete dccsc.pageDetails["selectedProof" + i2], delete dccsc.pageDetails["photoId" + i2];
        for (var i2 = 1; i2 <= dccsc.pageDetails.noOfPilgrims; i2++) dccsc.pageDetails["gender" + i2] || (dccsc.pageDetails["gender" + i2] = "Male");
      }
    }
    serviceFactory.serviceCall("dms/getnoOfPersons/" + dccsc.pageDetails.amount, "POST", "", noOfPersonsCallBack), dccsc.pageDetails.amount || (dccsc.pageDetails.noOfPilgrims = "");
  }, dccsc.getNoOfPilgrimsFunction(), $document.on("keydown", function(event2) {
    for (var popups = [{ id: "generalInstructions", action: function() {
      document.getElementById("cok").click();
    } }, { id: "NonIndianPop", action: function() {
      dccsc.closeNonIndianPop();
    } }, { id: "passportMsgPopUp", action: function() {
      dccsc.messagePopUp && dccsc.messagePopUp();
    } }, { id: "ErrorMsgPopUp", action: function() {
      dccsc.ErrorMsgclose && dccsc.ErrorMsgclose();
    } }, { id: "quotaPopUp", action: function() {
      dccsc.quotaclose && dccsc.quotaclose();
    } }, { id: "myModalDarshan", action: function() {
      dccsc.ClosePopUp && dccsc.ClosePopUp();
    } }, { id: "quotamisPopUp", action: function() {
      dccsc.quotamisclose && dccsc.quotamisclose();
    } }], popupOpen = false, i2 = 0; i2 < popups.length; i2++) {
      var popupEl = document.getElementById(popups[i2].id);
      if (popupEl && "none" !== popupEl.style.display) {
        popupOpen = true, 13 === event2.keyCode && popups[i2].action(), event2.preventDefault(), event2.stopPropagation();
        break;
      }
    }
    if (!popupOpen && 13 === event2.keyCode) {
      var btn = document.getElementById("smp");
      btn && btn.click();
    }
    $scope.$$phase || $scope.$apply();
  }), $scope.$on("$destroy", function() {
    $document.off("keydown");
  }), dccsc.getTrusteeDetails = function() {
    function trusteeListcallback(response) {
      dccsc.pageDetails.trustDetails = response.data.trusts;
      for (var trustDetails = dccsc.pageDetails.trustDetails.length, i2 = 0; i2 < trustDetails; i2++) if (dccsc.pageDetails.selectedTrustName === dccsc.pageDetails.trustDetails[i2].trustId.toString() || dccsc.pageDetails.selectedTrustName === dccsc.pageDetails.trustDetails[i2].trustId) {
        dccsc.pageDetails.selectedTrust = dccsc.pageDetails.trustDetails[i2].trustName;
        break;
      }
    }
    dccsc.pageDetails.selectedTrustName = "23", serviceFactory.serviceCall("eDonation/trustsandsubtrusts", "POST", "", trusteeListcallback);
  }, dccsc.isRestrictedTimeWindow = function(currentMoment, releaseTimeStr) {
    var timeString = currentMoment.format("HH:mm:ss");
    if (!releaseTimeStr) return true;
    var releaseTime = moment(releaseTimeStr, "HH:mm:ss"), restrictedStartString = releaseTime.clone().add(1, "minutes").format("HH:mm:ss");
    return timeString >= restrictedStartString && timeString <= "23:59:59";
  }, dccsc.getSrivaniCurrentDay = function() {
    function SrivaniCurrentDaycallback(response) {
      if (null !== response.data && void 0 !== response.data) {
        dccsc.pageDetails.SrivaniCurrentDayDetails = response.data, dccsc.quotaCount = response.data.quotaCount, dccsc.success = response.data.success, dccsc.pending = response.data.pending, dccsc.failed = response.data.failed, dccsc.quotareleased = response.data.released, dccsc.quotaReleaseT = response.data.quotaReleaseTime;
        var currentMoment = moment();
        dccsc.serverTime = currentMoment.format("HH:mm:ss"), dccsc.quotaReleaseTime = dccsc.quotaReleaseT;
        var releaseTimeObj = moment(dccsc.quotaReleaseT, "HH:mm:ss");
        if (releaseTimeObj.isBefore(currentMoment) && releaseTimeObj.add(1, "day"), dccsc.targetReleaseTimestamp = releaseTimeObj.valueOf(), 0 !== dccsc.quotaCount) {
          dccsc.pageDetails.minAmount = dccsc.pageDetails.SrivaniCurrentDayDetails.minAmount, dccsc.pageDetails.maxAmount = dccsc.pageDetails.SrivaniCurrentDayDetails.maxAmount, dccsc.today = moment().format("DD-MMM-YYYY");
          var maxPerPerson = 1e4;
          if (dccsc.pageDetails.SrivaniCurrentDayDetails.quotaCount < dccsc.pageDetails.SrivaniCurrentDayDetails.maxpersons && dccsc.pageDetails.amount) {
            var allowedAmount = (dccsc.pageDetails.SrivaniCurrentDayDetails.quotaCount + 1) * maxPerPerson - 1;
            dccsc.pageDetails.amount > allowedAmount && (window.scrollTo({ top: 0, behavior: "smooth" }), angular.element("#quotamisPopUp").show(), dccsc.quotamismatch = "The Available Quota is less than the entered amount");
          }
        }
      }
    }
    function SrivaniCurrentDayErrCB(response) {
      response && response.status !== -1 && (alert("system error occured"), $location.path("/welcome"));
    }
    serviceFactory.serviceCall("dms/darshansummarySrivaniCurrentDay", "POST", "", SrivaniCurrentDaycallback, SrivaniCurrentDayErrCB);
  }, $scope.clockInterval = $interval(function() {
    var currentMoment = moment();
    if (dccsc.quotaReleaseTime = dccsc.quotaReleaseT, dccsc.serverTime = currentMoment.format("HH:mm:ss"), dccsc.targetReleaseTimestamp) if (dccsc.isRestrictedTimeWindow(currentMoment, dccsc.quotaReleaseT)) dccsc.remainingTime = "N/A";
    else {
      var now = currentMoment.valueOf(), diffMs = dccsc.targetReleaseTimestamp - now;
      diffMs < 0 && (diffMs = 0);
      var duration = moment.duration(diffMs), hours = String(Math.floor(duration.asHours())).padStart(2, "0"), minutes = String(duration.minutes()).padStart(2, "0"), seconds = String(duration.seconds()).padStart(2, "0");
      dccsc.remainingTime = hours + ":" + minutes + ":" + seconds;
    }
    var continueBtn = document.getElementById("smp");
    if (continueBtn) if (dccsc.quotaReleaseT) {
      var releaseTime = moment(dccsc.quotaReleaseT, "HH:mm:ss");
      currentMoment.isBefore(releaseTime) ? continueBtn.disabled = true : continueBtn.disabled = false;
    } else continueBtn.disabled = true;
  }, 1e3);
  var refreshInterval = 2e4;
  $scope.quotaInterval = $interval(function() {
    dccsc.getSrivaniCurrentDay();
  }, refreshInterval), dccsc.getSrivaniCurrentDay(), $scope.$on("$destroy", function() {
    angular.isDefined($scope.clockInterval) && ($interval.cancel($scope.clockInterval), $scope.clockInterval = void 0), angular.isDefined($scope.quotaInterval) && ($interval.cancel($scope.quotaInterval), $scope.quotaInterval = void 0);
  }), dccsc.enforceMaxLength = function(event2) {
    var value = event2.target.value;
    value && value.toString().length > 5 && (event2.target.value = value.toString().slice(0, 5), dccsc.pageDetails.amount = event2.target.value);
  }, dccsc.key = function($event) {
    var value = event.target.value || "";
    [8, 9, 37, 39, 46].includes(event.keyCode) || (value.length >= 5 && event.preventDefault(), ($event.which < 48 || $event.which >= 58) && 8 !== $event.which && 0 !== $event.which && $event.preventDefault());
  }, dccsc.processPayment = function() {
    function paymentCallback(response) {
      if (response.data.error) window.scrollTo({ top: 0, behavior: "smooth" }), angular.element("#ErrorMsgPopUp div.modal-dialog").css("width", "30%"), angular.element("#ErrorMsgPopUp").show(), dccsc.ErrorMsg = response.data.error;
      else if ("SUCCESS" === response.data.message) {
        var eDonationUserData = { piligrimFirstName: dccsc.userDetails.userFirstName, piligrimLastName: dccsc.userDetails.userLastName, offeringAmount: dccsc.pageDetails.amount, piligrimEmail: dccsc.userDetails.userEmail, piligrimPhoneMobile: dccsc.userDetails.userPhoneMobile, currencyID: 4, piligrimAddressLine1: dccsc.userDetails.userAddressLine1 ? dccsc.userDetails.userAddressLine1 : "", piligrimAddressLine2: dccsc.userDetails.userAddressLine2 ? dccsc.userDetails.userAddressLine2 : "", piligrimCity: dccsc.userDetails.userCity ? dccsc.userDetails.userCity : "", piligrimZipCode: dccsc.userDetails.userZipCode ? dccsc.userDetails.userZipCode : "", onBehalfOf: dccsc.pageDetails.behalf ? dccsc.pageDetails.behalf : "", donorName: dccsc.pageDetails.jointDonorDetails.name, donorMobileNo: dccsc.pageDetails.jointDonorDetails.mobileNo ? dccsc.pageDetails.countryCode + dccsc.pageDetails.jointDonorDetails.mobileNo.replace(/\s/g, "") : dccsc.pageDetails.jointDonorDetails.mobileNo, donorPanNo: dccsc.pageDetails.userPanNo ? dccsc.pageDetails.userPanNo : dccsc.pageDetails.userPanNo, trustId: dccsc.pageDetails.selectedTrustName, schemeId: dccsc.pageDetails.selectedScheme ? dccsc.pageDetails.selectedScheme : "", isSameAddress: !!dccsc.pageDetails.jointDonorDetails.isSameAddress, userImage: dccsc.userDetails.userImage, trustName: "Sri Venkateswara Aalayala Nirmanam Trust (SRIVANI TRUST)", schemeName: dccsc.pageDetails.schemeName ? dccsc.pageDetails.schemeName : "", userImageLocation: dccsc.userDetails.userImageLocation }, eDonationPageData = Object.create(eDonationUserData);
        eDonationPageData.onBehalfOf = dccsc.pageDetails.behalf, eDonationPageData.trustId = dccsc.pageDetails.selectedTrustName, eDonationPageData.schemeId = dccsc.pageDetails.selectedScheme ? dccsc.pageDetails.selectedScheme : "", eDonationPageData.offeringAmount = dccsc.pageDetails.amount, eDonationPageData.userPANId = dccsc.pageDetails.userPanNo, eDonationPageData.country2Code = dccsc.pageDetails.country2Code, eDonationPageData.donationType = dccsc.Type, eDonationPageData.checkamount = dccsc.checkamount, eDonationPageData.trustName = "Sri Venkateswara Aalayala Nirmanam Trust (SRIVANI TRUST)", eDonationPageData.SRIVANIcurrentday = true;
        for (var acpmnyUserData = {}, darshanBookingPilgrimList = [], i2 = 1; i2 <= dccsc.pageDetails.noOfPilgrims; i2++) {
          acpmnyUserData = {}, acpmnyUserData.firstName = dccsc.pageDetails["fName" + i2], acpmnyUserData.age = dccsc.pageDetails["age" + i2], acpmnyUserData.gender = dccsc.pageDetails["gender" + i2];
          var idCardType = dccsc.getIDCardName(dccsc.pageDetails["selectedProof" + i2]), idCardName = {};
          idCardName[idCardType] = "", acpmnyUserData.idProofType = dccsc.getUserProofIDCode(idCardName), acpmnyUserData[idCardType] = dccsc.pageDetails["photoId" + i2], darshanBookingPilgrimList.push(acpmnyUserData);
        }
        darshanBookingPilgrimList.checkamount = dccsc.checkamount, darshanBookingPilgrimList.darshanDate = dccsc.today, darshanBookingPilgrimList.paymentNonce = response.data.paymentNonce, commonDataFactory.setUserData(eDonationPageData), commonDataFactory.setPilgrimDetails(dccsc.pageDetails), commonDataFactory.setPilgrimDetailsPATK(darshanBookingPilgrimList), $location.path("/edonationCurrentSrivanipay"), $rootScope.headerName = "Donation";
      }
    }
    function errorCallback(error) {
      403 === error.status && (window.scrollTo({ top: 0, behavior: "smooth" }), angular.element("#ErrorMsgPopUp div.modal-dialog").css("width", "30%"), angular.element("#ErrorMsgPopUp").show(), dccsc.ErrorMsg = error.data.message);
    }
    0 === dccsc.quotaCount ? angular.element("#quotaPopUp").show() : serviceFactory.serviceCall("dms/continue", "POST", "", paymentCallback, errorCallback);
  }, dccsc.continueSubmit = function(userForm, userForm2, confirm) {
    const userInput = document.getElementById("captchaInput").value, honeypot = document.getElementsByName("honeypot")[0].value;
    if (!userInput || "" === userInput.trim()) return void alert("Please enter CAPTCHA");
    if (honeypot.length > 0) return void alert("Incorrect CAPTCHA. Please try again.");
    if (userInput !== dccsc.currentCaptcha) return alert("Incorrect CAPTCHA. Please try again."), void dccsc.generateCaptcha();
    if (null == dccsc.userDetails.isDonor && (dccsc.userDetails.isDonor = ""), !(dccsc.pageDetails.amount < 1e4 && dccsc.pageDetails.amount > 4e4)) {
      if (void 0 == dccsc.checkamount || 0 == dccsc.checkamount) return void (dccsc.checkamounterror = true);
      if (dccsc.checkamounterror = false, void 0 !== dccsc.pageDetails.amount && null !== dccsc.pageDetails.amount && "" !== dccsc.pageDetails.amount) {
        for (var j = 1; j < dccsc.pageDetails.noOfPilgrims - 1; j++) if (!$scope.userForm2["proofId" + j].$error.pattern && $scope.userForm2.$error.pattern) for (var i2 = 0; i2 < $scope.userForm2.$error.pattern.length; i2++) $scope.userForm2.$error.pattern[i2].$name === "proofId" + j && ($scope.userForm2.$error.pattern.splice(i2, 1), i2--);
        var obj, photoFlag = false, errObjFst = 0;
        if ($scope.userForm2.$error.pattern && $scope.userForm2.$error.pattern.length >= 1 || $scope.userForm2.$error.verhoeff || $scope.userForm2.$error.proofTypeMissing || $scope.userForm2.$error.required || $scope.userForm2.$error.min || $scope.userForm2.$error.max || $scope.userForm2.$error.minlength || $scope.userForm2.$error.maxlength) {
          ($scope.userForm2.$error.min || $scope.userForm2.$error.max) && ($scope.userForm2.$valid = false, $scope.userForm2.$invalid = true);
          for (obj in $scope.userForm2.$error) ++errObjFst;
          errObjFst >= 1 && (photoFlag = true);
        }
        if ($scope.userForm2.$valid || !photoFlag) {
          for (var i2 = 1; i2 <= dccsc.pageDetails.noOfPilgrims; i2++) if (dccsc.pageDetails["photoId" + i2]) {
            for (var j = i2 + 1; j <= dccsc.pageDetails.noOfPilgrims; j++) if (dccsc.pageDetails["photoId" + j] && dccsc.pageDetails["photoId" + i2].trim().toUpperCase() === dccsc.pageDetails["photoId" + j].trim().toUpperCase()) return window.scrollTo({
              top: 0,
              behavior: "smooth"
            }), angular.element("#ErrorMsgPopUp").show(), void (dccsc.ErrorMsg = "Pilgrims cannot have the same ID proofs, so please enter different ID proofs.");
          }
          dccsc.processPayment();
        }
      }
    }
  }, dccsc.srivaniNo = function() {
    angular.element("#myModalSrivani").hide(), angular.element("#currentDayPop").hide();
  }, dccsc.convertCurrency = function(amount) {
    var amountInWords;
    return amountInWords = convertToWords(amount);
  }, dccsc.Back = function() {
    var ePageData = {};
    ePageData.offeringAmount = dccsc.pageDetails.amount, ePageData.checkamount = dccsc.checkamount, ePageData.indian = dccsc.indian, commonDataFactory.setUserData(ePageData), $location.path("/SrivaniDonationConfirm");
  }, dccsc.onreset = function(formData) {
    if (document.getElementById("captchaInput").value = "", dccsc.pageDetails.noOfPilgrims >= 1) for (var i2 = 1; i2 <= dccsc.pageDetails.noOfPilgrims; i2++) delete dccsc.pageDetails["fName" + i2], delete dccsc.pageDetails["age" + i2], dccsc.pageDetails["gender" + i2] = "Male", delete dccsc.pageDetails["selectedProof" + i2], delete dccsc.pageDetails["photoId" + i2];
  }, dccsc.calenderDisplay = function(availType) {
    switch (angular.element("#loader").css("display", "block"), availType) {
      case "darshan":
        if (dccsc.darshanToggle) {
          dccsc.redeemTitle = "Beginning Break Darshan";
          var serviceInput = { channelTypeId: 100002, darshanIdList: [100009], roleName: "ROLE_PILGRIM" };
          serviceFactory.serviceCall("dms/darshansummary", "POST", serviceInput, darshanSummarySuccessCB), dccsc.darshanToggle = false, dccsc.showAvailDarshan = false;
        } else dccsc.darshanToggle = true;
        break;
      default:
        return;
    }
  }, dccsc.nextButton = function() {
    calButton < $scope.days.length - 1 && calButton >= 0 && (calButton += 1, angular.element(".sevacalnd_" + (calButton - 1)).addClass("hidden-sm hidden-xs"), angular.element(".sevacalnd_" + calButton).removeClass("hidden-sm hidden-xs").css("display", "inline-block"), dccsc.showPrevButton = true, calButton >= $scope.days.length - 1 && (dccsc.showNextButton = false));
  }, dccsc.prevButton = function() {
    calButton >= 0 && 0 != calButton && (calButton -= 1, dccsc.showNextButton = true, angular.element(".sevacalnd_" + (calButton + 1)).addClass("hidden-sm hidden-xs"), angular.element(".sevacalnd_" + calButton).removeClass("hidden-sm hidden-xs").css("display", "inline-block"), 0 == calButton && (dccsc.showPrevButton = false));
  }, dccsc.okCovidClick = function() {
    angular.element("#generalInstructions").hide(), dccsc.validateAmount(), $timeout(function() {
      var input = document.getElementById("fName1");
      input && input.focus();
    }, 50);
  }, dccsc.closeNonIndianPop = function() {
    $("#NonIndianPop").hide(), $location.path("/welcome");
  }, dccsc.ClosePopUp = function() {
    dccsc.darshanToggle = true, dccsc.sevaToggle = true, dccsc.accToggle = true, $("#myModalDarshan").hide();
  }, dccsc.ErrorMsgclose = function() {
    angular.element("#ErrorMsgPopUp").hide();
    var targetElement1 = document.getElementById("Pilgrimd");
    targetElement1 && targetElement1.scrollIntoView({ behavior: "smooth" });
  }, dccsc.quotaclose = function() {
    angular.element("#quotaPopUp").hide();
  }, dccsc.quotamisclose = function() {
    angular.element("#quotamisPopUp").hide();
  }, dccsc.selectedDay = function(day, event2) {
    dccsc.selectedDarshandate = moment(day.date, "DD-MMM-YYYY").format("DD-MMM-YYYY");
    moment(day.date, "DD-MMM-YYYY").format("YYYY-MM-DD");
    angular.element(".day").removeClass("highlight"), event2 && (angular.element(event2.target).addClass("highlight"), SelectedDateClass = event2.currentTarget.className), dccsc.selectedslot = "", dccsc.selectedslotId = "", dccsc.darshanNote = "", dccsc.selectedQuota = "";
    var list = dccsc.availableDatesListSrivani;
    angular.forEach(list, function(value, key) {
      if (key == dccsc.selectedDarshandate) {
        var srdata = value.split(",", 4);
        dccsc.selectedslot = srdata[0], dccsc.darshanNote = srdata[1], dccsc.selectedslotId = srdata[2], dccsc.selectedQuota = srdata[3];
      }
    }), dccsc.dollarStatus = true, dccsc.dollarCheck = false, dccsc.dollarerr = false, angular.element("#darshanDate").focus();
  };
  var calButton = 0;
  dccsc.darshanToggle = true, dccsc.sevaToggle = true, dccsc.accToggle = true, dccsc.setProofTypes = function(age, index) {
    var idProofTypes2 = [];
    "primary" === index || (dccsc.changeDetailsFlag = false), idProofTypes2 = angular.copy(properties.proofTypes), age ? (age < 0 && (idProofTypes2.splice(1, 1), idProofTypes2.splice(4, 1)), dccsc.changeDetailsFlag ? dccsc.proofTypes = idProofTypes2 : dccsc["proofTypes" + index] = idProofTypes2, dccsc.pageDetails["disableIdProofSelection" + index] = false) : dccsc.changeDetailsFlag && (dccsc.proofTypes = idProofTypes2);
  }, dccsc.getUserProofID = function(res) {
    var idCards = ["userRationcardNumber", "userPassportNumber", "userDrivinglicenseNumber", "userAadharNumber", "userVoteridNumber", "userPannumber"];
    for (var key in res) if (null !== res[key]) {
      for (var i2 = 0; i2 < idCards.length; i2++) if (idCards[i2] == key) return res[key];
    }
  }, dccsc.getUserProofIDCode = function(res) {
    var idCards = [{ key: "userRationcardNumber", code: 1012 }, { key: "userPassportNumber", code: 1013 }, { key: "userDrivinglicenseNumber", code: 1014 }, { key: "userAadharNumber", code: 1015 }, { key: "userVoteridNumber", code: 1016 }, { key: "userVoterIdNumber", code: 1016 }, { key: "userPannumber", code: 1011 }, { key: "userPanNumber", code: 1011 }];
    for (var key in res) if (null !== res[key]) {
      for (var i2 = 0; i2 < idCards.length; i2++) if (idCards[i2].key == key) return idCards[i2].code;
    }
  }, dccsc.getIDCardName = function(res) {
    for (var idCards = [{ key: "AadharCard", name: "userAadharNumber" }, { key: "DrivingLicense", name: "userDrivinglicenseNumber" }, { key: "PANCard", name: "userPanNumber" }, { key: "Passport", name: "userPassportNumber" }, { key: "RationCard", name: "userRationcardNumber" }, { key: "VoterID", name: "userVoterIdNumber" }], i2 = 0; i2 < idCards.length; i2++) if (res == idCards[i2].key) return idCards[i2].name;
  }, dccsc.getIDCardNamenew = function(res) {
    for (var idCards = [{ key: "Aadhaar Card ", name: "userAadharNumber" }, { key: "Driving License", name: "userDrivinglicenseNumber" }, { key: "PAN Card", name: "userPanNumber" }, { key: "Passport", name: "userPassportNumber" }, { key: "Ration Card", name: "userRationcardNumber" }, { key: "Voter Card", name: "userVoterIdNumber" }], i2 = 0; i2 < idCards.length; i2++) if (res == idCards[i2].key) return idCards[i2].name;
  }, dccsc.getUserProofName = function(idcard) {
    switch (idcard) {
      case "userRationcardNumber":
        return "RationCard";
      case "userPassportNumber":
        return "Passport";
      case "userDrivinglicenseNumber":
        return "DrivingLicense";
      case "userAadharNumber":
        return "AadharCard";
      case "userVoteridNumber":
        return "VoterID";
      case "userVoterIdNumber":
        return "VoterID";
      default:
        return "PANCard";
    }
  }, dccsc.getAllUserProofID = function(res) {
    var idCard, idCards = ["userRationcardNumber", "userPassportNumber", "userDrivinglicenseNumber", "userAadharNumber", "userVoteridNumber", "userVoterIdNumber", "userPannumber", "userPanNumber"];
    for (var key in res) if (null !== res[key]) for (var i2 = 0; i2 < idCards.length; i2++) idCards[i2] == key && (idCard = {}, idCard.type = dccsc.getUserProofName(key), idCard.id = res[key], idCardDetails.push(idCard));
  }, $scope.$watch(function() {
    return dccsc.pageDetails;
  }, function() {
    for (var i2 = 1; i2 <= dccsc.pageDetails.noOfPilgrims; i2++) {
      var proofType2 = dccsc.pageDetails["selectedProof" + i2], proofValue = dccsc.pageDetails["photoId" + i2];
      if ($scope.userForm2 && $scope.userForm2["proofId" + i2]) {
        if ("AadharCard" === proofType2) {
          var isValid = validate(proofValue);
          $scope.userForm2["proofId" + i2].$setValidity("verhoeff", isValid);
        } else $scope.userForm2["proofId" + i2].$setValidity("verhoeff", true);
        !proofType2 && proofValue ? $scope.userForm2["proofId" + i2].$setValidity("proofTypeMissing", false) : $scope.userForm2["proofId" + i2].$setValidity("proofTypeMissing", true);
      }
    }
  }, true);
  var d = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]], p = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]];
  dccsc.validationproofId = function(index) {
    dccsc.pageDetails["photoId" + index] = "";
    var selectedProof2 = dccsc.pageDetails["selectedProof" + index];
    "AadharCard" === selectedProof2 ? (dccsc.pageDetails["regex" + index] = /^[0-9]{12}$/, dccsc.pageDetails["pattern" + index] = "Please enter a valid Aadhaar Number") : "Passport" === selectedProof2 ? (dccsc.pageDetails["regex" + index] = /^[A-Za-z0-9]{5,15}$/, dccsc.pageDetails["pattern" + index] = "Please enter a valid Passport Number") : dccsc.pageDetails["regex" + index] = null;
  }, dccsc.showpassport = function(index) {
    var selectedProof2 = dccsc.pageDetails["selectedProof" + index] ? dccsc.pageDetails["selectedProof" + index] : "";
    "Passport" === selectedProof2 && (window.scrollTo({ top: 0, behavior: "smooth" }), angular.element("#passportMsgPopUp").show());
  }, dccsc.keyage = function($event) {
    ($event.which < 48 || $event.which >= 58) && 8 != $event.which && 9 != $event.which && $event.preventDefault();
  }, dccsc.blockCopyPaste = function(event2) {
    event2.preventDefault(), alert("Copy / Paste is not allowed.");
  }, dccsc.messagePopUp = function() {
    angular.element("#passportMsgPopUp").hide();
    var targetElement = document.getElementById("Pilgrimd");
    targetElement && targetElement.scrollIntoView({ behavior: "smooth" });
  }, dccsc.generateCaptcha = function() {
    document.getElementById("captchaInput").value = "";
    const canvas = document.getElementById("captchaCanvas");
    if (canvas) {
      const ctx = canvas.getContext("2d"), characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      dccsc.currentCaptcha = "", ctx.clearRect(0, 0, canvas.width, canvas.height), ctx.fillStyle = "#f0f0f0", ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (var i2 = 0; i2 < 5; i2++) ctx.strokeStyle = "rgb(" + Math.floor(255 * Math.random()) + "," + Math.floor(255 * Math.random()) + "," + Math.floor(255 * Math.random()) + ")", ctx.beginPath(), ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height), ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height), ctx.stroke();
      ctx.font = "bold 22px Arial";
      for (var i2 = 0; i2 < 6; i2++) {
        const char = characters.charAt(Math.floor(Math.random() * characters.length));
        dccsc.currentCaptcha += char, ctx.fillStyle = "#333", ctx.save(), ctx.translate(15 + 20 * i2, 35 + (10 * Math.random() - 5)), ctx.rotate(0.4 * Math.random() - 0.2), ctx.fillText(char, 0, 0), ctx.restore();
      }
    }
  }, setTimeout(dccsc.generateCaptcha, 100);
}
