$(document).on('click', '.addBox', function () {
	$('input[name=boxNum]').closest('.form-group').removeClass('has-error');
	if ($('input[name=boxNum]').val().substr(2, 1) == 'k') {
		$('input[name=boxNumber]').val($('input[name=boxNum]').val());
		$('input[name=boxNum]').prop('disabled', true);

	} else {
		$('input[name=boxNum]').closest('.form-group').addClass('has-error');
	}
});

var substringMatcher = function (strs) {

	return function findMatches(q, cb) {
		var matches, substringRegex;

		// an array that will be populated with substring matches
		matches = [];

		// regex used to determine if a string contains the substring `q`
		substrRegex = new RegExp(q, 'i');
		// iterate through the pool of strings and for any string that
		// contains the substring `q`, add it to the `matches` array
		$.each(strs, function (i, str) {
			if (substrRegex.test(str)) {
				matches.push(str);
			}
		});
		cb(matches);
	};
};
//var
serialNoList = [];
var subjects = [];
gradovi = [];
$.ajax({
	url: "/subjects/get",
	type: "post",
	data: {

	},
	dataType: 'json',
	async: false,
	success: function (data) {
		gradovi = data;
		subjects = data;
	}
});

$('#subject').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(gradovi)
	}).on('typeahead:selected', function (obj, value) {
		$('.inventoryBlock>.mask').hide();
		$('#subject').prop('disabled', true).css('background-color', '#eee');
		$('.changeSubjectHolder').show();
		$("#inventoryId").focus();
		showGrid();
		getParent($('#subject').val());
	});

function getParent(subject) {
	$.ajax({
		url: '/inventory/getParent',
		type: "post",
		data: {
			subject: subject,
		},
		dataType: 'json',
		success: function (data) {
			$('#subject').attr('data-parent', data);
		}
	});
}

$('#inventoryId').on('keydown', function (e) {
	thisItem = $(this);

	if ((e.which == 13 || e.which == 9) && $('#inventoryId').val() != '') {
		if ($('#subject').val() != 'Malex Sequester') {
			$('#proCreditHide').show();
		} else {
			if (thisItem.val().substring(0, 3) != 'AZZ') {
				$('#proCreditHide').show();
			} else {
				$('#proCreditHide').hide();
			}
		}

		$.ajax({
			url: '/inventory/checkInventoryIdTemp',
			type: "post",
			data: {
				inventoryId: thisItem.val(),
			},
			dataType: 'json',
			success: function (data) {
				if (data.ok == 'F') {
					$('#message').modal();
					$('#message').find('.modal-body p').html('Inventarski broj koji pokušavate da unesete već postoji!');
					$('#inventoryId').val('');
				} else {
					showType(thisItem.val());
					$('.add').focus();
				}
			}
		});


	}
});

$(document).on('click', '.close', function () {
	boxId = $(this).data('boxid');
	key = $('#key').text().trim();
	var flagCheck = 'F';

	if (key == '') {
		key = $('#orderKey').text();
		url = '/inventory/deleteFromOrder';
		flagCheck = 'T';
	} else {
		flagCheck = 'F';
		url = '/inventory/deleteBox';
	}

	var sn = $(this).closest('table').find('.inventoryId').map(function () {
		return $(this).text().trim() + '-' + $(this).data('position');
	}).get();
	thisItem = $(this);
	var items;
	$.ajax({
		url: url,
		type: "post",
		data: {
			boxId: boxId,
			boxIdent: boxId,
			sn: sn,
			key: key
		},
		dataType: 'json',
		success: function (data) {
			if (data) {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
				if (flagCheck == 'F') {
					$.each(data, function (i, item) {
						if (item.ok == 'F') {
							items += item.serial + ': ' + item.message + '<br/>';
						}
					});
					if (!items) {
						items = data[0].message;
						thisItem.closest('table').remove();
					}

					$('#message').find('.modal-body p').html(items.replace('undefined', ''));

					inventoryUnallocated();
				} else {
					thisItem.closest('table').remove();
				}
			}
		}
	});
});


$('.inventoryUnallocated').on('click', function () {
	inventoryUnallocated();
});

function inventoryUnallocated() {
	branchName = $('.brancheName').text();
	var string1;
	$.ajax({
		url: '/inventory/showUnallocated',
		type: "post",
		data: {
			branchName: branchName
		},
		dataType: 'json',
		success: function (data) {
			//console.log(data);
			if (data) {
				$.each(data, function (i, item) {

					string1 += "<tr><td>" + item.inventoryId + "</td>";
					string1 += "<td>" + item.acDescription + "</td>";
					string1 += "<td>" + item.boxType + "</td>";
					if (item.created == 0) {
						string1 += "<td></td>";
					} else {
						string1 += "<td>" + item.created + "</td>";
					}
					string1 += "<td>" + item.docType + "</td>";
					if (item.dateFrom == '1900-01-01') {
						string1 += "<td></td>";
					} else {
						string1 += "<td>" + item.dateFrom + "</td>";
					}
					if (item.dateTo == '1900-01-01') {
						string1 += "<td></td>";
					} else {
						string1 += "<td>" + item.dateTo + "</td>";
					}
					string1 += "<td><input class='addInventoryToBox' type='checkbox' value='" + item.inventoryId + "' /></td></tr>";
				});
			} else {
				string1 = '';
			}



			$('#noInventoryTable').html(string1);

			if (data) {
				counter = $('#noInventoryTable tr').length;
			} else {
				counter = 0;
			}


			$('#counter').text(counter);
		}
	});
}

$(document).on('click', '.addInventoryToBox', function (e) {
	value = $(this).val();
	addInventoryBoxId(value);
});

function showType(type) {

	subject = $('#subject').val();
	parent = $('#subject').data('parent');

	if ((type.substr(0, 3) == 'OAR' && type.length == 13) || (type.substr(0, 3) == 'OAG' && type.length == 13) || (type.substr(0, 4) == 'JPVS' && type.length == 13)) {
		$('.inventoryBlock1, .inventoryBlock2').hide();
		$('.inventorySubBlock>.mask').hide();
		$('#inventoryId').prop('disabled', true).css('background-color', '#eee');
		$('.inventoryBlock1').show();
		$('select[name=docType]').focus();
	} else if (type.substr(0, 3) == 'OAF' && type.length == 13) {
		$('.inventoryBlock1, .inventoryBlock2').hide();
		$('.inventorySubBlock>.mask').hide();
		//$('select[name=docType2]').val(11);
		//$('.dateHolder').hide();
		//$('.creditIdHolder').show();
		$('#inventoryId').prop('disabled', true).css('background-color', '#eee');
		$('.inventoryBlock1').show();
		$('select[name=docType2]').focus();
	} else if (subject == 'ProCredit Bank DOO' || subject == 'Milsped doo' || subject == 'Milsped-AML' || subject == 'JP PUTEVI SRBIJE' || subject == 'Advokat, Dr Nemanja Aleksic') {
		$('.inventoryBlock1, .inventoryBlock2').hide();
		$('.inventorySubBlock>.mask').hide();
		$('#inventoryId').prop('disabled', true).css('background-color', '#eee');
		$('.inventoryBlock1').show();
	} else if (subject == 'JP ELEKTROPRIVREDA SRBIJE') {
		$('#inventoryId').prop('disabled', true).css('background-color', '#eee');
		$('select[name=docType]').val('30');
		$('.inventorySubBlock>.mask').hide();
		$('.inventoryBlock1').show();
		$('.add').focus();
	} else if (subject == 'VTB Banka' || parent == 'VTB Banka') {
		$('#inventoryId').prop('disabled', true).css('background-color', '#eee');
		$('select[name=storingTime]').val('-1');
		$('.inventorySubBlock>.mask').hide();
		$('.inventoryBlock1').show();
		$('.add').focus();
	} else if (subject == 'JP putevi') {
		//console.log(subject);
		$('#inventoryId').prop('disabled', true).css('background-color', '#eee');
		$('.inventorySubBlock>.mask').hide();
		$('select[name=docType2]').focus();
		//$('.add').focus();
	} else if (subject == 'Malex Sequester' && type.substr(0, 3) == 'AZZ' && type.length == 13) {
		$('#inventoryId').prop('disabled', true).css('background-color', '#eee');
		$('select[name=docType]').val('26');
		$('.inventorySubBlock>.mask').hide();
		$('.inventoryBlock1').show();
		$('.add').focus();
	} else {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Neispravan broj inventara!');
		$('#inventoryId').val('');
		$('#inventoryId').focus();
	}
}

//duplo je pozivao prilikom entera
/*
$('.add').on('keypress', function(e) {
	if(e.which == 13) {
		validation($(this).data('value'));
	}
});
*/
$('.add').on('click', function (e) {
	validation($(this).data('value'));
});

function validation(value) {
	subject = $('#subject').val();
	//console.log(subject);
	error = 0;
	if (value == 1) {
		created = $('input[name=created]').val();
		docType = $('select[name=docType]').val();
		dateFrom = $('input[name=dateFrom]').val();
		dateTo = $('input[name=dateTo]').val();
		creditIdFrom = $('input[name=creditIdFrom]').val();
		creditIdTo = $('input[name=creditIdTo]').val();
	} else {
		created = $('input[name=created2]').val();
		docType = $('select[name=docType2]').val();
		dateFrom = $('input[name=dateFrom2]').val();
		dateTo = $('input[name=dateTo2]').val();
		creditIdFrom = $('input[name=creditIdFrom2]').val();
		creditIdTo = $('input[name=creditIdTo2]').val();
	}
	if (subject != 'ProCredit Bank DOO' && subject != 'Milsped doo' && subject != 'Milsped-AML' && subject != 'JP ELEKTROPRIVREDA SRBIJE' && subject != 'JP PUTEVI SRBIJE' && subject != 'Advokat, Dr Nemanja Aleksic' && subject != 'Malex Sequester') {
		if ((Math.floor(created) != created && !$.isNumeric(created)) || created == '' || created.length != 4) {
			error = 1;
			$('#message').modal();
			$('#message').find('.modal-body p').html('Godina nastanka mora biti broj<br />(npr. 2016)');
		} else if (docType == '0') {
			error = 1;
			$('#message').modal();
			$('#message').find('.modal-body p').html('Tip dokumentacije je obavezan');
		}
	}	/* else if (docType == '11') {
			if($('#inventoryId').val().substr(0, 3) == 'OAF') {
			if(!creditIdFrom) {
				error = 1;
				$('#message').modal();
				$('#message').find('.modal-body p').html('Partija od je obavezna');
			}
		} else {
			if(!creditIdFrom || !creditIdTo) {
				error = 1;
				$('#message').modal();
				$('#message').find('.modal-body p').html('Obe partije su obavezne');
			}
		}
	} else {
		if($('#inventoryId').val().substr(0, 3) == 'OAF') {
			if(!dateFrom) {
				error = 1;
				$('#message').modal();
				$('#message').find('.modal-body p').html('Datum je obavezan');
			}
		} else {
			if(!dateFrom || !dateTo) {
				error = 1;
				$('#message').modal();
				$('#message').find('.modal-body p').html('Oba datuma su obavezna');
			}
		}
	}*/

	if (error == 0 || subject == 'ProCredit Bank DOO' || subject == 'Milsped doo' || subject == 'Milsped-AML' || subject != 'JP ELEKTROPRIVREDA SRBIJE' || subject != 'JP PUTEVI SRBIJE' || subject != 'Advokat, Dr Nemanja Aleksic' || subject == 'Malex Sequester') {
		sendData(value);
	}
}

$('select[name=docType], select[name=docType2]').on('change', function () {
	subject = $('#subject').val();
	parent = $('#subject').data('parent');

	if ($(this).val() == '43' || $(this).val() == '46' || $(this).val() == '70' || $(this).val() == '78') {
		$('select[name=storingTime]').val('10');
		//$('.dateHolder').hide();
		//$('.creditIdHolder').show();
	} else if ($(this).val() >= '40' && $(this).val() <= '54') {
		$('select[name=storingTime]').val('5');
		//$('.dateHolder').show();
		//$('.creditIdHolder').hide();
	} else if ($(this).val() >= '57' && $(this).val() <= '59') {
		$('select[name=storingTime]').val('10');
	} else if ($(this).val() == '60' || $(this).val() == '67' || $(this).val() == '72') {
		$('select[name=storingTime]').val('2');
	} else if ($(this).val() >= '61' && $(this).val() <= '65') {
		$('select[name=storingTime]').val('10');
	} else if ($(this).val() == '66' || $(this).val() == '91') {
		$('select[name=storingTime]').val('1');
	} else if ($(this).val() == '68' || $(this).val() == '69' || $(this).val() == '71' || $(this).val() == '77' || $(this).val() == '79' || $(this).val() == '80' || $(this).val() == '86' || $(this).val() == '88' || $(this).val() == '100' || $(this).val() == '94' || $(this).val() == '96') {
		$('select[name=storingTime]').val('5');
	} else if ($(this).val() >= '73' && $(this).val() <= '76') {
		$('select[name=storingTime]').val('10');
	} else if ((subject == 'VTB Banka' || parent == 'VTB Banka') && $(this).val() == '20') {
		$('select[name=storingTime]').val('2');
	} else if ($(this).val() >= '81' && $(this).val() <= '84') {
		$('select[name=storingTime]').val('10');
	} else if ($(this).val() == '85' || $(this).val() == '87' || $(this).val() == '89' || $(this).val() == '90' || $(this).val() == '97' || $(this).val() == '98') {
		$('select[name=storingTime]').val('-1');
	} else if ($(this).val() == '92' || $(this).val() == '93' || $(this).val() == '95') {
		//console.log(1);
		$('select[name=storingTime]').val('10');
	} else if ($(this).val() == '99') {
		$('select[name=storingTime]').val('3');
	}
});

$('select[name=docType], select[name=docType2]').on('click', function () {
	subject = $('#subject').val();
	parent = $('#subject').data('parent');
	if (subject == 'Uprava Carina - RS min fin' || subject.indexOf('Milsped') !== -1 || subject == 'Uprava Carina - RS min fin2') {
		$('.showForCustoms').show();
	} else {
		$('.showForCustoms').hide();
	}

	if (subject == 'VTB Banka' || parent == 'VTB Banka') {
		$('.showForBank').show();
	} else {
		$('.showForBank').hide();
	}

});

function sendData(value) {
	value == 1 ? i = '' : i = '2';
	$.ajax({
		url: '/inventory/add',
		type: "post",
		data: {
			inventoryId: $('input[name=inventoryId]').val(),
			created: $('input[name=created' + i + ']').val(),
			docType: $('select[name=docType' + i + ']').val(),
			dateFrom: $('input[name=dateFrom' + i + ']').val(),
			dateTo: $('input[name=dateTo' + i + ']').val(),
			storingTime: $('select[name=storingTime' + i + ']').val(),
			description: $('textarea[name=description' + i + ']').val(),
			note: $('textarea[name=note' + i + ']').val(),
			creditIdFrom: $('input[name=creditIdFrom' + i + ']').val(),
			creditIdTo: $('input[name=creditIdTo' + i + ']').val(),
			subject: $('input[name=subject]').val(),
			arhiveNo: $('input[name=arhiveNo]').val(),
			note3: $('textarea[name=acContent]').val(),
			created3: $('input[name=createdTo]').val(),
			contentType: $('select[name=contentType]').val(),
		},
		dataType: 'json',
		success: function (data) {
			if (data.ok == 'T') {
				showGrid();
			} else if (data.ok == 'F') {
				$('input[name=inventoryId]').prop('disabled', false).css('background-color', '#fff').val('').focus();
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			}
		}
	});
}

function showGrid() {
	resetFields();

	if ($('input[name=subject]').val() == 'ProCredit Bank DOO' || $('input[name=subject]').val() == 'Advokat, Dr Nemanja Aleksic' || $('input[name=subject]').val() == 'Malex Sequester') {
		$('#proCreditHide').hide();
		if ($('input[name=subject]').val() == 'ProCredit Bank DOO' || $('input[name=subject]').val() == 'Malex Sequester') {
			$('#importExcel').show();
		}
	} else {
		$('#proCreditHide').show();
		$('#importExcel').hide();
	}

	$.ajax({
		url: '/inventory/showGrid',
		type: "post",
		data: {
			subject: $('input[name=subject]').val(),
			type: $('input[name=subject]').data['type']
		},
		dataType: 'json',
		success: function (data) {
			$('.showGrid').show();
			var string;
			if (data) {
				$.each(data, function (i, item) {

					string += "<tr><td>" + item.inventoryId + "</td>";
					string += "<td>" + item.boxType + "</td>";
					string += "<td>" + item.created + "</td>";
					string += "<td>" + item.docType + "</td>";
					if (item.dateFrom == '1900-01-01') {
						string += "<td>" + item.refFrom + "</td>";
						string += "<td>" + item.refTo + "</td>";
					} else {
						string += "<td>" + item.dateFrom + "</td>";
						string += "<td>" + item.dateTo + "</td>";
					}
					if (item.storing == '-1') {
						string += "<td>Trajno</td>";
					} else {
						string += "<td>" + item.storing + "</td>";
					}
					string += "<td><input type='checkbox' value='" + item.inventoryId + "' /></td>";
				});

				$('#dynTable').html(string);
			} else {
				$('.showGrid').hide();
			}
		}
	});
}

$('#importExcel').on('click', function () {
	$('#confirm').modal();
	$('#confirm').find('.modal-title').html("Unos fajla");
	$('#confirm').find('.modal-body').html(
		"<form id='importFileExcel' action='/inventory/importFiles' method='post' enctype='multipart/form-data' >" +
		"<div class='container' style='margin-top: 20px;'>" +
		"<div class='row'>" +
		"<div class='col-lg-4 col-sm-6 col-12'>" +
		"<div class='input-group'>" +
		"<label class='input-group-btn'>" +
		"<span class='btn btn-primary'>" +
		"Browse&hellip; <input type='file' name='cover_image' style='display: none;'>" +
		"</span>" +
		"</label>" +
		"<input type='text' class='form-control' readonly>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</form>"
	);
	$(function () {

		// We can attach the `fileselect` event to all file inputs on the page
		$(document).on('change', ':file', function () {
			var input = $(this),
				numFiles = input.get(0).files ? input.get(0).files.length : 1,
				label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
			input.trigger('fileselect', [numFiles, label]);
		});

		// We can watch for our custom `fileselect` event like this
		$(document).ready(function () {
			$(':file').on('fileselect', function (event, numFiles, label) {

				var input = $(this).parents('.input-group').find(':text'),
					log = numFiles > 1 ? numFiles + ' files selected' : label;

				if (input.length) {
					input.val(log);
				} else {
					if (log) alert(log);
				}

			});
		});

	});
	$('#confirm').find('.modal-footer').html(
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>" +
		"<button type='submit' class='btn btn-success confirmFileInport' data-dismiss='modal'>Potvrdi</button>"
	);
	$('.confirmFileInport').on('click', function (e) {
		e.preventDefault();
		$('#importFileExcel').submit();
	});
});


$('.cancelIinventoryBlock').on('click', function () {
	resetFields();
});

function resetFields() {
	$('#inventoryId').prop('disabled', false).css('background-color', '#fff').val('').focus();
	$('.inventorySubBlock>.mask').show();
	$('.inventorySubBlock').find('input').val('');
	$('.inventorySubBlock').find('select').val('0');
	$('.inventorySubBlock').find('textarea').val('');
}

$('.deleteInventoryId').on('click', function () {
	//$('#confirm').modal();
	//$('#confirm').find('.btn.btn-success').focus();
	var page;
	var string;
	var i = 1;
	$('#dynTable').find('input[type=checkbox]:checked').map(function () {
		string += i + ". " + $(this).val() + "<br/>";
		i++;
	});
	if ($(this).data('type') == 'unallocated') {
		page = 'unallocated';
	}
	if (i > 1) {
		$('#confirm').modal();
		$('#confirm').find('.btn.btn-success').focus();
		$('#confirm').find('.modal-body span').html(string.replace('undefined', ''));
	}

	var id = $('#dynTable').find('input[type=checkbox]:checked').map(function () {
		return $(this).val();
	}).get();

	$('.deleteInventoryConfirm').on('click', function () {
		$.ajax({
			url: '/inventory/deleteInventoryId',
			type: "post",
			data: {
				inventoryId: id,
			},
			dataType: 'json',
			success: function (data) {

				if (data.ok == 'T') {
					$('#confirm').modal('toggle');
					if (page) {
						$('#dynTable').find('input[type=checkbox]:checked').closest('tr').remove();
					} else {
						showGrid();
					}


				} else if (data.ok == 'F') {
					$('#confirm').modal('toggle');
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
				}
			}
		});
	});

});

$('#changeSubject').on('click', function () {
	resetFields();
	$('#inventoryId').val();
	$('.inventoryBlock>.mask').show();
	$('input[name=subject]').val('').prop('disabled', false).css('background', '#fff').focus();
	$('#dynTable').html('');

});

//addBox

$('#subjectBox').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(gradovi)
	}).on('typeahead:selected', function (obj, value) {
		showSubjectInfo();
		createHead();
	});

function createHead() {
	$.ajax({
		url: '/inventory/createHead',
		type: "post",
		data: {
			name: $('#subjectBox').val(),
		},
		dataType: 'json',
		success: function (data) {
			if (data.key == 'Vec imate otvoren nalog') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.key);
				setTimeout(function () {
					window.location.href = '/inventory/addBox';
				}, 1000);

			} else if (data.key == 'Fakturisanje nije dostupno<br> Pokusajte ponovo!!') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.key);
			} else {
				$('.showBlockToStor').show();
				$('#key').html(data.key);
				$('.mask').hide();
				$('input[name=boxNumber]').focus();
			}

		}
	});
}

function showSubjectInfo() {

	if (typeof $('#clientBox').val() !== "undefined") {
		name = $('#clientBox').val();
	} else if (typeof $('#sectorName').val() !== "undefined") {
		name = $('#sectorName').val();
	} else if (typeof $('#sectorName1').val() !== "undefined") {
		name = $('#sectorName1').val();
	} else {
		name = $('#subjectBox').val();
	}

	$.ajax({
		url: '/subjects/getData',
		type: "post",
		data: {
			name: name,
		},
		dataType: 'json',
		success: function (data) {
			//$('#removableSector').remove();
			string =
				'<div class="well" style="height:85px;">' +
				'<div class="col-sm-4">' +
				'<b><span class="brancheName">' + data.name + '</span><br>' +
				data.address + '<br>' +
				data.zipCode + ' ' + data.city + '</b>' +
				'</div>' +
				'<div class="col-sm-4">' +
				'<table>' +
				'<tr>' +
				'<td>PIB:</td>' +
				'<td>&nbsp;&nbsp;&nbsp;&nbsp;</td>' +
				'<td>' + data.pib + '</td>' +
				'</tr>' +
				'<tr>' +
				'<td>Maticni broj:</td>' +
				'<td></td>' +
				'<td>' + data.companyNumber + '</td>' +
				'</tr>' +
				'<tr>' +
				'<td>Broj ugovora:</td>' +
				'<td></td>' +
				'<td>' + data.contractNumber + '</td>' +
				'</tr>' +
				'</table>' +
				'</div>' +
				'<div class="col-sm-4">' +
				'<table>' +
				'<tr>' +
				'<td>Kontakt osoba:</td>' +
				'<td>&nbsp;&nbsp;&nbsp;&nbsp;</td>' +
				'<td>' + data.contactPerson + '</td>' +
				'</tr>' +
				'<tr>' +
				'<td>Kontakt telefon:</td>' +
				'<td></td>' +
				'<td>' + data.contactPhone + '</td>' +
				'</tr>' +
				'<tr>' +
				'<td>E-mail:</td>' +
				'<td></td>' +
				'<td>' + data.contactEmail + '</td>' +
				'</tr>' +
				'</table>' +
				'</div>' +
				'</div>';

			$('.subjectHolder').html(string);

			if (typeof $('input[name=addBoxOut]').val() !== "undefined") {
				name = $('input[name=addBoxOut]').focus();
			}

			$('#subjectBox').closest('.row').remove();
			$('.changeDocumentInfo').show();
			inventoryUnallocated();
		}
	});
}

$('input[name=boxNumber]').on('keydown', function (e) {
	thisItem = $(this);
	if (e.which == 13 || e.which == 9) {
		$.ajax({
			url: '/inventory/addBoxId',
			type: "post",
			data: {
				key: $('#key').text(),
				boxId: thisItem.val()
			},
			dataType: 'json',
			success: function (data) {
				if (data.ok != 'T') {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
					$('input[name=boxNumber]').val('');
				} else {
					thisItem.prop('disabled', true);
					$('input[name=boxPosition]').val(data.position);
					$('input[name=inventoryIdBox]').focus();
				}
			}
		});
	}
});

$(document).on('keydown', 'input[name=inventoryIdBox]', function (e) {
	thisItem = $(this);
	if (e.which == 13 || e.which == 9) {
		var invType = $('#boxItems').find('.boxType').stop().map(function () {
			if ($(this).text() == 'Registrator') {
				return $(this).text();
			}
		}).get();

		if ((invType.length + 1) > 5) {
			$('#confirm').modal();
		} else {
			addInventoryBoxId(thisItem.val());
			$('input[name=inventoryIdBox]').focus();
		}


	}
});

$('.confirmAdding').on('click', function () {
	addInventoryBoxId(thisItem.val());
});

function addInventoryBoxId(value) {

	subject = $('.brancheName').text();

	$.ajax({
		url: '/inventory/addInventoryBoxId',
		type: "post",
		data: {
			subject: subject,
			key: $('#key').text(),
			boxId: $('input[name=boxNumber]').val(),
			inventoryId: value,
			position: $('input[name=boxPosition]').val(),
		},
		dataType: 'json',
		success: function (data) {
			if (data.ok != 'T') {
				if (($("#confirm").data('bs.modal') || {}).isShown) {
					$('#confirm').modal('toggle');
				}
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
				$('input[name=inventoryIdBox]').val('');
			} else {
				if (($("#confirm").data('bs.modal') || {}).isShown) {
					$('#confirm').modal('toggle');
				}
				getInventoryBoxId();
				inventoryUnallocated();
				$('input[name=inventoryIdBox]').focus();
			}
		}
	});
}

function getInventoryBoxId() {
	$.ajax({
		url: '/inventory/getInventoryBoxId',
		type: "post",
		data: {
			key: $('#key').text(),
			boxId: $('input[name=boxNumber]').val(),
		},
		success: function (data) {
			$('#boxItems').html(data);
			$('input[name=inventoryIdBox]').focus();
		}
	});
}

$(document).on('click', '.closeBox', function (e) {
	var rowCount = $('#boxItems tr').length;

	if (rowCount == 1) {
		$('#message').modal();
		$('#message').find('.modal-body p').html("Ne mozete zatvoriti praznu kutiju!");
	} else {
		$('#boxItems').html("<tr><td><input type='text' name='inventoryIdBox' placeholder='Skeniraj bar code' class='form-control'/></td><td colspan='4'></td></tr>");

		$.ajax({
			url: '/inventory/getBoxItems',
			type: "post",
			data: {
				key: $('#key').text(),
				boxId: $('input[name=boxNumber]').val()
			},
			success: function (data) {
				$('input[name=boxNumber]').prop('disabled', false);
				$('input[name=boxNumber]').val('');
				$('input[name=boxNumber]').focus();
				$('#showBoxItems').html(data);
			}
		});
	}
});

$(document).on('click', '.deleteReceipts', function (e) {
	var receiptsId = [];
	$('.deleteReceiptsId').each(function (index) {
		if (this.checked) {
			receiptsId += $(this).val() + ' ';
		}
	});

	$.ajax({
		url: '/inventory/deleteReceipts',
		type: "post",
		data: {
			receiptsId: receiptsId
		},
		success: function (data) {
		}
	});
});

$(document).on('click', '.closeReceipts', function (e) {
	key = $('#key').text();
	subject = $('.brancheName').text();

	block = $('select[name=blockType]').val();

	if (block == '0') {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Morate da izaberete blok!');
	} else {
		$.ajax({
			url: '/inventory/confirmMove',
			type: "post",
			data: {
				key: key,
				subject: subject,
				block: block
			},
			dataType: 'json',
			success: function (data) {
				if (data.ok == 'F') {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
				} else if (data.ok == 'T') {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
					setTimeout(function () {
						window.location.href = '/inventory/viewReceipts';
					}, 1000);
				}
			}
		});
	}
});

$(document).on('keydown', 'input[name=shelf]', function (e) {
	thisItem = $(this);
	if (e.which == 13 || e.which == 9) {
		subject = $("#orderKey").data('subject');
		var boxKey;
		if (subject == 'Generali Osiguranje Srbija ado') {
			tmpBox = $('#boxIdMapping').val();
			if (tmpBox.substr(0, 4) == 'BOX0') {
				boxKey = $('#boxIdMapping').val();
			} else {
				tmp = $('#boxIdMapping').val();
				cnt = $('#boxIdMapping').val().length;

				for (cnt; cnt < 9; cnt++) {
					tmp = "0" + tmp;
				}

				boxKey = "BOXX" + tmp;
			}

		} else {
			boxKey = $('#boxIdMapping').val();
		}
		$.ajax({
			url: '/inventory/mappingBox',
			type: "post",
			data: {
				orderKey: $('#orderKey').text(),
				key: $('#shelf').val(),
				boxId: boxKey
			},
			dataType: 'json',
			success: function (data) {
				//console.log(data);
				if (data.ok != 'T') {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
					$('input[name=shelf]').val('');
				} else {

					$('input[name=shelf]').val('');
					$('input[name=shelf]').prop('disabled', true);
					$('input[name=boxIdMapping]').prop('disabled', false);
					$('input[name=boxIdMapping]').val('');
					$('input[name=boxIdMapping]').focus();
					id = $("#" + data.boxId).selector;
					//console.log(id);
					ss = $("div." + data.boxId).text();
					$(id).remove();
					$("div." + data.boxId).remove();
					$('.mappingDone').append(
						"<div class=" + data.boxId + ">" +
						"<span class='mapKey'>" + data.key + "</span> - " +
						"<span class='boxKey'>" + data.boxId + "</span> " +
						"<a href='#' class='closeMapLocation deleteTempLocation' data-box=" + data.boxId + " data-dismiss='alert' aria-label='close'>&times;</a>" +
						"</div><br/>"
					);
				}
			}
		});
	}
});


$(document).on('click', '.deleteTempLocation', function (e) {
	var boxs = $(this).data('box');
	$.ajax({
		url: '/inventory/deleteTempLocation',
		type: "post",
		data: {
			box: $(this).data('box'),
			orderKey: $('#orderKey').text()
		},
		dataType: 'json',
		success: function (data) {
			tmp = $('.mapingInfo span').length;
			maxNo = tmp + 1;
			$('.' + boxs + 'a').hide();
			$('.mapingInfo ').append(
				"<span id=" + boxs + ">" + maxNo + ". " + boxs + "</span> <span style='float:right' class=" + boxs + ">" + $('.' + boxs + 'a').text() + "</span><br/>"
			);
			$("div." + boxs).remove();
		}
	});
});

$(document).on('keydown', 'input[name=boxIdMapping]', function (e) {
	thisItem = $(this);
	if (e.which == 13 || e.which == 9) {
		subject = $("#orderKey").data('subject');
		var boxKey;
		if (subject == 'Generali Osiguranje Srbija ado') {
			tmpBox = $('#boxIdMapping').val();
			if (tmpBox.substr(0, 4) == 'BOX0') {
				boxKey = $('#boxIdMapping').val();
			} else {
				tmp = $('#boxIdMapping').val();
				cnt = $('#boxIdMapping').val().length;

				for (cnt; cnt < 9; cnt++) {
					tmp = "0" + tmp;
				}

				boxKey = "BOXX" + tmp;
			}

		} else {
			boxKey = $('#boxIdMapping').val();
		}


		$.ajax({
			url: '/inventory/checkBoxOrder',
			type: "post",
			data: {
				key: boxKey,
				orderKey: $('#orderKey').text()
			},
			dataType: 'json',
			success: function (data) {
				//console.log(data);
				if (data) {

					$.ajax({
						url: '/inventory/checkBoxMap',
						type: "post",
						data: {
							key: boxKey,
							orderKey: $('#orderKey').text()
						},
						dataType: 'json',
						success: function (data) {
							//console.log(data);
							if (data) {
								$('#message').modal();
								$('#message').find('.modal-body p').html("Data kutija već ima rezervisanu lokaciju!");

								$('input[name=boxIdMapping]').prop('disabled', false);
								$('input[name=shelf]').prop('disabled', true);
								$('input[name=boxIdMapping]').focus();
								$('#boxIdMapping').focus();
								$('input[name=boxIdMapping]').val('');
							} else {
								$('input[name=boxIdMapping]').prop('disabled', true);
								$('input[name=shelf]').prop('disabled', false);
								$('input[name=shelf]').focus();
								$('#shelf').focus();
							}
						}
					});
				} else {
					$('#message').modal();
					$('#message').find('.modal-body p').html("Data kutija se ne nalazi na nalogu!");
					$('input[name=boxIdMapping]').val('');
				}
			}
		});
	}
});

$(document).on('keydown', 'input[name=boxIdMappingNoKey]', function (e) {

	thisItem = $(this);
	if (e.which == 13 || e.which == 9) {
		subject = $("#orderKey").data('subject');
		var boxKey;
		if (subject == 'Generali Osiguranje Srbija ado') {
			tmpBox = $('#boxIdMapping').val();
			if (tmpBox.substr(0, 4) == 'BOX0') {
				boxKey = $('#boxIdMapping').val();
			} else {
				tmp = $('#boxIdMapping').val();
				cnt = $('#boxIdMapping').val().length;

				for (cnt; cnt < 9; cnt++) {
					tmp = "0" + tmp;
				}

				boxKey = "BOXX" + tmp;
			}

		} else {
			boxKey = $('#boxIdMappingNoKey').val();
		}


		$.ajax({
			url: '/inventory/checkBoxOrderNoKey',
			type: "post",
			data: {
				key: boxKey
			},
			dataType: 'json',
			success: function (data) {

				if (data) {
					var orderKey = data.acKey;
					var subject = data.acConsignee;
					$.ajax({
						url: '/inventory/checkBoxMap',
						type: "post",
						data: {
							key: boxKey,
							orderKey: orderKey
						},
						dataType: 'json',
						success: function (data) {
							//console.log(data);
							if (data) {
								$('#message').modal();
								$('#message').find('.modal-body p').html("Data kutija već ima rezervisanu lokaciju!");

								$('input[name=boxIdMappingNoKey]').prop('disabled', false);
								$('input[name=shelfNoKey]').prop('disabled', true);
								$('input[name=boxIdMappingNoKey]').focus();
								$('#boxIdMapping').focus();
								$('input[name=boxIdMappingNoKey]').val('');
							} else {
								$('input[name=boxIdMappingNoKey]').prop('disabled', true);
								$('input[name=boxIdMappingNoKey]').attr('data-key', orderKey);
								$('input[name=boxIdMappingNoKey]').attr('data-subject', subject);
								$('input[name=shelfNoKey]').prop('disabled', false);
								$('input[name=shelfNoKey]').focus();
								$('#shelfNoKey').focus();
							}
						}
					});
				} else {
					$('#message').modal();
					$('#message').find('.modal-body p').html("Data kutija se ne nalazi na nalogu!");
					$('input[name=boxIdMappingNoKey]').val('');
				}
			}
		});
	}
});

$(document).on('keydown', 'input[name=shelfNoKey]', function (e) {
	thisItem = $(this);
	if (e.which == 13 || e.which == 9) {
		subject = $('input[name=boxIdMappingNoKey]').attr('data-subject');

		var boxKey;
		if (subject == 'Generali Osiguranje Srbija ado') {
			tmpBox = $('#boxIdMappingNoKey').val();
			if (tmpBox.substr(0, 4) == 'BOX0') {
				boxKey = $('#boxIdMappingNoKey').val();
			} else {
				tmp = $('#boxIdMappingNoKey').val();
				cnt = $('#boxIdMappingNoKey').val().length;

				for (cnt; cnt < 9; cnt++) {
					tmp = "0" + tmp;
				}

				boxKey = "BOXX" + tmp;
			}

		} else {
			boxKey = $('#boxIdMappingNoKey').val();
		}
		$.ajax({
			url: '/inventory/mappingBox',
			type: "post",
			data: {
				orderKey: $('input[name=boxIdMappingNoKey]').attr('data-key'),
				key: $('#shelfNoKey').val(),
				boxId: boxKey
			},
			dataType: 'json',
			success: function (data) {
				if (data.ok != 'T') {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
					$('input[name=shelfNoKey]').val('');
				} else {
					$('input[name=shelfNoKey]').val('');
					$('input[name=shelfNoKey]').prop('disabled', true);
					$('input[name=boxIdMappingNoKey]').prop('disabled', false);
					$('input[name=boxIdMappingNoKey]').val('');
					$('input[name=boxIdMappingNoKey]').focus();
				}
			}
		});
	}
});

$('.editInventory').on('click', function (e) {
	serialNo = $(this).closest('tr').find('.serialNo').text();

	$.ajax({
		url: "/inventory/identInfoTemp",
		type: "post",
		data: {
			ident: serialNo
		},
		dataType: 'json',
		success: function (data) {
			$('#editInventoryModal').modal();
			$('#editInventoryModal').find('.modal-header h4').html(" Editovanje <span id='serialInfo'>" + serialNo + "</span>");

			$('#editInventoryModal').find('.modal-body').html(
				"<span>Tip dokumentacije</span>" +
				"<div class='modelDiv'>" +
				"<select id='documentType' name='docType2' class='width100 noBorder' title='Tip dokumentacije'>"
			);

			if (data.docType != ' ') {
				$('#editInventoryModal').find('.modal-body div select[name=docType2]').append(
					"<option value=" + data.docTypeId + ">" + data.docType + "</option>"
				);
			} else {
				$('#editInventoryModal').find('.modal-body div select[name=docType2]').append(
					"<option value='0'>Izaberite</option>"
				);
			}

			$.each(data.inventoryType, function (key, value) {
				$('#editInventoryModal').find('.modal-body div select[name=docType2]').append(
					"<option value=" + value.id + ">" + value.name + "</option>"
				);
			});

			$('#editInventoryModal').find('.modal-body').append(
				"</select>" +
				"</div>" +
				"<span>Opis</span>" +
				"<div class='modelDiv div2'>"
			);

			if (data.description != ' ') {
				$('#editInventoryModal').find('.modal-body .div2').append(
					"<input class='noBorder description width100' value='" + data.description + "' title='Opis' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div2').append(
					"<input class='noBorder description width100' placeholder='Opis' title='Opis' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span>Godina nastanka od</span>" +
				"<div class='modelDiv div3'>"
			);

			if (data.created != ' ') {
				$('#editInventoryModal').find('.modal-body .div3').append(
					"<input class='noBorder created width100' value='" + data.created + "' title='Godina nastanka od' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div3').append(
					"<input title='Godina nastanka od' placeholder='Godina nastanka od' class='noBorder created width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span>Godina nastanka do:</span>" +
				"<div class='modelDiv div9'>"
			);

			if (data.anCreatedTo != 0) {
				$('#editInventoryModal').find('.modal-body .div9').append(
					"<input class='noBorder anCreatedTo width100' value='" + data.anCreatedTo + "' title='Godina nastanka do' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div9').append(
					"<input title='Godina nastanka do' placeholder='Godina nastanka do' class='noBorder anCreatedTo width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span>Rok čuvanja</span>" +
				"<div class='modelDiv'>" +
				"<select id ='storingTime' name='storingTime' class='width100 noBorder' title='Rok čuvanja'>"
			);

			if (data.storing != ' ') {
				if (data.storing == '-1') {
					$('#editInventoryModal').find('.modal-body div select[name=storingTime]').append(
						"<option value=" + data.storing + ">Trajno</option>" +
						"<option value='1'>1 godina</option>"
					);
				} else {
					$('#editInventoryModal').find('.modal-body div select[name=storingTime]').append(
						"<option value=" + data.storing + ">" + data.storing + " god.</option>" +
						"<option value='1'>1 godina</option>"
					);
				}

			} else {
				$('#editInventoryModal').find('.modal-body div select[name=storingTime]').append(
					"<option value='1'>1 godina</option>"
				);
			}

			$('#editInventoryModal').find('.modal-body div select[name=storingTime]').append(

				"<option value='3'>3 godine</option>" +
				"<option value='5'>5 godina</option>" +
				"<option value='7'>7 godina</option>" +
				"<option value='10'>10 godina</option>" +
				"<option value='25'>25 godina</option>" +
				"<option value='-1'>Trajno</option>"
			);

			$('#editInventoryModal').find('.modal-body').append(
				"</select>" +
				"</div>" +
				"<span>Napomena</span>" +
				"<div class='modelDiv div4'>"
			);

			if (data.note != ' ') {
				$('#editInventoryModal').find('.modal-body .div4').append(
					"<input class='noBorder note width100' value='" + data.note + "' title='Napomena' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div4').append(
					"<input title='Napomena' placeholder='Napomena' class='noBorder note width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span>Datum od</span>" +
				"<div class='modelDiv div5'>"
			);

			if ((data.dateFrom != '1900-01-01') && (data.dateFrom != '1970-01-01')) {
				$('#editInventoryModal').find('.modal-body .div5').append(
					"<input class='noBorder dateFrom width100' value='" + data.dateFrom + "' title='Datum od' type='date' />"
				);

			} else {
				$('#editInventoryModal').find('.modal-body .div5').append(
					"<input title='Datum od' placeholder='Datum od' class='noBorder dateFrom width100' type='date' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span>Datum do</span>" +
				"<div class='modelDiv div6'>"
			);

			if ((data.dateTo != '1900-01-01') && (data.dateTo != '1970-01-01')) {
				$('#editInventoryModal').find('.modal-body .div6').append(
					"<input class='noBorder dateTo width100' value='" + data.dateTo + "' title='Datum do' type='date' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div6').append(
					"<input title='Datum do' placeholder='Datum do' class='noBorder dateTo width100' type='date' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>"
			);

			if (data.refIdFrom != ' ') {
				$('#editInventoryModal').find('.modal-body').append(
					"<span>Partija od</span>" +
					"<div class='modelDiv div7'>" +
					"<input class='noBorder refIdFrom width100' value='" + data.refIdFrom + "' title='Partija od' type='text' />" +
					"</div>"
				);
			} else {
				$('#editInventoryModal').find('.modal-body').append(
					"<span>Partija od</span>" +
					"<div class='modelDiv div7'>" +
					"<input title='Partija od' placeholder='Partija od' class='noBorder refIdFrom width100' type='text' />" +
					"</div>"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>"
			);

			if (data.refIdTo != ' ') {
				$('#editInventoryModal').find('.modal-body').append(
					"<span>Partija do</span>" +
					"<div class='modelDiv div8'>" +
					"<input class='noBorder refIdTo width100' value='" + data.refIdTo + "' title='Partija do' type='text' />" +
					"</div>"
				);
			} else {
				$('#editInventoryModal').find('.modal-body').append(
					"<span>Partija do</span>" +
					"<div class='modelDiv div8'>" +
					"<input title='Partija do' placeholder='Partija do' class='noBorder refIdTo width100' type='text' />" +
					"</div>"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span>Arhivski broj:</span>" +
				"<div class='modelDiv div10'>"
			);

			if (data.acArhiveNo != ' ') {
				$('#editInventoryModal').find('.modal-body .div10').append(
					"<input class='noBorder acArhiveNo width100' value='" + data.acArhiveNo + "' title='Arhivski broj' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div10').append(
					"<input title='Arhivski broj' placeholder='Arhivski broj' class='noBorder acArhiveNo width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span>Sadržaj:</span>" +
				"<div class='modelDiv div11'>"
			);

			if (data.acContent != ' ') {
				$('#editInventoryModal').find('.modal-body .div11').append(
					"<input class='noBorder acContent width100' value='" + data.acContent + "' title='Sadržaj' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div11').append(
					"<input title='Sadržaj' placeholder='Sadržaj' class='noBorder acContent width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"<span>Tip sadržaja:</span>" +
				"<div class='modelDiv' >" +
				"<select id='acContentType' name='contentType' class='width100 noBorder' title='Tip sadržaja'>"
			);

			if (data.acContentType != ' ') {
				$('#editInventoryModal').find('.modal-body div select[name=contentType]').append(
					"<option value=" + data.anContentType + ">" + data.acContentType + "</option>"
				);
			} else {
				$('#editInventoryModal').find('.modal-body div select[name=contentType]').append(
					"<option value='0'>Izaberite</option>"
				);
			}

			$.each(data.contentType, function (key, value) {
				$('#editInventoryModal').find('.modal-body div select[name=contentType]').append(
					"<option value=" + value.id + ">" + value.name + "</option>"
				);
			});
		}
	});

});

$('.confirmEdit').on('click', function (e) {
	docType = $('#documentType').find(":selected").val();
	description = $('.description').val();
	created = $('.created').val();
	anCreatedTo = $('.anCreatedTo').val();
	storingTime = $('#storingTime').find(":selected").val();
	note = $('.note').val();
	dateFrom = $('.dateFrom').val();
	dateTo = $('.dateTo').val();
	refIdTo = $('.refIdTo').val();
	refIdFrom = $('.refIdFrom').val();
	acArhiveNo = $('.acArhiveNo').val();
	acContent = $('.acContent').val();
	anContentType = $('#acContentType').find(":selected").val();
	//console.log(docType);
	key = $('#serialInfo').text();
	$.ajax({
		url: "/inventory/updateIdent",
		type: "post",
		data: {
			docType: docType,
			description: description,
			created: created,
			storingTime: storingTime,
			note: note,
			dateFrom: dateFrom,
			dateTo: dateTo,
			refIdTo: refIdTo,
			refIdFrom: refIdFrom,
			key: key,
			anCreatedTo: anCreatedTo,
			acArhiveNo: acArhiveNo,
			acContent: acContent,
			anContentType: anContentType
		},
		dataType: 'json',
		success: function (data) {
			$('#editInventoryModal').modal('hide');

			$('#message').modal();
			$('#message').find('.modal-body p').html(data.message);
			$('#message').find('.modal-footer').html(
				"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
			);
			setTimeout(function () {
				location.reload();
			}, 2000);
		}
	});
});

$(document).on('click', '.closeMapping', function (e) {
	orderKey = $('#orderKey').text();
	boxKey = $('.boxKey').text();
	$('.closeMapping').prop('disabled', true);
	boxLenght = $('.mapingInfo').children('span').length;
	allreadyMap = $('.deleteTempLocation').length;
	//console.log(boxLenght);
	//console.log(allreadyMap);
	if (boxLenght == 0 || boxLenght == allreadyMap) {
		$.ajax({
			url: '/inventory/finishTransfer',
			type: "post",
			data: {
				boxKey: boxKey,
				orderKey: orderKey
			},
			dataType: 'json',
			success: function (data) {
				//console.log(data);
				if (data.ok == 'T') {
					$('input[name=boxIdMapping]').prop('disabled', true);
					$('input[name=shelf]').prop('disabled', true);
					$('input[name=shelf]').focus();
					$('#message').modal();
					$('#message').find('.modal-body p').html("Kreiran nalog " + data.key);
					setTimeout(function () {
						window.location.href = '/inventory/orderView';
					}, 1000);
				} else {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
					$('.closeMapping').prop('disabled', false);
				}
			}
		});
	} else {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Morate da mapirate sve kutije prvo!');
		$('.closeMapping').prop('disabled', false);
	}

});

mainClient = [];
$.ajax({
	url: "/subjects/get",
	type: "post",
	data: {
		type: 't'
	},
	dataType: 'json',
	async: false,
	success: function (data) {
		mainClient = data;
	}
});

$('#clientBox').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(mainClient)
	}).on('typeahead:selected', function (obj, value) {
		showSubjectInfo();
		showBranch();
	});

$('#clientBox1').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(mainClient)
	}).on('typeahead:selected', function (obj, value) {
		showPriceScan();
	});

function showBranch() {

	name = $('#clientBox').val();;
	var j = 0;
	var z = 0;
	var y = 0;
	$.ajax({
		url: '/inventory/clientSearch',
		type: "post",
		data: {
			name: name,
		},

		success: function (data) {
			$('.branchHolder').html(data);
		}
	});
}

$(document).on('click', '.showInformation', function (e) {
	parent = $(this).parent().parent().find('.showDoc');
	parent.toggle();
	$(this).toggleClass("glyphicon-plus-sign glyphicon-minus-sign");
});

$(document).on('click', '.showDoc', function (e) {
	subParent = $(this).parent().parent().find('.showDocSub');
	subParent.toggle();
	//$(this).toggleClass("glyphicon-plus-sign glyphicon-minus-sign");
});

$(document).on('change', 'select[name=branchNames]', function (e) {
	id = $(this).val().split(' ').join('_');;
	//console.log(id);
	if (id != 'Izaberite filijalu') {
		$('.rowHolder').hide();
		$('.' + id).show();
	} else {
		$('.rowHolder').show();
	}

});

$(document).on('click', '.dailyBoxCompany', function (e) {
	$('.mainFog').show();
	$('.mainFogImage').show();
	$('#filterSearch').submit();
});

///////////////////////////////////////////////////
////////////////DETALJNA PRETRAGA/////////////////
/////////////////////////////////////////////////

$(document).on('click', '.searchSearialV3', function (e) {
	acSearch = $("[name=acSearch]").val();
	acSerialNo = $('[name=acSerialNo]').val();
	acIdent = $('[name=acIdent]').val();
	acBlock = $('[name=acBlock]').val();
	acUerId = $('[name=acUerId]').val();
	docType = $('[name=acDocType]').val();
	adTimeInsFrom = $('[name=adTimeInsFrom]').val();
	adTimeInsTo = $('[name=adTimeInsTo]').val();
	acBoxType = $('[name=acBoxType]').val();
	inventory = $('[name=inventory]').val();
	acDescription = $('input[name=acDescription]').val();
	anYearTo = $('[name=anYearTo]').val();
	keepDate = $('[name=anStoring]').val();
	anYearFrom = $('[name=anYearFrom]').val();
	dateToSerial = $('[name=dateToSerial]').val();
	acNote = $('[name=acNote]').val();
	var subject = $('[name=acCompany]').val();
	sector = $('[name=acSector]').val();
	acRefId = $('[name=acRefId]').val();
	acCreditNumber = $('[name=acCreditNumber]').val();
	anTop = $('[name=anTop]').val();
	acContent = $('[name=acContent]').val();
	adDateFrom = $('[name=adDateFrom]').val();
	adDateTo = $('[name=adDateTo]').val();
	acContentType = $('[name=acContentType]').val();
	acArhiveNo = $('[name=acArhiveNo]').val();
	anCreatedTo = $('[name=anCreatedTo]').val();
	acBoxDescrStr = $('[name=acBoxDescrStr]').val();
	acBoxDescription = $('[name=acBoxDescription]').val();
	acCreditTypeDescription = $('[name=acCreditTypeDescription]').val();
	acProductType = $('[name=acProductType]').val();
	acDepartment = $('[name=acDepartment]').val();
	acRegistrationNo = $('[name=acRegistrationNo]').val();
	acName = $('[name=acName]').val();
	$('.mainFog').show();
	$('.mainFogImage').show();
	$.ajax({
		url: "/inventory/filterSearch",
		type: "post",
		data: {
			acSearch: acSearch,
			acSerialNo: acSerialNo,
			acIdent: acIdent,
			acBlock: acBlock,
			acUerId: acUerId,
			acDocType: docType,
			adTimeInsFrom: adTimeInsFrom,
			adTimeInsTo: adTimeInsTo,
			acBoxType: acBoxType,
			adDateFrom: adDateFrom,
			adDateTo: adDateTo,
			acDescription: acDescription,
			anYearTo: anYearTo,
			anStoring: keepDate,
			anYearFrom: anYearFrom,
			dateToSerial: dateToSerial,
			acNote: acNote,
			acCompany: subject,
			acSector: sector,
			acRefId: acRefId,
			acContent: acContent,
			acContentType: acContentType,
			acArhiveNo: acArhiveNo,
			anCreatedTo: anCreatedTo,
			acBoxDescrStr: acBoxDescrStr,
			acCreditNumber: acCreditNumber,
			acBoxDescription: acBoxDescription,
			acCreditTypeDescription: acCreditTypeDescription,
			acProductType: acProductType,
			acDepartment: acDepartment,
			acRegistrationNo: acRegistrationNo,
			anTop: anTop,
			acName: acName
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			var cntData;
			var cntBoxArray = [];
			var cntBox;
			if (data != null) {
				cntData = data.length;
				$.each(data, function (i, d) {
					if ($.inArray(d.ident, cntBoxArray) != -1) {

					} else {
						cntBoxArray.push(d.ident);
					}
				});
				cntBox = cntBoxArray.length;
			} else {
				cntData = 0;
			}

			if (cntData == 0) {
				string =
					'<div class="alert alert-info" style="font-size: 15px;">' +
					'<strong>Info!</strong> Nema rezultata!' +
					'</div>';
			} else {
				if (subject == 'JP ELEKTROPRIVREDA SRBIJE') {
					$('.searchBtns').find('.exportData').remove();
					$('.searchBtns').find('.exportDataFilter').remove();
					$('.searchBtns').find('.addMassToOrder').remove();
					$('.searchBtns').prepend('<button type="submit" class="btn btn-success exportData pull-left">Export</button>');
					$('.searchBtns').prepend('<button type="submit" class="btn btn-info addMassToOrder pull-left" style="margin-right: 15px;">Dodaj sve</button>');
				} else {
					$('.searchBtns').find('.exportData').remove();
					$('.searchBtns').find('.exportDataFilter').remove();
					$('.searchBtns').find('.addMassToOrder').remove();
					$('.searchBtns').prepend('<button type="submit" class="btn btn-success exportDataFilter pull-left">Export</button>');
					$('.searchBtns').prepend('<button type="submit" class="btn btn-info addMassToOrder pull-left" style="margin-right: 15px;">Dodaj sve</button>');
				}
				string =
					'<div class="well">' +
					'<div class="alert alert-info" style="font-size: 15px;">' +
					'<span><strong>Info!</strong> Ukupno rezultata:' + cntData + ', rasporedjenih u ' + cntBox + ' kutija.</span>' +
					'</div>' +
					'<table class="table searchTable">' +
					'<tr>' +
					'<td style="width:100px">Kutija</td>' +
					'<td style="width:100px">Inventarski broj</td>' +
					'<td style="width:100px">Ulazni dok.</td>' +
					'<td>Sektor</td>' +
					'<td style="width:300px">Opis</td>' +
					'<td style="width:300px">Napomena</td>' +
					'<td style="width:300px">Partija kredita</td>' +
					'<td style="width:30px">G.N.</td>' +
					'<td style="width: 9%;">Mapa</td>' +
					'<td style="width:20px"></td>' +
					'<td style="width:20px">Nalog</td>' +
					'<td style="width:10px" title="Istorija">Ist.</td>' +
					'</tr>';
				$.each(data, function (i, item) {

					string += '<tr>' +
						'<td class="ident" data-toggle="popover" data-trigger="hover" data-ident=' + item.ident + '>' + item.ident + '</td>' +
						'<td class="identInfo" data-toggle="popover" data-trigger="hover" data-ident=' + item.serial + '>' + item.serial + '</td>' + '<td><a href="/inventory/showReceipts/' + item.inputDoc + '" target="_blank">' + item.inputDoc + '</a></td>' +
						'<td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" class="sector"><span  title="' + item.sector + '">' + item.sector + '</span></td>' +
						'<td title="' + item.description + '" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;">' + item.description + '</td>' +
						'<td title="' + item.note + '" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80px;">' + item.note + '</td>' +
						'<td title=' + item.created + '>' + item.created + '</td>' +
						'<td title="' + item.acCreditNumber + '" style="max-width: 80px;">' + item.note + '</td>';

					if (item.mapKey && item.warehouse != 'Pripremno skladiste') {
						string += '<td><a href="/map/view/' + item.mapKey + '">' + item.mapKey + '</a></td>';
					} else {
						string += '<td>Priprema</td>';
					}
					if (item.loginUser == 'WU' || item.loginUser == 'SD' || item.loginUser == 'YO' || item.loginUser == 'AY' || item.loginUser == 'YS' || item.loginUser == 'KQ') {
						if (item.warehouse == '') {
							string += "<td title='inventar na reversu'><span class='reversWarnBtn'></span></td>";
						} else {
							string += "<td class='editBtn editInventoryMain'></td>";
						}
					} else {
						if (item.warehouse == '') {
							string += "<td title='inventar na reversu'><span class='reversWarnBtn'></span></td>";
						} else {
							string += "<td></td>";
						}
					}
					if (item.warehouse != 'Pripremno skladiste') {
						if (item.block == 'B') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01D0">+</button></td>';
						} else if (item.block == 'A') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01B0">+</button></td>';
						} else if (item.block == 'C') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01F0">+</button></td>';
						} else {
							string += '<td></td>';
						}
					} else {
						string += '<td></td>';
					}
					string += "<td class='historyBtn showHistory'>i</td></tr>";
				});
				string += '</table>' +

					'</div>'
					;
			}
			$('.itemHolder').html(string);
		}
	});
});

$(document).on('click', '.searchSearialV3Test', function (e) {
	acSearch = $("[name=acSearch]").val();
	acSerialNo = $('[name=acSerialNo]').val();
	acIdent = $('[name=acIdent]').val();
	acBlock = $('[name=acBlock]').val();
	acUerId = $('[name=acUerId]').val();
	docType = $('[name=acDocType]').val();
	adTimeInsFrom = $('[name=adTimeInsFrom]').val();
	adTimeInsTo = $('[name=adTimeInsTo]').val();
	acBoxType = $('[name=acBoxType]').val();
	inventory = $('[name=inventory]').val();
	acDescription = $('input[name=acDescription]').val();
	anYearTo = $('[name=anYearTo]').val();
	keepDate = $('[name=anStoring]').val();
	anYearFrom = $('[name=anYearFrom]').val();
	dateToSerial = $('[name=dateToSerial]').val();
	acNote = $('[name=acNote]').val();
	var subject = $('[name=acCompany]').val();
	sector = $('[name=acSector]').val();
	acRefId = $('[name=acRefId]').val();
	acCreditNumber = $('[name=acCreditNumber]').val();
	anTop = $('[name=anTop]').val();
	acContent = $('[name=acContent]').val();
	adDateFrom = $('[name=adDateFrom]').val();
	adDateTo = $('[name=adDateTo]').val();
	acContentType = $('[name=acContentType]').val();
	acArhiveNo = $('[name=acArhiveNo]').val();
	anCreatedTo = $('[name=anCreatedTo]').val();
	acBoxDescrStr = $('[name=acBoxDescrStr]').val();
	acBoxDescription = $('[name=acBoxDescription]').val();
	acCreditTypeDescription = $('[name=acCreditTypeDescription]').val();
	acProductType = $('[name=acProductType]').val();
	acDepartment = $('[name=acDepartment]').val();
	acRegistrationNo = $('[name=acRegistrationNo]').val();
	acName = $('[name=acName]').val();
	$('.mainFog').show();
	$('.mainFogImage').show();
	$.ajax({
		url: "/inventory/filterSearchV3Test",
		type: "post",
		data: {
			acSearch: acSearch,
			acSerialNo: acSerialNo,
			acIdent: acIdent,
			acBlock: acBlock,
			acUerId: acUerId,
			acDocType: docType,
			adTimeInsFrom: adTimeInsFrom,
			adTimeInsTo: adTimeInsTo,
			acBoxType: acBoxType,
			adDateFrom: adDateFrom,
			adDateTo: adDateTo,
			acDescription: acDescription,
			anYearTo: anYearTo,
			anStoring: keepDate,
			anYearFrom: anYearFrom,
			dateToSerial: dateToSerial,
			acNote: acNote,
			acCompany: subject,
			acSector: sector,
			acRefId: acRefId,
			acContent: acContent,
			acContentType: acContentType,
			acArhiveNo: acArhiveNo,
			anCreatedTo: anCreatedTo,
			acBoxDescrStr: acBoxDescrStr,
			acCreditNumber: acCreditNumber,
			acBoxDescription: acBoxDescription,
			acCreditTypeDescription: acCreditTypeDescription,
			acProductType: acProductType,
			acDepartment: acDepartment,
			acRegistrationNo: acRegistrationNo,
			anTop: anTop,
			acName: acName
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			var cntData;
			var cntBoxArray = [];
			var cntBox;
			if (data != null) {
				cntData = data.length;
				$.each(data, function (i, d) {
					if ($.inArray(d.ident, cntBoxArray) != -1) {

					} else {
						cntBoxArray.push(d.ident);
					}
				});
				cntBox = cntBoxArray.length;
			} else {
				cntData = 0;
			}

			if (cntData == 0) {
				string =
					'<div class="alert alert-info" style="font-size: 15px;">' +
					'<strong>Info!</strong> Nema rezultata!' +
					'</div>';
			} else {
				if (subject == 'JP ELEKTROPRIVREDA SRBIJE') {
					$('.searchBtns').find('.exportData').remove();
					$('.searchBtns').find('.exportDataFilter').remove();
					$('.searchBtns').find('.addMassToOrder').remove();
					$('.searchBtns').prepend('<button type="submit" class="btn btn-success exportData pull-left">Export</button>');
					$('.searchBtns').prepend('<button type="submit" class="btn btn-info addMassToOrder pull-left" style="margin-right: 15px;">Dodaj sve</button>');
				} else {
					$('.searchBtns').find('.exportData').remove();
					$('.searchBtns').find('.exportDataFilter').remove();
					$('.searchBtns').find('.addMassToOrder').remove();
					$('.searchBtns').prepend('<button type="submit" class="btn btn-success exportDataFilter pull-left">Export</button>');
					$('.searchBtns').prepend('<button type="submit" class="btn btn-info addMassToOrder pull-left" style="margin-right: 15px;">Dodaj sve</button>');
				}
				string =
					'<div class="well">' +
					'<div class="alert alert-info" style="font-size: 15px;">' +
					'<span><strong>Info!</strong> Ukupno rezultata:' + cntData + ', rasporedjenih u ' + cntBox + ' kutija.</span>' +
					'</div>' +
					'<table class="table searchTable">' +
					'<tr>' +
					'<td style="width:100px">Kutija</td>' +
					'<td style="width:100px">Inventarski broj</td>' +
					'<td style="width:100px">Ulazni dok.</td>' +
					'<td>Sektor</td>' +
					'<td style="width:300px">Opis</td>' +
					'<td style="width:300px">Napomena</td>' +
					'<td style="width:30px">G.N.</td>' +
					'<td style="width: 9%;">Mapa</td>' +
					'<td style="width:20px"></td>' +
					'<td style="width:20px">Nalog</td>' +
					'<td style="width:10px" title="Istorija">Ist.</td>' +
					'</tr>';
				$.each(data, function (i, item) {

					string += '<tr>' +
						'<td class="ident" data-toggle="popover" data-trigger="hover" data-ident=' + item.ident + '>' + item.ident + '</td>' +
						'<td class="identInfo" data-toggle="popover" data-trigger="hover" data-ident=' + item.serial + '>' + item.serial + '</td>' + '<td><a href="/inventory/showReceipts/' + item.inputDoc + '" target="_blank">' + item.inputDoc + '</a></td>' +
						'<td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" class="sector"><span  title="' + item.sector + '">' + item.sector + '</span></td>' +
						'<td title="' + item.description + '" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;">' + item.description + '</td>' +
						'<td title="' + item.note + '" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80px;">' + item.note + '</td>' +
						'<td title=' + item.created + '>' + item.created + '</td>';

					if (item.mapKey && item.warehouse != 'Pripremno skladiste') {
						string += '<td><a href="/map/view/' + item.mapKey + '">' + item.mapKey + '</a></td>';
					} else {
						string += '<td>Priprema</td>';
					}
					if (item.loginUser == 'WU' || item.loginUser == 'SD' || item.loginUser == 'YO' || item.loginUser == 'AY' || item.loginUser == 'YS' || item.loginUser == 'KQ') {
						if (item.warehouse == '') {
							string += "<td title='inventar na reversu'><span class='reversWarnBtn'></span></td>";
						} else {
							string += "<td class='editBtn editInventoryMain'></td>";
						}
					} else {
						if (item.warehouse == '') {
							string += "<td title='inventar na reversu'><span class='reversWarnBtn'></span></td>";
						} else {
							string += "<td></td>";
						}
					}
					if (item.warehouse != 'Pripremno skladiste') {
						if (item.block == 'B') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01D0">+</button></td>';
						} else if (item.block == 'A') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01B0">+</button></td>';
						} else if (item.block == 'C') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01F0">+</button></td>';
						} else {
							string += '<td></td>';
						}
					} else {
						string += '<td></td>';
					}
					string += "<td class='historyBtn showHistory'>i</td></tr>";
				});
				string += '</table>' +

					'</div>'
					;
			}
			$('.itemHolder').html(string);
		}
	});
});

$(document).on('click', '.searchSearial', function (e) {
	search = $("[name=filterSearch]").val();
	serialNo = $('[name=serialNoSearch]').val();
	boxNumber = $('[name=boxNumber1]').val();
	block = $('[name=block]').val();
	referent = $('[name=referent]').val();
	docType = $('[name=docType]').val();
	dateFrom = $('[name=dateFrom]').val();
	dateTo = $('[name=dateTo]').val();
	typeDoc = $('[name=typeDoc]').val();
	inventory = $('[name=inventory]').val();
	description = $('input[name=description]').val();
	yearCreated = $('[name=yearCreated]').val();
	keepDate = $('[name=keepDate]').val();
	dateFromSerial = $('[name=dateFromSerial]').val();
	dateToSerial = $('[name=dateToSerial]').val();
	note = $('[name=note]').val();
	var subject = $('[name=subject]').val();
	sector = $('[name=sector]').val();
	refFrom = $('[name=refFrom]').val();
	//refTo = $('[name=refTo]').val();
	limit = $('[name=limit]').val();
	acContent = $('[name=acContent]').val();
	acContentType = $('[name=acContentType]').val();
	acArhiveNo = $('[name=acArhiveNo]').val();
	anCreatedTo = $('[name=anCreatedTo]').val();
	$('.mainFog').show();
	$('.mainFogImage').show();
	$.ajax({
		url: "/inventory/filterSearch",
		type: "post",
		data: {
			search: search,
			serialNo: serialNo,
			boxNumber: boxNumber,
			block: block,
			referent: referent,
			docType: docType,
			dateFrom: dateFrom,
			dateTo: dateTo,
			typeDoc: typeDoc,
			inventory: inventory,
			description: description,
			yearCreated: yearCreated,
			keepDate: keepDate,
			dateFromSerial: dateFromSerial,
			dateToSerial: dateToSerial,
			note: note,
			subject: subject,
			sector: sector,
			refFrom: refFrom,
			acContent: acContent,
			acContentType: acContentType,
			acArhiveNo: acArhiveNo,
			anCreatedTo: anCreatedTo,
			limit: limit
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			var cntData;
			var cntBoxArray = [];
			var cntBox;
			if (data != null) {
				cntData = data.length;
				$.each(data, function (i, d) {
					if ($.inArray(d.ident, cntBoxArray) != -1) {

					} else {
						cntBoxArray.push(d.ident);
					}
				});
				cntBox = cntBoxArray.length;
			} else {
				cntData = 0;
			}

			if (cntData == 0) {
				string =
					'<div class="alert alert-info" style="font-size: 15px;">' +
					'<strong>Info!</strong> Nema rezultata!' +
					'</div>';
			} else {
				if (subject == 'JP ELEKTROPRIVREDA SRBIJE') {
					$('.searchBtns').find('.exportData').remove();
					$('.searchBtns').find('.exportDataFilter').remove();
					$('.searchBtns').find('.addMassToOrder').remove();
					$('.searchBtns').prepend('<button type="submit" class="btn btn-success exportData pull-left">Export</button>');
					$('.searchBtns').prepend('<button type="submit" class="btn btn-info addMassToOrder pull-left" style="margin-right: 15px;">Dodaj sve</button>');
				} else {
					$('.searchBtns').find('.exportData').remove();
					$('.searchBtns').find('.exportDataFilter').remove();
					$('.searchBtns').find('.addMassToOrder').remove();
					$('.searchBtns').prepend('<button type="submit" class="btn btn-success exportDataFilter pull-left">Export</button>');
					$('.searchBtns').prepend('<button type="submit" class="btn btn-info addMassToOrder pull-left" style="margin-right: 15px;">Dodaj sve</button>');
				}
				string =
					'<div class="well">' +
					'<div class="alert alert-info" style="font-size: 15px;">' +
					'<span><strong>Info!</strong> Ukupno rezultata:' + cntData + ', rasporedjenih u ' + cntBox + ' kutija.</span>' +
					'</div>' +
					'<table class="table searchTable">' +
					'<tr>' +
					'<td style="width:100px">Kutija</td>' +
					'<td style="width:100px">Inventarski broj</td>' +
					'<td style="width:100px">Ulazni dok.</td>' +
					'<td>Sektor</td>' +
					'<td style="width:300px">Opis</td>' +
					'<td style="width:300px">Napomena</td>' +
					'<td style="width:30px">G.N.</td>' +
					'<td style="width: 9%;">Mapa</td>' +
					'<td style="width:20px"></td>' +
					'<td style="width:20px">Nalog</td>' +
					'<td style="width:10px" title="Istorija">Ist.</td>' +
					'</tr>';
				$.each(data, function (i, item) {

					string += '<tr>' +
						'<td class="ident" data-toggle="popover" data-trigger="hover" data-ident=' + item.ident + '>' + item.ident + '</td>' +
						'<td class="identInfo" data-toggle="popover" data-trigger="hover" data-ident=' + item.serial + '>' + item.serial + '</td>' + '<td><a href="/inventory/showReceipts/' + item.inputDoc + '" target="_blank">' + item.inputDoc + '</a></td>' +
						'<td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" class="sector"><span  title="' + item.sector + '">' + item.sector + '</span></td>' +
						'<td title="' + item.description + '" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;">' + item.description + '</td>' +
						'<td title="' + item.note + '" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80px;">' + item.note + '</td>' +
						'<td title=' + item.created + '>' + item.created + '</td>';

					if (item.mapKey && item.warehouse != 'Pripremno skladiste') {
						string += '<td><a href="/map/view/' + item.mapKey + '">' + item.mapKey + '</a></td>';
					} else {
						string += '<td>Priprema</td>';
					}
					if (item.loginUser == 'WU' || item.loginUser == 'SD' || item.loginUser == 'YO' || item.loginUser == 'AY' || item.loginUser == 'YS' || item.loginUser == 'KQ') {
						if (item.warehouse == '') {
							string += "<td title='inventar na reversu'><span class='reversWarnBtn'></span></td>";
						} else {
							string += "<td class='editBtn editInventoryMain'></td>";
						}
					} else {
						if (item.warehouse == '') {
							string += "<td title='inventar na reversu'><span class='reversWarnBtn'></span></td>";
						} else {
							string += "<td></td>";
						}
					}
					if (item.warehouse != 'Pripremno skladiste') {
						if (item.block == 'B') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01D0">+</button></td>';
						} else if (item.block == 'A') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01B0">+</button></td>';
						} else if (item.block == 'C') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01F0">+</button></td>';
						} else if (item.block == 'D') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01H0">+</button></td>';
						} else {
							string += '<td></td>';
						}
					} else {
						string += '<td></td>';
					}
					string += "<td class='historyBtn showHistory'>i</td></tr>";
				});
				string += '</table>' +

					'</div>'
					;
			}
			$('.itemHolder').html(string);
		}
	});
});
$(document).on('click', '.searchSearial2', function (e) {
	search = $("[name=filterSearch]").val();
	serialNo = $('[name=serialNoSearch]').val();
	boxNumber = $('[name=boxNumber1]').val();
	block = $('[name=block]').val();
	referent = $('[name=referent]').val();
	docType = $('[name=docType]').val();
	dateFrom = $('[name=dateFrom]').val();
	dateTo = $('[name=dateTo]').val();
	typeDoc = $('[name=typeDoc]').val();
	inventory = $('[name=inventory]').val();
	description = $('input[name=description]').val();
	yearCreated = $('[name=yearCreated]').val();
	keepDate = $('[name=keepDate]').val();
	dateFromSerial = $('[name=dateFromSerial]').val();
	dateToSerial = $('[name=dateToSerial]').val();
	note = $('[name=note]').val();
	var subject = $('[name=subject]').val();
	sector = $('[name=sector]').val();
	refFrom = $('[name=refFrom]').val();
	//refTo = $('[name=refTo]').val();
	limit = $('[name=limit]').val();
	acContent = $('[name=acContent]').val();
	acContentType = $('[name=acContentType]').val();
	acArhiveNo = $('[name=acArhiveNo]').val();
	anCreatedTo = $('[name=anCreatedTo]').val();
	$('.mainFog').show();
	$('.mainFogImage').show();
	$.ajax({
		url: "/inventory/filterSearch",
		type: "post",
		data: {
			search: search,
			serialNo: serialNo,
			boxNumber: boxNumber,
			block: block,
			referent: referent,
			docType: docType,
			dateFrom: dateFrom,
			dateTo: dateTo,
			typeDoc: typeDoc,
			inventory: inventory,
			description: description,
			yearCreated: yearCreated,
			keepDate: keepDate,
			dateFromSerial: dateFromSerial,
			dateToSerial: dateToSerial,
			note: note,
			subject: subject,
			sector: sector,
			refFrom: refFrom,
			acContent: acContent,
			acContentType: acContentType,
			acArhiveNo: acArhiveNo,
			anCreatedTo: anCreatedTo,
			limit: limit
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			var cntData;
			var cntBoxArray = [];
			var cntBox;
			if (data != null) {
				cntData = data.length;
				$.each(data, function (i, d) {
					if ($.inArray(d.ident, cntBoxArray) != -1) {

					} else {
						cntBoxArray.push(d.ident);
					}
				});
				cntBox = cntBoxArray.length;
			} else {
				cntData = 0;
			}

			if (cntData == 0) {
				string =
					'<div class="alert alert-info" style="font-size: 15px;">' +
					'<strong>Info!</strong> Nema rezultata!' +
					'</div>';
			} else {
				if (subject == 'JP ELEKTROPRIVREDA SRBIJE') {
					$('.searchBtns').find('.exportData').remove();
					$('.searchBtns').find('.exportDataFilter').remove();
					$('.searchBtns').find('.addMassToOrder').remove();
					$('.searchBtns').prepend('<button type="submit" class="btn btn-success exportData pull-left">Export</button>');
					$('.searchBtns').prepend('<button type="submit" class="btn btn-info addMassToOrder pull-left" style="margin-right: 15px;">Dodaj sve</button>');
				} else {
					$('.searchBtns').find('.exportData').remove();
					$('.searchBtns').find('.exportDataFilter').remove();
					$('.searchBtns').find('.addMassToOrder').remove();
					$('.searchBtns').prepend('<button type="submit" class="btn btn-success exportDataFilter2 pull-left">Export</button>');
					$('.searchBtns').prepend('<button type="submit" class="btn btn-info addMassToOrder pull-left" style="margin-right: 15px;">Dodaj sve</button>');
				}
				string =
					'<div class="well">' +
					'<div class="alert alert-info" style="font-size: 15px;">' +
					'<span><strong>Info!</strong> Ukupno rezultata:' + cntData + ', rasporedjenih u ' + cntBox + ' kutija.</span>' +
					'</div>' +
					'<table class="table searchTable">' +
					'<tr>' +
					'<td style="width:100px">Kutija</td>' +
					'<td style="width:100px">Inventarski broj</td>' +
					'<td style="width:100px">Ulazni dok.</td>' +
					'<td>Sektor</td>' +
					'<td style="width:300px">Opis</td>' +
					'<td style="width:300px">Napomena</td>' +
					'<td style="width:30px">G.N.</td>' +
					'<td style="width: 9%;">Mapa</td>' +
					'<td style="width:20px"></td>' +
					'<td style="width:20px">Nalog</td>' +
					'<td style="width:10px" title="Istorija">Ist.</td>' +
					'</tr>';
				$.each(data, function (i, item) {

					string += '<tr>' +
						'<td class="ident" data-toggle="popover" data-trigger="hover" data-ident=' + item.ident + '>' + item.ident + '</td>' +
						'<td class="identInfo" data-toggle="popover" data-trigger="hover" data-ident=' + item.serial + '>' + item.serial + '</td>' + '<td><a href="/inventory/showReceipts/' + item.inputDoc + '" target="_blank">' + item.inputDoc + '</a></td>' +
						'<td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" class="sector"><span  title="' + item.sector + '">' + item.sector + '</span></td>' +
						'<td title="' + item.description + '" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;">' + item.description + '</td>' +
						'<td title="' + item.note + '" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80px;">' + item.note + '</td>' +
						'<td title=' + item.created + '>' + item.created + '</td>';

					if (item.mapKey && item.warehouse != 'Pripremno skladiste') {
						string += '<td><a href="/map/view/' + item.mapKey + '">' + item.mapKey + '</a></td>';
					} else {
						string += '<td>Priprema</td>';
					}
					if (item.loginUser == 'WU' || item.loginUser == 'SD' || item.loginUser == 'YO' || item.loginUser == 'AY' || item.loginUser == 'YS' || item.loginUser == 'KQ') {
						if (item.warehouse == '') {
							string += "<td title='inventar na reversu'><span class='reversWarnBtn'></span></td>";
						} else {
							string += "<td class='editBtn editInventoryMain'></td>";
						}
					} else {
						if (item.warehouse == '') {
							string += "<td title='inventar na reversu'><span class='reversWarnBtn'></span></td>";
						} else {
							string += "<td></td>";
						}
					}
					if (item.warehouse != 'Pripremno skladiste') {
						if (item.block == 'B') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01D0">+</button></td>';
						} else if (item.block == 'A') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01B0">+</button></td>';
						} else if (item.block == 'C') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01F0">+</button></td>';
						} else if (item.block == 'D') {
							string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01H0">+</button></td>';
						} else {
							string += '<td></td>';
						}
					} else {
						string += '<td></td>';
					}
					string += "<td class='historyBtn showHistory'>i</td></tr>";
				});
				string += '</table>' +

					'</div>'
					;
			}
			$('.itemHolder').html(string);
		}
	});
});

$(document).on('click', '.addMassToOrder', function () {
	var identArray = [];
	$.each($('.addBtn'), function (i, d) {

		if ($(this).data('type') == 'addSearch') {
			docType = $(this).data('doctype');
			sector = $(this).closest('tr').find('.sector').text();
			serialNo = $(this).closest('tr').find('.identInfo').text();
			boxIdent = $(this).closest('tr').find('.ident').text();

			identArray.push({
				docType: docType,
				sector: sector,
				serialNo: serialNo,
				boxIdent: boxIdent
			});
		}
	});

	$.ajax({
		url: "/inventory/addToOrderMass",
		type: "post",
		data: {
			identArray: identArray
		},
		dataType: 'json',
		success: function (data) {
			$('.itemHolder').html("");
			$('#message').modal();
			string = "<p>" + data.succes + "</p><p style='color:red'>" + data.fail + "</p>"
			$('#message').find('.modal-body p').html(string);
		}
	});
});

$(document).on('click', '.searchTable tr', function () {
	$('.searchTable tr').css('background', '');
	$(this).css('background', 'lightgray');
});

$(document).on('click', '.exportData', function (e) {
	e.preventDefault();
	$from = !$('[name=dateFromSerial]').val() ? '1970-01-01' : $('[name=dateFromSerial]').val();
	$to = !$('[name=dateToSerial]').val() ? '1970-01-01' : $('[name=dateToSerial]').val();
	window.location.href = "/inventory/filterSearchExport/" + $('[name=subject]').val() + "/" + $from + "/" + $to;
});


/*
* EDIT - dodat acContent
* Ivan Žarković
* Ewe Comp, maj 2022.
*/
$(document).on('click', '.exportDataFilter', function (e) {
	e.preventDefault();

	search = $("[name=filterSearch]").val();
	serialNo = $('[name=serialNoSearch]').val();
	boxNumber = $('[name=boxNumber1]').val();
	block = $('[name=block]').val();
	referent = $('[name=referent]').val();
	docType = $('[name=docType]').val();
	dateFrom = !$('[name=dateFrom]').val() ? '1970-01-01' : $('[name=dateFrom]').val();
	dateTo = !$('[name=dateTo]').val() ? '1970-01-01' : $('[name=dateTo]').val();
	typeDoc = $('[name=typeDoc]').val();
	inventory = $('[name=inventory]').val();
	description = $('input[name=description]').val();
	yearCreated = $('[name=yearCreated]').val();
	keepDate = $('[name=keepDate]').val();
	dateFromSerial = !$('[name=dateFromSerial]').val() ? '1970-01-01' : $('[name=dateFromSerial]').val();
	dateToSerial = !$('[name=dateToSerial]').val() ? '1970-01-01' : $('[name=dateToSerial]').val();
	note = $('[name=note]').val();
	var subject = $('[name=subject]').val();
	sector = $('[name=sector]').val();
	refFrom = $('[name=refFrom]').val();
	//refTo = $('[name=refTo]').val();
	limit = $('[name=limit]').val();
	content = $('[name=acContent]').val();
	//$('.mainFog').show();
	//$('.mainFogImage').show();
	if (!search) {
		search = 'a';
	}
	if (!serialNo) {
		serialNo = 'a';
	}
	if (!boxNumber) {
		boxNumber = 'a';
	}
	if (!block) {
		block = 'a';
	}
	if (!referent) {
		referent = 'a';
	}
	if (!docType) {
		docType = 'a';
	}
	if (!dateFrom) {
		dateFrom = 'a';
	}
	if (!dateTo) {
		dateTo = 'a';
	}
	if (!typeDoc) {
		typeDoc = 'a';
	} else {
		typeDoc.split(' ').join('_');
	}
	if (!inventory) {
		inventory = 'a';
	}
	if (!description) {
		description = 'a';
	}
	if (!yearCreated) {
		yearCreated = 'a';
	}
	if (!keepDate) {
		keepDate = 'a';
	}
	if (!dateFromSerial) {
		dateFromSerial = 'a';
	}
	if (!dateToSerial) {
		dateToSerial = 'a';
	}
	if (!note) {
		note = 'a';
	} else {
		note = note.replaceAll("/", "_");
	}
	if (!subject) {
		subject = 'a';
	}
	if (!sector) {
		sector = 'a';
	}
	if (!refFrom) {
		refFrom = 'a';
	}
	if (!limit) {
		limit = 'a';
	}
	if (!content) {
		content = 'a';
	}

	window.location.href = "/inventory/exportDataFilterAll/" + search + "/" + serialNo + "/" + boxNumber + "/" + block + "/" + referent + "/" + docType + "/" + dateFrom + "/" + dateTo + "/" + typeDoc + "/" + inventory + "/" + description + "/" + yearCreated + "/" + keepDate + "/" + dateFromSerial + "/" + dateToSerial + "/" + note + "/" + subject + "/" + sector + "/" + refFrom + "/" + limit + "/" + content;

});

$(document).on('click', '.typeTab', function (e) {
	type = $(this).data('type');
	typeb = $(this).data('typeb');
	typec = $(this).data('typec');
	typed = $(this).data('typed');
	status = $("[name='statusOut']").val();
	change = true;
	$.ajax({
		url: "/inventory/viewOrderOut",
		type: "post",
		data: {
			type: type,
			typeb: typeb,
			status: status,
			change: change,
			typec: typec,
			typed: typed
		},

		success: function (data) {
			$('.tableBody').html(data);
		}
	});
});

$(document).on('keydown', 'input[name=filterSearch]', function (e) {
	search = $("[name='filterSearch']").val();
	thisItem = $(this);

	if (e.which == 13 || e.which == 9) {
		$('.mainFog').show();
		$('.mainFogImage').show();
		$.ajax({
			url: "/inventory/filterSearch",
			type: "post",
			data: {
				search: search
			},
			dataType: 'json',
			success: function (data) {
				$('.mainFog').hide();
				$('.mainFogImage').hide();
				var cntData;
				var cntBoxArray;
				var cntBox;
				if (data != null) {
					cntData = data.length;
					$.each(data, function (i, d) {
						if ($.inArray(d.ident, cntBoxArray) != -1) {

						} else {
							cntBoxArray.push(d.ident);
						}
					});
					cntBox = cntBoxArray.length;
				} else {
					cntData = 0;
				}

				if (cntData == 0) {
					string =
						'<div class="alert alert-info" style="font-size: 15px;">' +
						'<strong>Info!</strong> Nema rezultata!' +
						'</div>';
				} else {
					//$('.searchBtns').find('.exportData').remove();
					//$('.searchBtns').prepend('<button type="submit" class="btn btn-success exportData pull-left">Export</button>')
					string =
						'<div class="well">' +
						'<span>Ukupno rezultata:' + cntData + ', rasporedjenih u ' + cntBox + ' kutija.</span>' +
						'<table class="table">' +
						'<tr>' +
						'<td>Inventarski broj</td>' +
						'<td>Kutija</td>' +
						'<td>Ulazni dok.</td>' +
						'<td>Sektor</td>' +
						'<td>Opis</td>' +
						'<td>Napomena</td>' +
						'<td>God. nastanka</td>' +
						'<td>Mapa</td>' +
						'<td>Nalog</td>' +
						'</tr>';
					$.each(data, function (i, item) {

						string += '<tr>' +
							'<td class="ident" data-toggle="popover" data-trigger="hover" data-ident=' + item.ident + '>' + item.ident + '</td>' +
							'<td class="identInfo" data-toggle="popover" data-trigger="hover" data-ident=' + item.serial + '>' + item.serial + '</td>' +
							'<td><a href="/inventory/showReceipts/' + item.inputDoc + '" target="_blank">' + item.inputDoc + '</a></td>' +
							'<td class="sector">' + item.sector + '</td>' +
							'<td title="' + item.description + '" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;">' + item.description + '</td>' +
							'<td title="' + item.note + '" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80px;">' + item.note + '</td>' +
							'<td title=' + item.created + '>' + item.created + '</td>';

						if (item.mapKey) {
							string += '<td><a href="/map/view/' + item.mapKey + '">' + item.mapKey + '</a></td>';
						} else {
							string += '<td>Priprema</td>';
						}

						if (item.warehouse != 'Pripremno skladiste') {
							if (item.block == 'B') {
								string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01D0">+</button></td></tr>';
							} else if (item.block == 'C') {
								string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01F0">+</button></td></tr>';
							} else {
								string += '<td class="btn"><button class="addBtn btn-default" data-type="addSearch" data-doctype="01B0">+</button></td></tr>';
							}
						}
					});
					string += '</table>' +

						'</div>'
						;
				}
				$('.itemHolder').html(string);
			}
		});
	}
});

$(document).on('click', '.addBtn', function () {
	if ($(this).data('type') == 'addSearch') {
		boxIdent = $(this).closest('tr').find('.ident').text();
		serialNo = $(this).closest('tr').find('.identInfo').text();
		sector = $(this).closest('tr').find('.sector').text();
		docType = $(this).data('doctype');
		thisItem = $(this);
		$.ajax({
			url: "/inventory/addToOrder",
			type: "post",
			data: {
				boxIdent: boxIdent,
				sector: sector,
				docType: docType,
				serialNo: serialNo
			},
			dataType: 'json',
			async: false,
			success: function (data) {
				if (data.ok == 'F') {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
				} else if (data.ok == 'T') {
					thisItem.closest('tr').find('.btn').html('dodato');
				}
			}
		});
	}
});

$(document).on('keydown', '.addBoxExit', function (e) {
	if ((e.which == 13 || e.which == 9) && $('.addBoxExit').val() != '') {
		var dataTypes = $(this).data('doctype');
		if ($(this).data('type') == 'createHead') {
			boxIdent = $('.addBoxExit').val();
			sector = $('.brancheName').text();

		} else {
			boxIdent = $('.addBoxExit').val();
			sector = $('.brancheName').text();
			key = $('#key').text();
		}

		if (dataTypes == '01P0') {
			functionUrl = "/inventory/addToOrderNoInventory";
		} else {
			functionUrl = "/inventory/addToOrder";
		}

		$.ajax({
			url: functionUrl,
			type: "post",
			data: {
				boxIdent: boxIdent,
				sector: sector,
				docType: dataTypes
			},
			dataType: 'json',
			async: false,
			success: function (data) {
				if (data.ok == 'F') {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
				} else if (data.ok == 'T') {
					$('.addBoxExit').val('');
					if (!key) {
						key = data.key;
					}
					$('.confirmOrder').prop('disabled', false);
					$('.orderStatus2').prop('disabled', false);
					$('.finishOrderNoInventry').prop('disabled', false);
					$('#key').html(data.key);
					if (dataTypes != '01P0') {
						$('#orderOut tr:last').after('<tr style="border-bottom: 2px solid #ddd; border-top: 1px solid #ddd;"><td style="font-weight: 700">' + data.boxKey + '</td><td style="font-weight: 700">Sadržaj kutije</td><td style="font-weight: 700">' + data.mapId + '</td><td style="float:left; border-top: none;"><a href="#" class=" deleteBtnB1" data-key=' + data.boxKey + ' data-dismiss="alert" aria-label="close">×</a></td></tr>');

						$.each(data.serial, function (i, item) {

							if (item.packages == 'T') {
								$('#orderOut tr:last').after('<tr class=' + data.boxKey + '><td><span style="color: #337ab7;" class="glyphicon glyphicon-triangle-right pull-right"></span></td><td class="ident"><span style="color: #337ab7;" class="glyphicon glyphicon-triangle-right pull-right"></span>' + item.serial + '</td><td></td><td></td></tr>');
							} else {
								$('#orderOut tr:last').after('<tr class=' + data.boxKey + '><td></td><td><span style="color: #337ab7;" class="glyphicon glyphicon-triangle-right"></span>' + item.serial + '</td><td></td><td></td></tr>');
							}

						});
					} else {
						$('#orderOut tr:last').after('<tr style="border-bottom: 2px solid #ddd; border-top: 1px solid #ddd;"><td style="font-weight: 700">' + data.boxKey + '</td><td style="float:left; border-top: none;"><a href="#" class=" deleteBtnB1" data-key=' + data.boxKey + ' data-dismiss="alert" aria-label="close">×</a></td></tr>');
					}
				}
			}
		});
	}
});


$(document).on('keydown', '.addBoxOut', function (e) {

	if ((e.which == 13 || e.which == 9) && $('.addBoxOut').val() != '') {

		serial = $('.addBoxOut').val();
		sector = $('#sectorName1').val();
		key = $('#key').text();


		if (!sector) {
			sector = $('.brancheName').text();
		}

		if (sector.trim() == 'ProCredit Bank DOO') {
			serial = 'PCB' + serial;
		}

		$.ajax({
			url: "/inventory/addToOrderOut",
			type: "post",
			data: {
				serial: serial,
				sector: sector,
				key: key
			},
			dataType: 'json',
			async: false,
			success: function (data) {
				if (data.ok == 'F') {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
				} else if (data.ok == 'T') {
					$('.addBoxOut').html('');
					$('.addBoxOut').val('');
					$('.finisOrderOut').prop('disabled', false);
					$('#key').html(data.key);

					$('#orderOut > tbody > tr:first').before('<tr style="border-bottom: 2px solid #ddd; border-top: 1px solid #ddd;">' +
						'<td style="font-weight:600" class="boxId">' + data.boxId + '</td>' +
						'<td style="font-weight:600">Sadržaj kutije</td>' +
						'</tr>' +
						'<tr>' +
						'<td></td>' +
						'<td class="serialId ident">' + data.serial + '</td>' +
						'<td style="float:left; border-top: none;">' +
						'<a href="#" data-key=' + data.boxId + ' class="deleteBtnB1Out"  data-dismiss="alert" aria-label="close">×</a>' +
						'</td>' +
						'</tr>'
					);
					$('input[name=addBoxOut]').focus();
				}
			}
		});
	}
});

$(document).on('click', '.deleteBtnOrderOut', function () {
	boxIdent = $(this).closest('tr').find('.boxId').text();
	serial = $(this).closest('tr').find('.serialId').text();
	key = $('#key').text();
	thisItem = $(this);

	$.ajax({
		url: "/inventory/deleteSerialOut",
		type: "post",
		data: {
			serial: serial,
			boxIdent: boxIdent,
			key: key
		},
		dataType: 'json',
		success: function (data) {
			if (data.ok == 'F') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			} else if (data.ok == 'T') {

				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);

			}
		}
	});
});

$(document).on('click', '.deleteBtnB1Out', function () {
	boxIdent = $(this).data('key');
	serial = $(this).closest('tr').find('.ident').text();
	var key = $('#key').text();
	thisItem = $(this);

	$.ajax({
		url: "/inventory/deleteSerialOut",
		type: "post",
		data: {
			serial: serial,
			boxIdent: boxIdent,
			key: key
		},
		dataType: 'json',
		success: function (data) {
			if (data.ok == 'F') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			} else if (data.ok == 'T') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
				setTimeout(function () {
					window.location.href = '/inventory/ordersOutEdit/' + key;
				}, 2000);
			}
		}
	});
});

$(document).on('click', '.orderStatus2', function () {
	key = $('#key').text();
	$.ajax({
		url: "/inventory/orderStatus2",
		type: "post",
		data: {
			orderKey: key
		},
		dataType: 'json',
		async: false,
		success: function (data) {
			if (data.ok == 'T') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
				setTimeout(function () {
					window.location.href = '/inventory/viewOrderOut';
				}, 1000);
			} else {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			}
		}
	});
});


$(document).on('click', '.deleteBtn', function () {

	boxIdent = $(this).closest('tr').find('.ident').text();
	key = $(this).data('key');
	thisItem = $(this);

	$.ajax({
		url: "/inventory/deleteFromOrder",
		type: "post",
		data: {
			boxIdent: boxIdent,
			key: key
		},
		dataType: 'json',
		async: false,
		success: function (data) {
			if (data.ok == 'F') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			} else if (data.ok == 'T') {
				thisItem.closest('tr').remove();
			}
		}
	});

});


$(document).on('click', '.deleteBtnB1', function () {

	key = $('#key').text();
	var boxIdent = $(this).data('key');
	thisItem = $(this);

	$.ajax({
		url: "/inventory/deleteFromOrder",
		type: "post",
		data: {
			boxIdent: boxIdent,
			key: key
		},
		dataType: 'json',
		async: false,
		success: function (data) {
			if (data.ok == 'F') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			} else if (data.ok == 'T') {
				thisItem.closest('tr').remove();
				$('.' + boxIdent).remove();
			}
		}
	});

});

$(document).on('click', '.deleteBtnOut', function () {


	key = $(this).data('key');
	thisItem = $(this);

	$.ajax({
		url: "/inventory/deleteOrder",
		type: "post",
		data: {
			boxIdent: '',
			key: key
		},
		dataType: 'json',
		async: false,
		success: function (data) {
			if (data.ok == 'F') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			} else if (data.ok == 'T') {
				thisItem.closest('tr').remove();
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			}
		}
	});

});

$(document).on('click', '.deleteBtnOrder', function () {


	key = $(this).data('key');
	thisItem = $(this);

	$.ajax({
		url: "/inventory/deleteReceipt",
		type: "post",
		data: {
			key: key
		},
		dataType: 'json',

		success: function (data) {
			if (data.ok == 'F') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			} else if (data.ok == 'T') {
				thisItem.closest('tr').remove();
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			}
		}
	});

});

$(document).on('click', '.confirmOrder', function () {
	key = $(this).data('key');
	if (!key) {
		key = $('#key').text();
	}
	thisItem = $(this);
	i = 0;
	len = $('.checkId').length;

	$('.checkId').each(function (k, v) {

		if ($(this).is(':disabled')) {
			i++;
		}
	});

	if (i == len) {
		$('.mainFog').show();
		$('.mainFogImage').show();
		$.ajax({
			url: "/inventory/confirmOrder",
			type: "post",
			data: {
				orderKey: key
			},
			dataType: 'json',
			async: false,
			success: function (data) {
				$('.mainFog').hide();
				$('.mainFogImage').hide();
				if (data.ok == 'F') {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
				} else if (data.ok == 'T') {

					$('#message').modal();
					$('#message').find('.modal-body p').html('Kreiran nalog ' + data.key);

					setTimeout(function () {
						window.location.href = '/inventory/viewOrderOut';
					}, 1000);

				} else {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data);
				}
			}
		});
	} else {
		$('#message').modal();
		$('#message').find('.modal-body p').html("Morate prvo da odmapirate sve kutije!");
	}
});

referents = [];
$.ajax({
	url: "/users/getUsers",
	type: "post",
	data: {

	},
	dataType: 'json',
	async: false,
	success: function (data) {
		referents = data;
	}
});

$('#referents').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(referents)
	}).on('typeahead:selected', function (obj, value) {

	});

documentType = [];
$.ajax({
	url: "/inventory/getDocument",
	type: "post",
	data: {

	},
	dataType: 'json',
	async: false,
	success: function (data) {
		documentType = data;
	}
});

$('#typeDoc').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(documentType)
	}).on('typeahead:selected', function (obj, value) {

	});

$('#companyName').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(mainClient)
	}).on('typeahead:selected', function (obj, value) {
		showSubjectInfo();
		showBranch();
	});

$('#subjectName').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(mainClient)
	}).on('typeahead:selected', function (obj, value) {

	});

$('#sectorName').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(gradovi)
	}).on('typeahead:selected', function (obj, value) {
		$('.inventoryBlock>.mask').hide();
		//$('#sectorName').prop('disabled',true).css('background-color','#eee');
		$('.changeSubjectHolder').show();
		$("#inventoryId").focus();
		showSubjectInfo();
	});



$('#sectorNameSearch').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(gradovi)
	}).on('typeahead:selected', function (obj, value) {
		/*$('.inventoryBlock>.mask').hide();
		$('#sectorName').prop('disabled',true).css('background-color','#eee');
		$('.changeSubjectHolder').show();
		$("#inventoryId").focus();
		showSubjectInfo();*/
	});

$(document).on('keydown', '.checkId', function (e) {
	thisItem = $(this);
	if (e.which == 13 || e.which == 9) {
		console.log('EWE COMP')
		if (thisItem.val() != thisItem.data('id')) {
			$('#message').modal();
			$('#message').find('.modal-body p').html('Pogresan broj');
		} else {
			thisItem.prop('disabled', true).css('background-color', '#eee');
			console.log(thisItem.data('id').substring(0, 2));
			console.log($(this).closest('tr').find('.checkIdent').is(':disabled'));
			console.log(thisItem.val());
			console.log($(this).closest('tr').find('.checkIdent'));
			console.log($(this).closest('tr').find('.checkIdent').val());
			console.log($('#key').text());

			if ((thisItem.data('id').substring(0, 2) == 'M1' || thisItem.data('id').substring(0, 2) == 'M2') && $(this).closest('tr').find('.checkIdent').is(':disabled')) {
				$.ajax({
					url: '/inventory/demapIdentCheck',
					type: "post",
					data: {
						mapId: thisItem.val(),
						boxId: $(this).closest('tr').find('.checkIdent').val(),
						key: $('#key').text()
					},
					dataType: 'json',
					success: function (data) {
						//console.log(data.ok);
						if (data.ok == 'F') {
							$('.confirmOrder').prop('disabled', true);
						} else {
							$('.confirmOrder').prop('disabled', false);
						}
					}
				});
			}
		}
		/*
		$.ajax({
			url: '/inventory/checkBoxOrder',
			type: "post",
			data: {
				key: $('#boxIdMapping').val(),
				orderKey : $('#orderKey').text()
			},
			dataType: 'json',
			success:function(data){
				//console.log(data);
				if (data) {
					$('input[name=boxIdMapping]').prop('disabled',true);
					$('input[name=shelf]').prop('disabled',false);
					$('input[name=shelf]').focus();
				} else {
					$('#message').modal();
					$('#message').find('.modal-body p').html("Data kutija se ne nalazi na nalogu!");
				}
			}
		});*/
	}
});


$(document).on('click', '.demaping', function (e) {
	$(this).data('map');
	$(this).data('box');
	thisItem = $(this);
	thisItem2 = $(this).closest('tr').find('.checkIdent');
	thisItem1 = $(this).closest('tr').find('.checkMap');

	if (thisItem2.is(':disabled') && thisItem1.is(':disabled')) {
		$(this).prop('disabled', true);
		$.ajax({
			url: "/inventory/demap",
			type: "post",
			data: {
				box: $(this).data('box'),
				map: $(this).data('map')
			},
			dataType: 'json',
			async: false,
			success: function (data) {
				$('#message').modal();
				$('#message').find('.modal-body p').html('Uspesno odmapirano');

			}
		});
	} else {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Morate prvo da unesete podatke');
	}
});

$(document).on('click', '.ident', function (e) {
	ident = $(this).data('ident');
	$('.mainFog').show();
	$('.mainFogImage').show();
	$.ajax({
		url: '/inventory/identSerials',
		type: "post",
		data: {
			boxId: ident
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			//console.log(data);
			//console.log(data.docType);
			string = "<table style='width:100%'>";
			$.each(data, function (index, value) {
				string += "<tr><td>" + value.acSerialNo + "</td></tr>";
			});
			//console.log(string);

			$('#message').modal();
			$('#message').find('.modal-body p').html(string);
		}
	});
});

$(document).on('click', '.identInfo', function (e) {
	ident = $(this).data('ident');
	$('.mainFog').show();
	$('.mainFogImage').show();
	$.ajax({
		url: '/inventory/identInfo',
		type: "post",
		data: {
			ident: ident
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			//console.log(data);
			//console.log(data.docType);
			string = "<table style='width:100%'>" +
				"<tr><td>Tip dokumentacije</td><td>" + data.docType + "</td></tr>" +
				"<tr><td>Opis</td><td>" + data.description + "</td></tr>" +
				"<tr><td>Godina nastanka od</td><td>" + data.created + "</td></tr>" +
				"<tr><td>Godina nastanka do</td><td>" + data.anCreatedTo + "</td></tr>";
			if (data.storing == '-1') {
				string += "<tr><td>Rok čuvanja</td><td>Trajno</td></tr>";
			} else {
				string += "<tr><td>Rok čuvanja</td><td>" + data.storing + "</td></tr>";
			}


			string += "<tr><td>Datum od</td><td>";
			if (data.dateFrom == '01-01-1900') {

			} else {
				string += data.dateFrom;
			}
			string += "</td></tr>" +
				"<tr><td>Datum do</td><td>";
			if (data.dateTo == '01-01-1900') {

			} else {
				string += data.dateTo;
			}
			string += "</td></tr>";

			string += "<tr><td>Partija od</td><td>" + data.refIdFrom + "</td></tr>" +
				"<tr><td>Partija do</td><td>" + data.refIdTo + "</td></tr>";


			string += "<tr><td>Napomena</td><td>" + data.note + "</td></tr>" +
				"<tr><td>Sadržaj</td><td>" + data.acContent + "</td></tr>" +
				"<tr><td>Tip sadržaja</td><td>" + data.acContentType + "</td></tr>" +
				"<tr><td>Arh. broj</td><td>" + data.acArhiveNo + "</td></tr>" +
				"<tr><td>Kre. broj</td><td>" + data.acCreditNumber + "</td></tr>" +
				"<tr><td>Odsek</td><td>" + data.acDepartment + "</td></tr>" +
				"<tr><td>Opis kutije</td><td>" + data.acBoxDescription + "</td></tr>" +
				"<tr><td>Matični broj</td><td>" + data.acRegistrationNo + "</td></tr>" +
				"<tr><td>Organizaciona jedinica</td><td>" + data.acOrganizationalUnit + "</td></tr>" +
				"<tr><td>Dodatni opis</td><td>" + data.acName + "</td></tr>" +
				"<tr><td>Opis tipa kredita</td><td>" + data.acCreditTypeDescription + "</td></tr>" +
				"<tr><td>Tip Proizvoda</td><td>" + data.acProductType + "</td></tr>" +
				"<tr><td>Sadržaj</td><td>" + data.acContent + "</td></tr>" +
				"</table>";
			$('#message').modal();
			$('#message').find('.modal-body p').html(string);
		}
	});
});


$(document).on('click', '.status1', function (e) {
	key = $(this).data('id');

	$.ajax({
		url: '/inventory/status1',
		type: "post",
		data: {
			key: key
		},
		dataType: 'json',
		success: function (data) {
			$('#message').modal();
			$('#message').find('.modal-body p').html(data.message);
			setTimeout(function () {
				window.location.href = '/inventory/orderView';
			}, 1000);
		}
	});
});


$('#sectorName1').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(gradovi)
	}).on('typeahead:selected', function (obj, value) {
		$('.inventoryBlock>.mask').hide();
		$('#sectorName1').prop('disabled', true).css('background-color', '#eee');
		$('.changeSubjectHolder').show();

		showSubjectInfo();
	});

$(document).one('keydown', '#sectorName1', function (e) {
	var url;
	var dataTypes;
	if (e.which == 13 || e.which == 9) {
		subject = $('#sectorName1').val();
		$('.addBoxOut').prop('disabled', false);
		if (subject == '') {
			$('#message').modal();
			$('#message').find('.modal-body p').html("Morate izabrati sektor");
		} else {

			if ($(this).data('type') == 'R') {
				url = '/inventory/newRevers';
				dataTypes = 'R';
			} else if ($(this).data('type') == 'U') {
				url = '/inventory/newPermanentDestruction';
				dataTypes = 'U';
			} else {
				url = '/inventory/newPermanentReturn';
			}

			$.ajax({
				url: url,
				type: "post",
				data: {
					subject: subject
				},
				dataType: 'json',
				success: function (data) {
					if (data.ok == 'F') {
						$('#message').modal();
						$('#message').find('.modal-body p').html(data.message);
						setTimeout(function () {
							if (dataTypes == 'R') {
								window.location.href = '/inventory/viewRevers';
							} else if (dataTypes == 'U') {
								window.location.href = '/inventory/viewDestruction';
							} else {
								window.location.href = '/inventory/viewReturns';
							}
						}, 1000);
					} else {
						$('.addBoxOut').prop('disabled', false);
						$('#message').modal();
						$('#message').find('.modal-body p').html(data.message);
						$('#key').html(data.key);
					}
				}
			});
		}
	}
});

$(document).one('change', '#sectorName1', function (e) {
	e.preventDefault();
	var url;
	var dataTypes;
	subject = $('#sectorName1').val();
	$('.addBoxOut').prop('disabled', false);
	if (subject == '') {
		$('#message').modal();
		$('#message').find('.modal-body p').html("Morate izabrati sektor");
	} else {

		if ($(this).data('type') == 'R') {
			url = '/inventory/newRevers';
			dataTypes = 'R';
		} else if ($(this).data('type') == 'U') {
			url = '/inventory/newPermanentDestruction';
			dataTypes = 'U';
		} else {
			url = '/inventory/newPermanentReturn';
		}

		$.ajax({
			url: url,
			type: "post",
			data: {
				subject: subject
			},
			dataType: 'json',
			success: function (data) {
				if (data.ok == 'F') {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
					setTimeout(function () {
						if (dataTypes == 'R') {
							window.location.href = '/inventory/viewRevers';
						} else if (dataTypes == 'U') {
							window.location.href = '/inventory/viewDestruction';
						} else {
							window.location.href = '/inventory/viewReturns';
						}
					}, 1000);
				} else {
					$('.addBoxOut').prop('disabled', false);
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
					$('#key').html(data.key);
				}
			}
		});
	}
});

$(document).on('keyup', '.orderSearchKey', function (e) {
	term = $(this).val().toUpperCase();;

	if (term != '') {
		$('.tableBody').find('tr').hide();
		$("[class*=" + term + "]").show();
	} else {
		$('.tableBody').find('tr').show();
	}
});

$('.orderSearchKeyCustom').on('keydown', function (e) {
	if (e.which == 13) {
		term = $(this).val().toUpperCase();
		console.log(term, 'term');
		if (term != '') {
			$('.tableBody').find('tr').hide();
			$("[class*=" + term + "]").show();
		} else {
			$('.tableBody').find('tr').show();
		}
	}
});


$('.filterShowCustomClick').on('click', function (e) {
	term = $('.orderSearchKeyCustom').val().toUpperCase();
	if (term != '') {
		$('.tableBody').find('tr').hide();
		$("[class*=" + term + "]").show();
	} else {
		$('.tableBody').find('tr').show();
	}
});




$(document).on('click', '.searchWarehouse', function (e) {
	subject = $("[name='subject']").val();
	ident = $('[name=ident]').val();
	warehouse = $('[name=warehouse]').val();

	$('.mainFog').show();
	$('.mainFogImage').show();

	$.ajax({
		url: "/inventory/warehouseView",
		type: "post",
		data: {
			subject: subject,
			ident: ident,
			warehouse: warehouse
		},

		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();


			$('.itemHolder').html(data);
		}
	});
});

$('select[name=statusIn]').on('change', function () {
	status = $(this).val();
	$.ajax({
		url: "/inventory/viewReceipts",
		type: "post",
		data: {
			status: status
		},

		success: function (data) {
			$('.tableBody').html(data);
		}
	});
});

$('select[name=statusRevers]').on('change', function () {
	status = $(this).val();
	$.ajax({
		url: "/inventory/viewRetrurns",
		type: "post",
		data: {
			status: status
		},

		success: function (data) {
			$('.tableBody').html(data);
		}
	});
});


$('select[name=statusOut]').on('change', function () {

	if ($(this).data('type') == '01W0') {
		var status = $(this).val();
		$.ajax({
			url: "/inventory/showWebOrders",
			type: "post",
			data: {
				status: status
			},

			success: function (data) {
				$('.tableBody').html(data);
			}
		});
	} else {
		var status = $(this).val();
		tab = $('.nav').find('a[aria-expanded]').attr('aria-expanded');

		if (!tab) {

			tab = 'true';
		}

		$.ajax({
			url: "/inventory/viewOrderOut",
			type: "post",
			data: {
				status: status,
				tab: tab
			},

			success: function (data) {
				$('.tableBody').html(data);
			}
		});
	}

});

$('select[name=statusOrderOut]').on('change', function () {
	dataType = $(this).data('type');

	if (dataType == 'R') {
		urls = "/inventory/viewReturns";
	} else if (dataType == 'D') {
		urls = "/inventory/viewDestruction";
	} else if (dataType == 'Re') {
		urls = "/inventory/viewRevers";
	}
	//console.log(urls);
	status = $(this).val();
	$.ajax({
		url: urls,
		type: "post",
		data: {
			status: status
		},
		success: function (data) {
			$('.tableBody').html(data);
		}
	});
});

//kloniranje web naloga

$(document).on('click', '.cloneOrder', function (e) {
	orderKey = $(this).closest('tr').find('.ident').text();
	subject = $(this).closest('tr').find('.subject').text();

	if (orderKey == '') {
		orderKey = $('#key').text();
		subject = $('.brancheName').text();
	}

	$.ajax({
		url: "/test/cloneOrder",
		type: "post",
		data: {
			orderKey: orderKey,
			subject: subject
		},
		dataType: 'json',
		success: function (data) {
			//console.log(data);
			$('#message').modal();
			$('#message').find('.modal-body p').html(data.message + ' ' + data.key);
			setTimeout(function () {
				window.location.href = '/inventory/showWebOrders';
			}, 2000);

		}
	});
});


$(document).on("click", ".cloneOrder", function (e) {
	orderKey = $(this).closest("tr").find(".ident").text();
	subject = $(this).closest("tr").find(".subject").text();

	if (orderKey == "") {
		orderKey = $("#key").text();
		subject = $(".brancheName").text();
	}

	$.ajax({
		url: "/test/cloneOrder",
		type: "post",
		data: {
			orderKey: orderKey,
			subject: subject,
		},
		dataType: "json",
		success: function (data) {
			//console.log(data);
			$("#message").modal();
			$("#message")
				.find(".modal-body p")
				.html(data.message + " " + data.key);
			setTimeout(function () {
				window.location.href = "/inventory/showWebOrders";
			}, 2000);
		},
	});
});

$(document).on("click", ".cloneOrderWB", function (e) {
	var orderKey = $(this).attr('data-key');
	var subject = $(this).attr("data-subject");

	if (orderKey == "") {
		orderKey = $("#key").text();
		subject = $(".brancheName").text();
	}

	$.ajax({
		url: "/inventory/cloneOrder",
		type: "post",
		data: {
			orderKey: orderKey,
			subject: subject,
		},
		dataType: "json",
		success: function (data) {
			//console.log(data);
			$("#message").modal();
			$("#message")
				.find(".modal-body p")
				.html(data.message + " " + data.key);
			setTimeout(function () {
				window.location.href = "/inventory/showWebOrders";
			}, 2000);
		},
	});
});

$(document).on('click', '.changeRecpits', function (e) {

	$('.subjectInformation').hide();
	$('.changeRecpits').hide();
	$('.changeDocumentInfo').show();
	$('#subject').prop('disabled', false).css('background-color', 'white');
});

$(document).on('click', '.changeRecpitsCancel', function (e) {
	$('.subjectInformation').show();
	$('.changeRecpits').show();
	$('.changeDocumentInfo').hide();
});

$(document).on('click', '.changeRecpitsConfirm', function (e) {
	error = 0;
	subject = $('input[name=subject]').val();
	var refNo = $('input[name=refNo]').val();
	var dateCreate = $('input[name=dateCreate]').val();
	var dateDoc = $('input[name=dateDoc]').val();
	var key = $('#key').text();

	if (!subject) {
		subject = $('.brancheName').text();
	}

	if (!subject) {
		error = 1;
	} else if (!refNo) {
		error = 1;
	} else if (!dateCreate) {
		error = 1;
	} else if (!dateDoc) {
		error = 1;
	} else if (!key) {
		error = 1;
	}

	if (error == '0') {
		$.ajax({
			url: "/inventory/changeRecpits",
			type: "post",
			data: {
				subject: subject,
				refNo: refNo,
				dateCreate: dateCreate,
				dateDoc: dateDoc,
				key: key
			},
			dataType: 'json',
			success: function (data) {
				if (data.ok == 'F') {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
				} else {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
					$('.changeDocumentInfo').hide();
					$('.boxHolder').prepend(
						'<div class="alert alert-info">' +
						'<div class="row">' +
						'<div class="col-sm-4">' +
						'<strong>Datum:</strong> ' + dateDoc + ' ' +
						'</div>' +
						'<div class="col-sm-4">' +
						'<strong>Dokument:</strong> ' + refNo + ' ' +
						'</div>' +
						'<div class="col-sm-4">' +
						'<strong>Datum dokumenta:</strong> ' + dateCreate + ' ' +
						'</div>' +
						'</div>' +
						'</div>'
					);
					$('.showBlockToStor').append(
						'<div>' +
						'<button class="btn btn-success  changeRecpits" style="float: right; margin-right: 30px;">Izmeni nalog</button>' +
						'</div>'
					).css('margin-left', '0px');
					/*setTimeout(function() {
						window.location.href = '/inventory/showReceipts/'+key;
					}, 1000);*/
				}
			}
		});
	} else {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Niste popunili sva polja!');
	}
});

$(document).on('click', '.searchBoxCompany', function (e) {

	error = 0;
	subject = $('input[name=subject]').val();
	dateFrom = $('input[name=dateFrom]').val();
	dateTo = $('input[name=dateTo]').val();

	$('#clientBox').prop('disabled', false).css('background-color', 'white');
	if (!subject) {
		error = 1;
	} else if (!dateFrom) {
		error = 1;
	} else if (!dateTo) {
		error = 1;
	}

	if (error == '0') {
		$.ajax({
			url: "/inventory/companyBoxs",
			type: "post",
			data: {
				subject: subject,
				dateFrom: dateFrom,
				dateTo: dateTo
			},

			success: function (data) {
				$('.showResults').html(data);
			}
		});
	} else {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Niste popunili sva polja!');
	}

});

$(document).on('click', '.searchEmptyBoxCompany', function (e) {

	error = 0;
	subject = $('input[name=subject]').val();
	dateFrom = $('input[name=dateFrom]').val();
	dateTo = $('input[name=dateTo]').val();

	$('#clientBox').prop('disabled', false).css('background-color', 'white');
	if (!subject) {
		error = 1;
	} else if (!dateFrom) {
		error = 1;
	} else if (!dateTo) {
		error = 1;
	}

	if (error == '0') {
		$.ajax({
			url: "/inventory/companyEmptyBoxsSent",
			type: "post",
			data: {
				subject: subject,
				dateFrom: dateFrom,
				dateTo: dateTo
			},

			success: function (data) {
				$('.showResults').html(data);
			}
		});
	} else {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Niste popunili sva polja!');
	}

});

$(document).on('click', '.scanReport', function (e) {

	error = 0;
	subject = $('input[name=subject]').val();
	dateFrom = $('input[name=dateFrom]').val();
	dateTo = $('input[name=dateTo]').val();

	$('#clientBox').prop('disabled', false).css('background-color', 'white');
	if (!subject) {
		error = 1;
	} else if (!dateFrom) {
		error = 1;
	} else if (!dateTo) {
		error = 1;
	}

	if (error == '0') {
		$.ajax({
			url: "/inventory/scanReport",
			type: "post",
			data: {
				subject: subject,
				dateFrom: dateFrom,
				dateTo: dateTo
			},

			success: function (data) {
				$('.showResults').html(data);
			}
		});
	} else {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Niste popunili sva polja!');
	}

});

$('select[name=statusRequest]').on('change', function () {

	status = $(this).val();

	$.ajax({
		url: "/inventory/showWebInventory",
		type: "post",
		data: {
			status: status
		},

		success: function (data) {
			$('.tableBody').html(data);
		}
	});

});

$(document).on('click', '.requestStatus1', function (e) {
	key = $(this).data('key');
	var thisItem = $(this);
	$.ajax({
		url: "/inventory/requestToStatus1",
		type: "post",
		data: {
			key: key
		},
		dataType: 'json',
		success: function (data) {
			if (data.ok == 'F') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			} else {
				thisItem.closest('tr').hide();
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			}
		}
	});
});

$('input[name=serialNumber]').on('keydown', function (e) {
	if (e.which == 13 || e.which == 9) {
		serial = $(this).data('serial');
		serialInput = $(this).val();

		if (serial == serialInput) {
			$(this).prop('disabled', true);
		} else {
			$('#message').modal();
			$('#message').find('.modal-body p').html("Unesti serijski broj se ne slaže sa traženim serijskim");
			$(this).val('');
		}
	}
});

$(document).on('click', '.closeRequest', function (e) {
	z = 0;
	$('input[name=serialNumber]').each(function (i, str) {
		if (!$(this).is(':disabled')) {
			z++;
		}
	});

	if (z == 0) {
		keys = $('#key').text();

		$.ajax({
			url: "/inventory/confirmRequest",
			type: "post",
			data: {
				key: keys
			},
			dataType: 'json',
			success: function (data) {
				if (data.ok == 'F') {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
				} else {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
					setTimeout(function () {
						window.location.href = '/inventory/showWebInventory';
					}, 2000);

				}
			}
		});
	} else {
		$('#message').modal();
		$('#message').find('.modal-body p').html("Morate da unesete sve serijske brojeve!");
	}
});


$(document).on('click', '.finisOrderOut', function (e) {
	key = $('#key').text();
	$('.mainFog').show();
	$('.mainFogImage').show();
	$.ajax({
		url: "/inventory/finishOrderOut",
		type: "post",
		data: {
			key: key
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			if (data.ok == 'F') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			} else {
				$('#message').modal();
				$('#message').find('.modal-body p').html("Nalog zavrsen!");
				setTimeout(function () {
					if (data.key.includes('3R00')) {
						window.location.href = '/inventory/viewRevers';
					} else if (data.key.includes('3010')) {
						window.location.href = '/inventory/viewDestruction';
					} else {
						window.location.href = '/inventory/viewReturns';
					}
				}, 1500);
			}
		}
	});
});

$('input[name=RBboxNumber]').on('keydown', function (e) {
	thisItem = $(this);
	if (e.which == 13 || e.which == 9) {
		$.ajax({
			url: '/inventory/RBgetBoxItems',
			type: "post",
			data: {
				ident: thisItem.val(),
				sector: $('.brancheName').text()
			},
			dataType: 'json',
			success: function (data) {
				if (data) {
					thisItem.prop('disabled', true);
					$('.addAllBoxesRBBox').removeAttr('disabled');
					$(".addAllBoxesRBBox").attr("data-box", thisItem.val());
					$('input[name=massSerialNoBox]').prop('disabled', false);
					string = '';
					$.each(data, function (i, item) {
						string += '<tr class=' + thisItem.val() + '>';
						string += '<td class="serialNo">' + item.serialNo + '</td>';
						string += '<td><input type="text" name="checkSerialNo" class="form-control checkSerialNo2" data-ident="' + item.ident + '" data-serialno="' + item.serialNo + '"  /></td>';
						string += '<td><span class="glyphicon glyphicon-refresh refreshFieldRBox" style="cursor: pointer;"></span></td>';
						string += '<td>' + item.boxType + '</td>';
						string += '<td>' + item.created + '</td>';
						string += '<td>' + item.documentType + '</td>';
						if (item.storing == '-1') {
							string += '<td>Trajno</td>';
						} else {
							string += '<td>' + item.storing + '</td>';
						}
						string += '<td><button class="close1" id="RBdeleteSerial" data-serial="' + item.serialNo + '">&times;</button></td>';
						string += '<tr>';

						$(".addAllBoxesRBBox").show();

					});

					$('#boxItems').html(string);
					$('.checkSerialNo2').first().focus();
				} else {
					$('#message').modal();
					$('#message').find('.modal-body p').html('Ne postoji kutija u pripremnom magacinu, koja je vezana za ovu firmu');
				}
			}
		});
	}
});

$(document).on("click", ".refreshFieldRBox", function (e) {
	$(this).closest("tr").find('input[name="checkSerialNo"]').val("");
	$(this)
		.closest("tr")
		.find('input[name="checkSerialNo"]')
		.removeAttr("disabled");
	$(this)
		.closest("tr")
		.find('input[name="checkSerialNo"]')
		.css("background", "");
});



$('input[name=massSerialNoBox]').on('keydown', function (e) {
	if (e.which == 13) {
		serialCheck = $(this).val();
		boxIdent = $('input[name=RBboxNumber]').val();
		sector = $('.brancheName').text();
		orderKeys = $('#orderKey').text();
		var checkKey = 'F';
		$.each($("." + boxIdent + ""), function (i, d) {
			if ($(this).find('.checkSerialNo2').data('serialno') == serialCheck) {
				var thisItem = $(this).find('.checkSerialNo2');
				$.ajax({
					url: '/inventory/addToOrderIn',
					type: "post",
					data: {
						boxIdent: boxIdent,
						serialNo: serialCheck,
						sector: sector,
						orderKeys: orderKeys
					},
					dataType: 'json',
					success: function (data) {
						if (data.ok == 'T') {
							checkKey = 'T';
							$('input[name=massSerialNoBox]').val('').focus();
							thisItem.prop('disabled', true);
							thisItem.val(serialCheck);
							thisItem.closest('tr').find('button').remove();
							$('.RBcloseBox').attr('data-key', data.key);
						} else {
							$('#message').modal();
							$('#message').find('.modal-body p').html(data.message);
						}
					}
				});
			}
		});
	}
});



$(document).on('click', '#RBdeleteSerial', function () {
	$(this).closest('tr').remove();
});

$(document).on('keydown', 'input[name=checkSerialNo]', function (e) {
	thisItem = $(this);
	if (e.which == 13 || e.which == 9) {
		//alert($(this).closest('tr').find('.serialNo').text());
		if ($(this).val() == $(this).closest('tr').find('.serialNo').text()) {
			$.ajax({
				url: '/inventory/addToOrderIn',
				type: "post",
				data: {
					boxIdent: thisItem.data('ident'),
					serialNo: thisItem.data('serialno'),
					sector: $('.brancheName').text(),
					orderKeys: $('#orderKey').text()
				},
				dataType: 'json',
				success: function (data) {
					if (data.ok == 'T') {
						thisItem.prop('disabled', true);
						thisItem.closest('tr').find('button').remove();
						$('.RBcloseBox').attr('data-key', data.key);
					} else {
						$('#message').modal();
						$('#message').find('.modal-body p').html(data.message);
					}
				}
			});
		} else if ($(this).val() != $(this).closest('tr').find('.serialNo').text() && $('.brancheName').text() == 'ProCredit Bank DOO') {
			$.ajax({
				url: '/inventory/addToOrderIn',
				type: "post",
				data: {
					boxIdent: thisItem.data('ident'),
					serialNo: thisItem.data('serialno'),
					sector: $('.brancheName').text(),
					orderKeys: $('#orderKey').text()
				},
				dataType: 'json',
				success: function (data) {
					if (data.ok == 'T') {
						thisItem.prop('disabled', true);
						thisItem.closest('tr').find('button').remove();
						$('.RBcloseBox').attr('data-key', data.key);
					} else {
						$('#message').modal();
						$('#message').find('.modal-body p').html(data.message);
					}
				}
			});
		} else {
			$('#message').modal();
			$('#message').find('.modal-body p').html('Inventarski broj se ne slaže');
		}
	}
});

$(document).on('click', '.RBcloseBox', function () {
	var rowCount = $('#boxItems tr').length;

	if (rowCount == 1) {
		$('#message').modal();
		$('#message').find('.modal-body p').html("Ne mozete zatvoriti praznu kutiju!");
	} else {
		//

		message = 0;
		$(".checkSerialNo2").each(function () {

			if ($.trim($(this).val()).length == 0) message = 1;
		});



		if (message == 0) {
			$.ajax({
				url: '/inventory/RBgetBoxSelectedItems',
				type: "post",
				data: {
					key: $(this).attr('data-key'),
					sector: $('.brancheName').text()
				},
				success: function (data) {
					$(".addAllBoxesRBBox").hide();
					$('input[name=RBboxNumber]').val('').prop('disabled', false).focus();
					$('#showBoxItems').html(data);
					$('#boxItems').html("");
				}
			});
		} else {
			$('#message').modal();
			$('#message').find('.modal-body p').html('Nisu uneti svi brojevi inventara');
		}
	}
});

$(document).on('click', '.createHeadWarehouseIn', function (i) {
	var name = $('#RBsectorName').val();
	block = $('select[name=blockType]').find(":selected").val();

	if (!name) {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Morate da izaberete subjekta!');
	} else if (block == 0) {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Morate da izaberete blok!');
	} else {
		$.ajax({
			url: '/inventory/createWarehouseIn',
			type: "post",
			data: {
				block: block,
				name: name
			},
			dataType: 'json',
			success: function (data) {
				if (data.key) {

					$("#message").modal();
					$("#message").find(".modal-body p").html(data.message);
					setTimeout(function () {
						window.location.href =
							"/inventory/returnBoxesEdit/" + data.key;
					}, 2000);
				} else {
					$('#message').modal();
					$("#message").find(".modal-body p").html(data.message);

					setTimeout(function () {
						$("#message").modal('hide');
					}, 2000);
				}


				// $('.selectedKey').html('<a style="margin:9px 18px 0 0; background: red" class="btn btn-primary btn-sm selectedKey" href="/inventory/orderEdit/'+data.key+'">'+
				// 			'<span class="glyphicon glyphicon-list-alt"></span>&nbsp;&nbsp;'+name+'</a>');
				// $('#removableSector').remove();
				// $('#orderKey').html(data.key);
				// $('#message').modal();
				// $('#message').find('.modal-body p').html('Uspesno kreiran nalog' +data.key);
			}
		});
	}
});

$(document).on('click', '.createHeadWarehouseOut', function (i) {
	var name = $('#sectorName').val();
	block = $('select[name=blockType]').val();

	if (!name) {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Morate da izaberete subjekta!');
	} else if (block == 0) {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Morate da izaberete blok!');
	} else {
		$.ajax({
			url: '/inventory/createWarehouseOut',
			type: "post",
			data: {
				block: block,
				name: name
			},
			dataType: 'json',
			success: function (data) {
				$('.selectedKey').html('<a style="margin:9px 18px 0 0; background: red" class="btn btn-primary btn-sm selectedKey" href="/inventory/orderEdit/' + data.key + '">' +
					'<span class="glyphicon glyphicon-list-alt"></span>&nbsp;&nbsp;' + name + '</a>');
				$('#removableSector').remove();
				$('#message').modal();
				$('#message').find('.modal-body p').html('Uspesno kreiran nalog' + data.key);
				$('#key').html(data.key);
				$('.addBoxExit').prop('disabled', false);
				if (data.key.includes('01D0')) {
					$('.addBoxExit').attr('data-doctype', '01D0');
				}
				if (data.key.includes('01F0')) {
					$('.addBoxExit').attr('data-doctype', '01F0');
				}
			}
		});
	}
});

$('#RBsectorName').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(gradovi)
	}).on('typeahead:selected', function (obj, value) {
		$('.inventoryBlock>.mask').hide();
		$('#sectorName').prop('disabled', true).css('background-color', '#eee');
		$('.changeSubjectHolder').show();
		$("#inventoryId").focus();
		name = $('#RBsectorName').val();
		showSubjectInfo1(name);
	});

function showSubjectInfo1() {

	name = $('#RBsectorName').val();

	$.ajax({
		url: '/subjects/getData',
		type: "post",
		data: {
			head: true,
			name: name
		},
		dataType: 'json',
		success: function (data) {

			string =
				'<div class="well" style="height:85px;">' +
				'<div class="col-sm-4">' +
				'<b><span class="brancheName">' + data.name + '</span><br>' +
				data.address + '<br>' +
				data.zipCode + ' ' + data.city + '</b>' +
				'</div>' +
				'<div class="col-sm-4">' +
				'<table>' +
				'<tr>' +
				'<td>PIB:</td>' +
				'<td>&nbsp;&nbsp;&nbsp;&nbsp;</td>' +
				'<td>' + data.pib + '</td>' +
				'</tr>' +
				'<tr>' +
				'<td>Maticni broj:</td>' +
				'<td></td>' +
				'<td>' + data.companyNumber + '</td>' +
				'</tr>' +
				'<tr>' +
				'<td>Broj ugovora:</td>' +
				'<td></td>' +
				'<td>' + data.contractNumber + '</td>' +
				'</tr>' +
				'</table>' +
				'</div>' +
				'<div class="col-sm-4">' +
				'<table>' +
				'<tr>' +
				'<td>Kontakt osoba:</td>' +
				'<td>&nbsp;&nbsp;&nbsp;&nbsp;</td>' +
				'<td>' + data.contactName + '</td>' +
				'</tr>' +
				'<tr>' +
				'<td>Kontakt telefon:</td>' +
				'<td></td>' +
				'<td>' + data.contactPhone + '</td>' +
				'</tr>' +
				'<tr>' +
				'<td>E-mail:</td>' +
				'<td></td>' +
				'<td>' + data.contactEmail + '</td>' +
				'</tr>' +
				'</table>' +
				'</div>' +
				'</div>';
			if (data.ok == 'F') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			} else {
				$('.subjectHolder').html(string);
				$('#subjectBox').closest('.row').remove();
			}


		}
	});
}

$(document).on('click', '.RBcloseReceipts', function (e) {
	$.ajax({
		url: '/inventory/orderStatus2',
		type: "post",
		data: {
			orderKey: $('#orderKey').text()
		},
		dataType: 'json',
		success: function (data) {
			if (data.ok == 'F') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			} else if (data.ok == 'T') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
				setTimeout(function () {
					window.location.href = '/inventory/viewReceipts';
				}, 1000);
			}
		}
	});
});

$(document).on('click', '.RBremoveBox', function (e) {
	thisItem = $(this);
	$.ajax({
		url: "/inventory/deleteFromOrder",
		type: "post",
		data: {
			boxIdent: $(this).data('boxid'),
			key: $(this).data('key')
		},
		dataType: 'json',
		async: false,
		success: function (data) {
			if (data.ok == 'F') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			} else if (data.ok == 'T') {
				thisItem.closest('table').remove();
			}
		}
	});
});

$(document).on('keydown', 'input[name=checkSerialNo2]', function (e) {
	thisItem = $(this);
	if (e.which == 13 || e.which == 9) {
		//alert($(this).closest('tr').find('.serialNo').text());
		if ($(this).val() == $(this).closest('tr').find('.serialNo').text()) {
			$.ajax({
				url: '/inventory/addToOrderIn',
				type: "post",
				data: {
					boxIdent: thisItem.data('ident'),
					serialNo: thisItem.data('serialno'),
					sector: $('.brancheName').text(),
					flag: 'T'
				},
				dataType: 'json',
				success: function (data) {
					if (data.ok == 'T') {
						thisItem.prop('disabled', true);
						thisItem.closest('tr').find('button').remove();
						$('.RBcloseBox').attr('data-key', data.key);
					} else {
						$('#message').modal();
						$('#message').find('.modal-body p').html(data.message);
					}
				}
			});
		} else {
			$('#message').modal();
			$('#message').find('.modal-body p').html('Inventarski broj se ne slaže');
		}
	}
});

$(document).on('keydown', '.demapIdent', function (e) {
	if (e.which == 13 || e.which == 9) {
		mapId = $(this).data('id');
		boxId = $(this).data('box');
		key = $(this).data('key');
		/*$.ajax({
			url: '/inventory/demapIdentCheck',
			type: "post",
			data: {
				mapId: mapId,
				boxId: boxId,
				key: key
			},
			dataType: 'json',
			success:function(data){
			//console.log(data.ok);
				if(data.ok == 'F'){
					$('.confirmOrder').prop('disabled', true);
				}else{
					$('.confirmOrder').prop('disabled', false);
				}
			}
		}); */
	}
});

$(document).on('click', '.scanUpload', function () {

	serialNo = $(this).closest('tr').find('.identInfo').text();
	id = $(this).data('id');
	$('#message2').modal();
	$('#message2').find('.modal-header h4').html("Upload skeniranih fajlova");
	$('#message2').find('.modal-body p').html(
		"<form id='documentFormSubmit' action='/inventory/scanRequest' method='post' enctype='multipart/form-data' >" +
		"<input type='hidden' name='serialNo' value=" + serialNo + " />" +
		"<input type='hidden' name='requestId' value=" + id + " />" +
		"<input class='ImageCN'  type='file' name='cover_image[]' multiple/>" +
		"<div style='padding-top:2px; padding-bottom:2px' class='imageCNshow'></div>" +
		"</form>"
	);
	$('#message2').find('.modal-footer').html(
		"<button type='button' class='btn btn-success scanUploadFinish' data-dismiss='modal'>Potvrdi</button>" +
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Odustani</button>"
	);

	$('.scanUploadFinish').on('click', function (e) {

		$('#documentFormSubmit').submit();
	});

	$(document).delegate(".ImageCN", "change", function (e) {
		var name = '';
		$('.imageCNshow').show();
		var files = $('.ImageCN')[0].files;
		for (var i = 0; i < files.length; i++) {
			name += ' <span>' + files[i].name + '</span><br/>';

		}
		moveIt = files.length * 12;
		//console.log(moveIt);
		n = name.split(" ").join("\n");

		$('.imageCNshow').html(n).css('font-size', '12px').css('color', 'gray').css('font-family', 'Arial');
		$('.transpotrName, .MoveIt').css('margin-top', moveIt);

	});
});

$(document).on('click', '.deleteScan', function () {
	imgId = $(this).data('id');
	reqestId = $(this).data('key');
	thisItem = $(this);
	$.ajax({
		url: '/inventory/deleteScan',
		type: "post",
		data: {
			id: imgId,
			key: reqestId
		},
		dataType: 'json',
		success: function (data) {
			thisItem.parent().remove();
			$('#message').modal();
			$('#message').find('.modal-body p').html(data.message);
		}
	});
});

$(document).on('click', '.finishUpload', function () {
	reqestId = $(this).data('id');
	id = $(this).data('id');
	userEmail = $(this).closest('tr').find('.userEmail').text();
	$('#message2').modal();
	$('#message2').find('.modal-header h4').html("Upload skeniranih fajlova");
	$('#message2').find('.modal-body p').html(
		"<input type='text' placeholder='Unesite kolicinu' class='scanNo form-control' name='scanCnt' />"
	);
	$('#message2').find('.modal-footer').html(
		"<button type='button' data-email=" + userEmail + " data-id=" + reqestId + " class='btn btn-success finishUploadConfirm' data-dismiss='modal'>Potvrdi</button>" +
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Odustani</button>"
	);

	$('.scanFinish').on('click', function (e) {

		$('#documentFormSubmit').submit();
	});

	$(document).on('click', '.finishUploadConfirm', function () {
		cnt = $('.scanNo').val();
		key = $(this).data('id');
		email = $(this).data('email');
		if ($.isNumeric(cnt)) {
			$.ajax({
				url: '/inventory/finishUpload',
				type: "post",
				data: {
					key: key,
					email: email,
					cnt: cnt
				},
				dataType: 'json',
				success: function (data) {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
					setTimeout(function () {
						location.reload();
					}, 2000);
				}
			});
		} else {
			$('#message').modal();
			$('#message').find('.modal-body p').html("Morate uneti broj");
		}

	});
});

$(document).on('change', '.scanRequestStatus', function () {
	val = $(this).val();
	$.ajax({
		url: '/inventory/scanRequestShow',
		type: "post",
		data: {
			val: val
		},

		success: function (data) {
			$('.tableBody').html(data);
		}
	});
});

$(document).on('click', '.newScanRequest', function () {
	$('#message2').modal().css('z-index', '2050');
	$('#message2').find('.modal-content').css('width', '900px').css('position', 'absolute').css('top', '50%').css('left', '50%').css('margin-top', '20px').css('margin-left', '-400px');

	$('#message2').find('.modal-header h4').html("Novi zahtev za skeniranje");
	$('#message2').find('.modal-body p').html(
		"<form id='scanFormSubmit' action='/inventory/newScanRequest' method='post' enctype='multipart/form-data' >" +
		"<span><strong>Kompanija<strong></span>" +
		"<input id='companyName' type='text' name='subject' class='form-control' style='margin-bottom:15px' />" +
		"<span><strong>Osoba<strong></span>" +
		"<select class='form-control' name='scanPerson' style='margin-bottom:15px'>" +
		"<option>Izaberite</option>" +
		"</select>" +
		"<span><strong>Komentar<strong></span>" +
		"<textarea type='text' placeholder='Komentar' class='scanDescription form-control' name='scanComment' style='margin-bottom:15px' ></textarea>" +
		"<span><strong>Falovi<strong></span>" +
		"<input class='ImageCN'  type='file' name='cover_image[]' multiple/>" +
		"<div style='padding-top:2px; padding-bottom:2px' class='imageCNshow'></div>" +
		"<span><strong>Broj skeniranih stranica<strong></span>" +
		"<input  type='text' name='scanNo' class='form-control' style='margin-bottom:15px' />" +
		"</form>"
	);

	$('#message2').find('.modal-footer').html(
		"<button type='button'  class='btn btn-success scanNewUploadFinish' data-dismiss='modal'>Potvrdi</button>" +
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Odustani</button>"
	);

	$(document).delegate(".ImageCN", "change", function (e) {
		var name = '';
		$('.imageCNshow').show();
		var files = $('.ImageCN')[0].files;
		for (var i = 0; i < files.length; i++) {
			name += ' <span>' + files[i].name + '</span><br/>';

		}
		moveIt = files.length * 12;
		//console.log(moveIt);
		n = name.split(" ").join("\n");

		$('.imageCNshow').html(n).css('font-size', '12px').css('color', 'gray').css('font-family', 'Arial');
		$('.transpotrName, .MoveIt').css('margin-top', moveIt);
	});


	$('.scanNewUploadFinish').on('click', function (e) {
		e.preventDefault();
		$('#scanFormSubmit').submit();
	});

	gradovi = [];
	subjects = [];
	$.ajax({
		url: "/subjects/get",
		type: "post",
		data: {

		},
		dataType: 'json',
		async: false,
		success: function (data) {
			gradovi = data;
			subjects = data;
		}
	});

	$('#companyName').typeahead({
		hint: true,
		highlight: true,
		minLength: 1,
		limit: 10
	},
		{
			name: 'states',
			source: substringMatcher(gradovi)
		}).on('typeahead:selected', function (obj, value) {
			var string = '';
			$.ajax({
				url: "/inventory/getWorkers",
				type: "post",
				data: {
					subject: value
				},
				dataType: 'json',
				async: false,
				success: function (data) {
					string += "<option value='-1'>Izaberite</option>"
					$.each(data, function (index, value) {
						string += "<option value='" + value.email + "'>" + value.fullName + "-" + value.email + "</option>"
					});
					$('select[name=scanPerson]').html(string);
				}
			});
		});
});
$(document).on('change', '.boxRequestStatus', function () {
	val = $(this).val();
	$.ajax({
		url: '/inventory/boxRequestList',
		type: "post",
		data: {
			status: val
		},

		success: function (data) {
			$('.tableBody').html(data);
		}
	});
});

$(document).on('click', '.addBoxes', function () {
	var reqestId = $(this).data('id');
	var userEmail = $(this).closest('tr').find('.userEmail').data('email');
	var boxNmb = $(this).closest('tr').find('.boxNmb').data('nmbbox');
	var thisItem = $(this).closest('tr');

	$('#message2').modal();
	$('#message2').find('.modal-header h4').html("Slanje kutija");
	$('#message2').find('.modal-body p').html(
		"<input type='text' placeholder='Unesite kolicinu' class='boxNmb form-control' name='boxNmb' />" +
		"<span class='toggleMessage' style='display:none; color:red'>Količine se razlikuju</span>"
	);
	$('#message2').find('.modal-footer').html(
		"<button type='button' data-boxnmb=" + boxNmb + " data-email=" + userEmail + " data-id=" + reqestId + " class='btn btn-success finishSendBox' >Potvrdi</button>" +
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Odustani</button>"
	);

	$('input[name=boxNmb]').on('keyup', function () {
		value = $(this).val();
		boxCnt = $('.finishSendBox').data('boxnmb');
		if (value == boxCnt) {
			$('.toggleMessage').hide();
		} else {
			$('.toggleMessage').show();
		}
	});


	$(document).one('click', '.finishSendBox', function () {
		var reqestId = $(this).data('id');
		var userEmail = $(this).data('email');
		var boxNmb = $('input[name=boxNmb]').val();

		$.ajax({
			url: '/inventory/finishSendBox',
			type: "post",
			data: {
				reqestId: reqestId,
				userEmail: userEmail,
				boxNmb: boxNmb
			},
			dataType: 'json',
			success: function (data) {

				if (data == '1') {
					thisItem.remove();
					$('#message2').modal();
					$('#message2').find('.modal-header h4').html(" Slanje kutija");
					$('#message2').find('.modal-body p').css('border', 'none');
					$('#message2').find('.modal-body p').html("Zahtev je potvrdjen, posaljite kutije!");
					$('#message2').find('.modal-footer').html(
						"<button type='button' class='btn btn-success' data-dismiss='modal'>Ok</button>"
					);
				} else {
					$('#message2').modal();
					$('#message2').find('.modal-header h4').html("Slanje kutija");
					$('#message2').find('.modal-body p').css('border', 'none');
					$('#message2').find('.modal-body p').html("Dogodila se greška, pokušajte ponovo!");
					$('#message2').find('.modal-footer').html(
						"<button type='button' class='btn btn-success' data-dismiss='modal'>Ok</button>"
					);
				}
			}
		});
	});
});


$(document).on('click', '.getBoxNmb', function () {

	dateFrom = $('input[name=dateFromSerial]').val();
	dateTo = $('input[name=dateToSerial]').val();
	firm = $('input[name=subject]').val();

	$.ajax({
		url: '/inventory/getNmbBoxes',
		type: "post",
		data: {
			dateFrom: dateFrom,
			dateTo: dateTo,
			firm: firm
		},
		dataType: 'json',
		success: function (data) {
			//console.log(data);
			if (data) {
				$('.showNmbBox').html(data);
			} else {
				$('.showNmbBox').html('0');
			}
		}
	});
});

//Vracenje sa reversa
reversKeys = [];
$.ajax({
	url: "/inventory/getReversKeys",
	type: "post",
	data: {

	},
	dataType: 'json',
	async: false,
	success: function (data) {
		gradovi = data;
	}
});

$('#reversKey').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(gradovi)
	}).on('typeahead:selected', function (obj, value) {
		$("select[name=blockType]").focus();
	});



function showSubjectInfo1(subject) {
	//console.log(2);
	$.ajax({
		url: '/subjects/getData',
		type: "post",
		data: {
			name: subject,
		},
		dataType: 'json',
		success: function (data) {
			//$('#removableSector').remove();
			string =
				'<div class="well" style="height:85px;">' +
				'<div class="col-sm-4">' +
				'<b><span class="brancheName">' + data.name + '</span><br>' +
				data.address + '<br>' +
				data.zipCode + ' ' + data.city + '</b>' +
				'</div>' +
				'<div class="col-sm-4">' +
				'<table>' +
				'<tr>' +
				'<td>PIB:</td>' +
				'<td>&nbsp;&nbsp;&nbsp;&nbsp;</td>' +
				'<td>' + data.pib + '</td>' +
				'</tr>' +
				'<tr>' +
				'<td>Maticni broj:</td>' +
				'<td></td>' +
				'<td>' + data.companyNumber + '</td>' +
				'</tr>' +
				'<tr>' +
				'<td>Broj ugovora:</td>' +
				'<td></td>' +
				'<td>' + data.contractNumber + '</td>' +
				'</tr>' +
				'</table>' +
				'</div>' +
				'<div class="col-sm-4">' +
				'<table>' +
				'<tr>' +
				'<td>Kontakt osoba:</td>' +
				'<td>&nbsp;&nbsp;&nbsp;&nbsp;</td>' +
				'<td>' + data.contactPerson + '</td>' +
				'</tr>' +
				'<tr>' +
				'<td>Kontakt telefon:</td>' +
				'<td></td>' +
				'<td>' + data.contactPhone + '</td>' +
				'</tr>' +
				'<tr>' +
				'<td>E-mail:</td>' +
				'<td></td>' +
				'<td>' + data.contactEmail + '</td>' +
				'</tr>' +
				'</table>' +
				'</div>' +
				'</div>';

			$('.subjectHolder').html(string);

			$('#subjectBox').closest('.row').remove();
			$('.changeDocumentInfo').show();
			//inventoryUnallocated();
		}
	});
}

$(document).on('click', '.createHeadReversReturns', function (i) {
	var reversKey = $('#reversKey').val();
	//block = $('select[name=blockType]').val();

	if (!reversKey) {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Morate da izaberete revers!');
	}/*else if(block == 0){
			$('#message').modal();
			$('#message').find('.modal-body p').html('Morate da izaberete blok!');
		}*/else {
		$.ajax({
			url: '/inventory/createReversReturns',
			type: "post",
			data: {
				reversKey: reversKey
			},
			dataType: 'json',
			success: function (data) {

				if (data.ok == "T") {
					$("#message").modal();
					$("#message")
						.find(".modal-body p")
						.html(data.message);
					setTimeout(function () {
						window.location.href = `/inventory/returnFromRevers/${data.key}`;
					}, 1000);
				} else {
					$("#message").modal();
					$("#message")
						.find(".modal-body p")
						.html(data.message);

					setTimeout(function () {
						$("#message").modal("hide");
					}, 1000);
				}


				// $('.selectedKey').html('<a style="margin:9px 18px 0 0; background: red" class="btn btn-primary btn-sm selectedKey" href="/inventory/orderEdit/'+data.key+'">'+
				// 			'<span class="glyphicon glyphicon-list-alt"></span>&nbsp;&nbsp;'+data.subject+'</a>');
				// //$('#removableSector').remove();
				// $('#reversKey').prop('disabled',true).css('background-color','#eee');
				// $('.createHeadReversReturns').hide();
				// $("select[name=blockType]").prop('disabled',true).css('background-color','#eee');
				// $('input[name=serialMassNo]').focus();
				// $('#orderKey').html(data.key);
				// $('#message').modal();
				// $('#message').find('.modal-body p').html(data.message);
				// $('.boxHolder').show();
				// showSubjectInfo1(data.subject);
				// $.each(data.reversInfo, function(i, n){
				// 	$('#boxItems').append(
				// 		"<tr>"+
				// 			"<td>"+n.serialNo+"</td>"+
				// 			"<td><input type='text' class='form-control' name='serialNo' data-serialno="+n.serialNo+" /></td>"+
				// 			"<td>"+n.boxType+"</td>"+
				// 			"<td>"+n.created+"</td>"+
				// 			"<td>"+n.docType+"</td>"+
				// 			"<td>"+n.storing+"</td>"+
				// 			"<td><span class='closeRow'>x</span></td>"+
				// 		"</tr>"
				// 	);
				// });
				// $('input[name="serialNo"]:first').focus();
			}
		});
	}
});

$(document).on('keydown', 'input[name=serialNo]', function (e) {
	if (e.which == 13 || e.which == 9) {
		thisValue = $(this).val();
		thisSerial = $(this).data('serialno');
		if (thisValue == thisSerial) {
			$(this).prop('disabled', true).css('background-color', '#eee');
			$(this).css('border', '1px solid #ccc');
		} else {
			$(this).css('border', '1px solid red');
			$('#message').modal();
			$('#message').find('.modal-body p').html("Zadati inventorski broj se ne nalazi na nalogu");
		}
	}
});

$(document).on('click', '.closeRow', function () {
	$(this).closest('tr').remove();
});

$(document).on('click', '.RRCloseReturns', function () {
	var lenInput = $('input[name=serialNo]').length;
	var lenDisabled = $("input[name=serialNo]:disabled").length;
	var rrKey = $('#orderKey').text();
	var serial = [];



	if (lenInput == lenDisabled) {
		$('.mainFog').show();
		$('.mainFogImage').show();

		$('input[name=serialNo]').each(function (index) {
			serial.push($(this).val());
		});

		$.ajax({
			url: '/inventory/finisReturnRevers',
			type: "post",
			data: {
				rrKey: rrKey,
				serial: serial
			},
			dataType: 'json',
			success: function (data) {
				if (data.ok == 'T') {
					$('.mainFog').hide();
					$('.mainFogImage').hide();
					$('#message').modal();
					$('#message').find('.modal-body p').html("Uspesno ste kreirali nalog " + data.key);

					setTimeout(function () {
						window.location.href = '/inventory/viewRetrurns';
					}, 2000);
				} else {
					$('#message').modal();
					$('#message').find('.modal-body p').html("Dogodila se greska kontaktirajte administratora!");
				}
			}
		});
	} else {
		$('#message').modal();
		$('#message').find('.modal-body p').html("Niste razrešili sve serijske");
	}
});


//EDITOVANJE INVENTARA

$(document).on('click', '.editInventoryMain', function (e) {
	serialNo = $(this).closest('tr').find('.identInfo').text();

	$.ajax({
		url: "/inventory/identInfoEdit",
		type: "post",
		data: {
			ident: serialNo
		},
		dataType: 'json',
		success: function (data) {
			$('#editInventoryModal').modal();
			$('.modal-content').css('width', '600px');
			$('#editInventoryModal').find('.modal-header h4').html(" Editovanje <span id='serialInfo'>" + serialNo + "</span>");

			$('#editInventoryModal').find('.modal-body').html(
				"<span style='display: inline-block; margin-right: 13px;'>Tip dokumentacije:</span>" +
				"<div class='modelDivEdit' style='width: 80%; display: inline-block;'>" +
				"<select id='documentType' name='docType2' class='width100 noBorder' title='Tip dokumentacije'>"
			);

			if (data.docType != ' ') {
				$('#editInventoryModal').find('.modal-body div select[name=docType2]').append(
					"<option value=" + data.docTypeId + ">" + data.docType + "</option>"
				);
			} else {
				$('#editInventoryModal').find('.modal-body div select[name=docType2]').append(
					"<option value='0'>Izaberite</option>"
				);
			}

			$.each(data.inventoryType, function (key, value) {
				$('#editInventoryModal').find('.modal-body div select[name=docType2]').append(
					"<option value=" + value.id + ">" + value.name + "</option>"
				);
			});

			$('#editInventoryModal').find('.modal-body').append(
				"</select>" +
				"</div>" +
				"<span style='display: inline-block; margin-right: 85px;'>Opis:</span>" +
				"<div class='modelDivEdit div2' style='width: 80%; display: inline-block;'>"
			);

			if (data.description != ' ') {
				$('#editInventoryModal').find('.modal-body .div2').append(
					"<textarea class='noBorder description width100' title='Opis' type='text' >" + data.description + "</textarea>"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div2').append(
					"<textarea class='noBorder description width100' placeholder='Opis' title='Opis' type='text' ></textarea>"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 18px;'>Godina nastanka od:</span>" +
				"<div class='modelDivEdit div3' style='width: 77%; display: inline-block;'>"
			);

			if (data.created != ' ') {
				$('#editInventoryModal').find('.modal-body .div3').append(
					"<input class='noBorder created width100' value='" + data.created + "' title='Godina nastanka od' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div3').append(
					"<input title='Godina nastanka od' placeholder='Godina nastanka od' class='noBorder created width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 18px;'>Godina nastanka do:</span>" +
				"<div class='modelDivEdit div9' style='width: 77%; display: inline-block;'>"
			);

			if (data.anCreatedTo != 0) {
				$('#editInventoryModal').find('.modal-body .div9').append(
					"<input class='noBorder anCreatedTo width100' value='" + data.anCreatedTo + "' title='Godina nastanka do' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div9').append(
					"<input title='Godina nastanka do' placeholder='Godina nastanka do' class='noBorder anCreatedTo width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 44px;'>Rok čuvanja:</span>" +
				"<div class='modelDivEdit' style='width: 80%; display: inline-block;'>" +
				"<select id ='storingTime' name='storingTime' class='width100 noBorder' title='Rok čuvanja'>"
			);

			if (data.storing != ' ') {
				if (data.storing == '-1') {
					$('#editInventoryModal').find('.modal-body div select[name=storingTime]').append(
						"<option value=" + data.storing + ">Trajno</option>" +
						"<option value='1'>1 godina</option>"
					);
				} else {
					$('#editInventoryModal').find('.modal-body div select[name=storingTime]').append(
						"<option value=" + data.storing + ">" + data.storing + " god.</option>" +
						"<option value='1'>1 godina</option>"
					);
				}
			} else {
				$('#editInventoryModal').find('.modal-body div select[name=storingTime]').append(
					"<option value='1'>1 godina</option>"
				);
			}

			$('#editInventoryModal').find('.modal-body div select[name=storingTime]').append(

				"<option value='3'>3 godine</option>" +
				"<option value='5'>5 godina</option>" +
				"<option value='7'>7 godina</option>" +
				"<option value='10'>10 godina</option>" +
				"<option value='25'>25 godina</option>" +
				"<option value='-1'>Trajno</option>"
			);

			$('#editInventoryModal').find('.modal-body').append(
				"</select>" +
				"</div>" +
				"<span style='display: inline-block; margin-right: 51px;'>Napomena:</span>" +
				"<div class='modelDivEdit div4' style='width: 80%; display: inline-block;'>"
			);

			if (data.note != ' ') {
				$('#editInventoryModal').find('.modal-body .div4').append(
					"<textarea class='noBorder note width100'  title='Napomena' type='text' >" + data.note + "</textarea>"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div4').append(
					"<textarea title='Napomena' placeholder='Napomena' class='noBorder note width100' type='text' ></textarea>"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 58px;'>Datum od:</span>" +
				"<div class='modelDivEdit div5' style='width: 80%; display: inline-block;'>"
			);

			if (data.dateFrom != '01-01-1900') {
				$('#editInventoryModal').find('.modal-body .div5').append(
					"<input class='noBorder dateFrom width100' value='" + data.dateFrom.split("-").reverse().join("-") + "' title='Datum od' type='date' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div5').append(
					"<input title='Datum od' placeholder='Datum od' class='noBorder dateFrom width100' type='date' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 58px;'>Datum do:</span>" +
				"<div class='modelDivEdit div6' style='width: 80%; display: inline-block;'>"
			);

			if (data.dateTo != '01-01-1900') {
				$('#editInventoryModal').find('.modal-body .div6').append(
					"<input class='noBorder dateTo width100' value='" + data.dateTo.split("-").reverse().join("-") + "' title='Datum do' type='date' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div6').append(
					"<input title='Datum do' placeholder='Datum do' class='noBorder dateTo width100' type='date' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 58px;'>Partija od:</span>"
			);

			if (data.refIdFrom != ' ') {
				$('#editInventoryModal').find('.modal-body').append(
					"<div class='modelDivEdit div7' style='width: 80%; display: inline-block;'>" +
					"<input class='noBorder refIdFrom width100' value='" + data.refIdFrom + "' title='Partija od' type='text' />" +
					"</div>"
				);
			} else {
				$('#editInventoryModal').find('.modal-body').append(
					"<div class='modelDivEdit div7' style='width: 80%; display: inline-block;'>" +
					"<input title='Partija od' placeholder='Partija od' class='noBorder refIdFrom width100' type='text' />" +
					"</div>"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 58px;'>Partija do:</span>"
			);

			if (data.refIdTo != ' ') {
				$('#editInventoryModal').find('.modal-body').append(
					"<div class='modelDivEdit div8' style='width: 80%; display: inline-block;'>" +
					"<input class='noBorder refIdTo width100' value='" + data.refIdTo + "' title='Partija do' type='text' />" +
					"</div>"
				);
			} else {
				$('#editInventoryModal').find('.modal-body').append(
					"<div class='modelDivEdit div8' style='width: 80%; display: inline-block;'>" +
					"<input title='Partija do' placeholder='Partija do' class='noBorder refIdTo width100' type='text' />" +
					"</div>"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 44px;'>Arhivski broj:</span>" +
				"<div class='modelDivEdit div10' style='width: 80%; display: inline-block;'>"
			);

			if (data.acArhiveNo != ' ') {
				$('#editInventoryModal').find('.modal-body .div10').append(
					"<input class='noBorder acArhiveNo width100' value='" + data.acArhiveNo + "' title='Arhivski broj' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div10').append(
					"<input title='Arhivski broj' placeholder='Arhivski broj' class='noBorder acArhiveNo width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 69px;'>Sadržaj:</span>" +
				"<div class='modelDivEdit div11' style='width: 80%; display: inline-block;'>"
			);

			if (data.acContent != ' ') {
				$('#editInventoryModal').find('.modal-body .div11').append(
					"<input class='noBorder acContent width100' value='" + data.acContent + "' title='Sadržaj' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div11').append(
					"<input title='Sadržaj' placeholder='Sadržaj' class='noBorder acContent width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 44px;'>Broj partije:</span>" +
				"<div class='modelDivEdit div12' style='width: 80%; display: inline-block;'>"
			);

			if (data.acCreditNumber != ' ') {
				$('#editInventoryModal').find('.modal-body .div12').append(
					"<input class='noBorder acCreditNumber width100' value='" + data.acCreditNumber + "' title='Kreditni broj' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div12').append(
					"<input title='Broj partije' placeholder='Broj partije' class='noBorder acCreditNumber width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 44px;'>Odeljenje:</span>" +
				"<div class='modelDivEdit div13' style='width: 75%; display: inline-block;'>"
			);

			if (data.acDepartment != ' ') {
				$('#editInventoryModal').find('.modal-body .div13').append(
					"<input class='noBorder acDepartment width100' value='" + data.acDepartment + "' title='acDepartment' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div13').append(
					"<input title='Odeljenje' placeholder='Odeljenje' class='noBorder acDepartment width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 44px;'>Opis sadržaja:</span>" +
				"<div class='modelDivEdit div14' style='width: 75%; display: inline-block;'>"
			);

			if (data.acDepartment != ' ') {
				$('#editInventoryModal').find('.modal-body .div14').append(
					"<input class='noBorder acBoxDescription width100' value='" + data.acBoxDescription + "' title='acBoxDescription' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div14').append(
					"<input title='Opis sadržaja kutije' placeholder='Opis sadržaja kutije' class='noBorder acBoxDescription width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 44px;'>MB broj:</span>" +
				"<div class='modelDivEdit div15' style='width: 75%; display: inline-block;'>"
			);

			if (data.acRegistrationNo != ' ') {
				$('#editInventoryModal').find('.modal-body .div15').append(
					"<input class='noBorder acRegistrationNo width100' value='" + data.acRegistrationNo + "' title='acRegistrationNo' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div15').append(
					"<input title='MB broj' placeholder='MB broj' class='noBorder acRegistrationNo width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 44px;'>Organizaciona jedinica:</span>" +
				"<div class='modelDivEdit div16' style='width: 70%; display: inline-block;'>"
			);

			if (data.acOrganizationalUnit != ' ') {
				$('#editInventoryModal').find('.modal-body .div16').append(
					"<input class='noBorder acOrganizationalUnit width100' value='" + data.acOrganizationalUnit + "' title='acOrganizationalUnit' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div16').append(
					"<input title='Organizaciona jedinica' placeholder='Organizaciona jedinica' class='noBorder acOrganizationalUnit width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 44px;'>Naziv:</span>" +
				"<div class='modelDivEdit div17' style='width: 75%; display: inline-block;'>"
			);

			if (data.acName != ' ') {
				$('#editInventoryModal').find('.modal-body .div17').append(
					"<input class='noBorder acName width100' value='" + data.acName + "' title='acName' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div17').append(
					"<input title='Naziv' placeholder='Naziv' class='noBorder acName width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 44px;'>Opis tipa kredita:</span>" +
				"<div class='modelDivEdit div18' style='width: 65%; display: inline-block;'>"
			);

			if (data.acCreditTypeDescription != ' ') {
				$('#editInventoryModal').find('.modal-body .div18').append(
					"<input class='noBorder acCreditTypeDescription width100' value='" + data.acCreditTypeDescription + "' title='acCreditTypeDescription' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div18').append(
					"<input title='Opis tipa kredita' placeholder='Opis tipa kredita' class='noBorder acCreditTypeDescription width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"</div>" +
				"<span style='display: inline-block; margin-right: 44px;'>Tip proizvoda:</span>" +
				"<div class='modelDivEdit div19' style='width: 75%; display: inline-block;'>"
			);

			if (data.acProductType != ' ') {
				$('#editInventoryModal').find('.modal-body .div19').append(
					"<input class='noBorder acProductType width100' value='" + data.acProductType + "' title='acProductType' type='text' />"
				);
			} else {
				$('#editInventoryModal').find('.modal-body .div19').append(
					"<input title='Tip proizvoda' placeholder='Tip proizvoda' class='noBorder acProductType width100' type='text' />"
				);
			}

			$('#editInventoryModal').find('.modal-body').append(
				"<span style='display: inline-block; margin-right: 44px;'>Tip sadržaja:</span>" +
				"<div class='modelDivEdit' style='width: 80%; display: inline-block;'>" +
				"<select id='acContentType' name='contentType' class='width100 noBorder' title='Tip sadržaja'>"
			);

			if (data.acContentType != ' ') {
				$('#editInventoryModal').find('.modal-body div select[name=contentType]').append(
					"<option value=" + data.anContentType + ">" + data.acContentType + "</option>"
				);
			} else {
				$('#editInventoryModal').find('.modal-body div select[name=contentType]').append(
					"<option value='0'>Izaberite</option>"
				);
			}

			$.each(data.contentType, function (key, value) {
				$('#editInventoryModal').find('.modal-body div select[name=contentType]').append(
					"<option value=" + value.id + ">" + value.name + "</option>"
				);
			});



			/*$('select[name=docType2]').on('change', function() {

				if($(this).val() == '11') {
					//$('.div7').remove();
					//$('.div8').remove();
					$('#editInventoryModal').find('.modal-body').append(
						"<div class='modelDiv div7'>"+
							"<input title='Partija od' placeholder='Partija od' class='noBorder refIdFrom width100' type='text' />"+
						"</div>"+
						"<div class='modelDiv div8'>"+
							"<input title='Partija do' placeholder='Partija do' class='noBorder refIdTo width100' type='text' />"+
						"</div>"
					);
					//$('.div5').remove();
					//$('.div6').remove();
				} else {
					//$('.div5').remove();
					//$('.div6').remove();
					$('#editInventoryModal').find('.modal-body').append(
						"<div class='modelDiv div5'>"+
							"<input title='Datum od' placeholder='Datum od' class='noBorder dateFrom width100' type='date' />"+
						"</div>"+
						"<div class='modelDiv div6'>"+
							"<input title='Datum do' placeholder='Datum do' class='noBorder dateTo width100' type='date' />"+
						"</div>"
					);
					//$('.div7').remove();
					//$('.div8').remove();
				}
			});*/
		}
	});

});

$(document).on('click', '.confirmEditMain', function (e) {
	docType = $('#documentType').find(":selected").val();
	description = $('.description').val();
	created = $('.created').val();
	anCreatedTo = $('.anCreatedTo').val();
	storingTime = $('#storingTime').find(":selected").val();
	note = $('.note').val();
	dateFrom = $('.dateFrom').val();
	dateTo = $('.dateTo').val();
	refIdTo = $('.refIdTo').val();
	refIdFrom = $('.refIdFrom').val();
	key = $('#serialInfo').text();
	acArhiveNo = $('.acArhiveNo').val();
	acCreditNumber = $('.acCreditNumber').val();
	acDepartment = $('.acDepartment').val();
	acBoxDescription = $('.acBoxDescription').val();
	acRegistrationNo = $('.acRegistrationNo').val();
	acOrganizationalUnit = $('.acOrganizationalUnit').val();
	acName = $('.acName').val();
	acContent = $('.acContent').val();
	acCreditTypeDescription = $('.acCreditTypeDescription').val();
	acProductType = $('.acProductType').val();
	anContentType = $('#acContentType').find(":selected").val();
	$.ajax({
		url: "/inventory/updateIdentMain",
		type: "post",
		data: {
			docType: docType,
			description: description,
			created: created,
			storingTime: storingTime,
			note: note,
			dateFrom: dateFrom,
			dateTo: dateTo,
			refIdTo: refIdTo,
			refIdFrom: refIdFrom,
			key: key,
			anCreatedTo: anCreatedTo,
			acArhiveNo: acArhiveNo,
			acContent: acContent,
			anContentType: anContentType,
			acCreditNumber: acCreditNumber,
			acDepartment: acDepartment,
			acBoxDescription: acBoxDescription,
			acRegistrationNo: acRegistrationNo,
			acOrganizationalUnit: acOrganizationalUnit,
			acName: acName,
			acCreditTypeDescription: acCreditTypeDescription,
			acProductType: acProductType
		},
		dataType: 'json',
		success: function (data) {
			$('#editInventoryModal').modal('hide');

			$('#message').modal();
			$('#message').find('.modal-body p').html(data.message);
			$('#message').find('.modal-footer').html(
				"<button type='button' class='btn btn-danger removePadding' data-dismiss='modal'>Zatvori</button>"
			);
		}
	});
});

$(document).on('click', '.searchOperatorWork', function (e) {
	var dateFrom = $('input[name=dateFrom]').val();
	var dateTo = $('input[name=dateTo]').val();
	var statusPos = $('select[name=positiveSelect]').val();
	$('.mainFog').show();
	$('.mainFogImage').show();
	$.ajax({
		url: "/inventory/operatorReport",
		type: "post",
		data: {
			fromDetail: dateFrom,
			toDetail: dateTo,
			statusPos: statusPos
		},
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();

			$('.showResults').html(data);

			$('.dateFrom').html(dateFrom);
			$('.dateTo').html(dateTo);
		}
	});
});

$(document).on('click', '.removePadding', function () {
	setTimeout(function () {
		$('.body').css('padding-right', '');
	}, 500);
});

$(document).on('click', '.switchReport', function () {
	t = $(this).find('a').attr('href');
	if (t == '#details') {
		$('#sum').hide();
	} else {
		$('#sum').show();
	}
});

$(document).on('click', '.updateMapStatus', function () {
	$('.mainFog').show();
	$('.mainFogImage').show();
	$.ajax({
		url: "/map/updateMapStatus",
		type: "post",
		data: {
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();

			$('#message').modal();
			$('#message').find('.modal-body p').html(data.message);
			$('#message').find('.modal-footer').html(
				"<button type='button' class='btn btn-danger ' data-dismiss='modal'>Zatvori</button>"
			);

			setTimeout(function () {
				location.reload();
			}, 2000);
		}
	});
});

function showPriceScan() {

	subject = $('#clientBox1').val();

	$('.mainFog').show();
	$('.mainFogImage').show();

	$.ajax({
		url: "/inventory/showPricePerMonth",
		type: "post",
		data: {
			subject: subject
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			if (data) {
				sum = 0;
				string = "<table class='table table-striped'>" +
					"<tr>" +
					"<td>Mesec</td>" +
					"<td>Br. stranica</td>" +
					"<td>Cena po stranici</td>" +
					"<td>Limit mesečno</td>" +
					"<td>Preko limita</td>" +
					"<td>Cena za mesec</td>" +
					"</tr>";
				$.each(data, function (i, d) {
					sum += parseFloat(d.price);
					string +=
						"<tr>" +
						"<td>" + d.monthYear + "</td>" +
						"<td>" + d.scanNoMonth + "</td>" +
						"<td>" + d.priceScan + " " + d.value + "</td>" +
						"<td>" + d.scanLimitMonth + "</td>" +
						"<td>" + d.diferenceInScan + "</td>" +
						"<td>" + d.price + " " + d.value + "</td>" +
						"</tr>";
				});
				string +=
					"<tr>" +
					"<td></td>" +
					"<td></td>" +
					"<td></td>" +
					"<td></td>" +
					"<td></td>" +
					"<td><strong>Ukupno: " + sum + " " + data[0].value + "</strong></td>" +
					"</tr>" +
					"</table>";
			} else {
				string = '<div class="alert alert-info" style="font-size: 15px;">' +
					'<strong>Info!</strong> Nema rezultata!' +
					'</div>';
			}
			$('.showResults1').html(string);
		}
	});
}


$('#PSRsectorName').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(subjects)
	}).on('typeahead:selected', function (obj, value) {

		$('.boxHolder>.mask').hide();
		$('#PSRsectorName').prop('disabled', true).css('background-color', '#eee');
		$('.changeSubjectHolder').show();

		name = $('#PSRsectorName').val();
		showSubjectInfo1(name);
		getPartialSerialNoRevers(name);
	});

function getPartialSerialNoRevers(name) {
	$.ajax({
		url: "/inventory/getPartialSerialNoRevers",
		type: "post",
		data: {
			acSubject: name
		},
		dataType: 'json',
		success: function (data) {
			string = "";
			if (data) {
				string += "<table class='table searchTable'>" +
					"<tr>" +
					"<td>Serijski broj</td>" +
					"<td>Kutija</td>" +
					"<td>Datum</td>" +
					"<td>Referent</td>" +
					"<td>Opis</td>" +
					"<td>Obriši</td>" +
					"</tr>";
				$.each(data, function (i, d) {
					string += "<tr>" +
						"<td>" + d.acSerialNo + "</td>" +
						"<td>" + d.acBox + "</td>" +
						"<td>" + d.adDate + "</td>" +
						"<td>" + d.acUserName + "</td>" +
						"<td>" + d.acNote + "</td>" +
						"<td><span data-id=" + d.anId + " class='deletePartialSerialNoRevers closePSR'>X</span></td>" +
						"</tr>";
				});
				string += "</table>";
				string += "<button class='btn btn-primary closePartialSerialRevers' style='float: right; margin: 16px;'>Završi nalog</button>";
				$('#keyReversSerialNo').text(data[0].acKey);
			}
			$('.showResults').html(string);
		}
	});
}

$(document).on('keydown', '#serialNoPSR', function (e) {

	if (e.which == 13 || e.which == 9) {
		$.ajax({
			url: "/inventory/getSerialNoLike",
			type: "post",
			data: {
				acSubject: $('#PSRsectorName').val(),
				acSerialNo: $(this).val()
			},
			dataType: 'json',
			success: function (data) {
				if (!data) {
					$('#serialNoPSR').css('border', '1px solid red');
				} else {
					$('#serialNoPSR').css('border', '1px solid #ccc');
					$('#descriptionPSR').focus();
				}
			}
		});
	}
});

$(document).on('click', '.addReversSerialNo', function () {
	subject = $('#PSRsectorName').val();
	acSerialNo = $('#serialNoPSR').val();
	description = $('#descriptionPSR').val();
	acKey = $('#keyReversSerialNo').text();
	error = 0;

	$('#serialNoPSR').css('border', '1px solid #ccc');
	$('#descriptionPSR').css('border', '1px solid #ccc');
	$('#PSRsectorName').css('border', '1px solid #ccc');

	if (subject == '') {
		error = 1;
		$('#PSRsectorName').css('border', '1px solid red');
	}
	if (acSerialNo == '') {
		error = 1;
		$('#serialNoPSR').css('border', '1px solid red');
	}
	if (description == '') {
		error = 1;
		$('#descriptionPSR').css('border', '1px solid red');
	}

	$.ajax({
		url: "/inventory/insertSerialNoRevers",
		type: "post",
		data: {
			acSubject: subject,
			acSerialNo: acSerialNo,
			description: description,
			acKey: acKey
		},
		dataType: 'json',
		success: function (data) {
			if (data.acOk == 1) {
				getPartialSerialNoRevers(subject);
				$('#serialNoPSR').val('');
				$('#descriptionPSR').val('');
			} else {
				$('#message').modal();
				$('#message').find('.modal-body p').html('Pogrešan serijski broj!');
			}
		}
	});
});

$(document).on('click', '.deletePartialSerialNoRevers', function () {
	anId = $(this).data('id');
	thisItem = $(this);
	$.ajax({
		url: "/inventory/deleteSerialNoRevers",
		type: "post",
		data: {
			anId: anId,
		},
		dataType: 'json',
		success: function (data) {
			if (data == 1) {
				thisItem.closest('tr').remove();
			}
		}
	});
});

$(document).on('click', '.closePartialSerialRevers', function () {
	thisItem = $(this);
	$.ajax({
		url: "/inventory/updatePartialSerialNoRevers",
		type: "post",
		data: {
			acKey: $('#keyReversSerialNo').text(),
		},
		dataType: 'json',
		success: function (data) {
			if (data == 1) {
				$('#message').modal();
				$('#message').find('.modal-body p').html('Nalog uspešno završen!');
				Object.assign(document.createElement('a'), { target: '_blank', href: '/inventory/pdfSerialNo/' + $('#keyReversSerialNo').text() + '' }).click();
				resetSerialNoRevers();
			}
		}
	});
});

$(document).on('click', '.resetSerialNoRevers', function () {
	resetSerialNoRevers();
});

function resetSerialNoRevers() {
	$('.showResults').html("");
	$('#PSRsectorName').val('');
	$('#PSRsectorNameReturn').val('');
	$('#serialNoPSR').val('');
	$('#descriptionPSR').val('');
	$('#keyReversSerialNo').text('');
	$('#PSRsectorName').prop('disabled', false).css('background-color', 'transparent');
	$('#PSRsectorNameReturn').prop('disabled', false).css('background-color', 'transparent');
	$('.boxHolder>.mask').show();
	$('.subjectHolder').html('');
}

$('#PSRsectorNameReturn').typeahead({
	hint: true,
	highlight: true,
	minLength: 1,
	limit: 10
},
	{
		name: 'states',
		source: substringMatcher(subjects)
	}).on('typeahead:selected', function (obj, value) {

		$('#PSRsectorNameReturn').prop('disabled', true).css('background-color', '#eee');
		$('.changeSubjectHolder').show();

		name = $('#PSRsectorNameReturn').val();
		showSubjectInfo1(name);
		getPartialSerialNoReversForReturn(name);
	});

$(document).on('change', 'select[name=chouseStatusReturn]', function () {

	getPartialSerialNoReversForReturn($(this).val());
});

function getPartialSerialNoReversForReturn(name) {
	$.ajax({
		url: "/inventory/getPartialSerialNoReturns",
		type: "post",
		data: {
			anStatus: name
		},
		dataType: 'json',
		success: function (data) {
			string = "";
			if (data) {
				string += "<table class='table searchTable'>" +
					"<tr>" +
					"<td>Kupac</td>" +
					"<td>Nalog</td>" +
					"<td>Serijski broj</td>" +
					"<td>Kutija</td>" +
					"<td>Datum</td>" +
					"<td>Referent</td>" +
					"<td>Opis</td>" +
					"<td>Vraćeno</td>" +
					"</tr>";
				$.each(data, function (i, d) {
					string += "<tr>" +
						"<td>" + d.acSubject + "</td>" +
						"<td><a href='/inventory/pdfSerialNo/" + d.acKey + "' target='_blank'>" + d.acKey + "</td>" +
						"<td>" + d.acSerialNo + "</td>" +
						"<td>" + d.acBox + "</td>" +
						"<td>" + d.adDate + "</td>" +
						"<td>" + d.acUserName + "</td>" +
						"<td>" + d.acNote + "</td>" +
						"<td><span data-id=" + d.anId;
					if (d.anStatus == 2) {
						string += " class='closePSR' style = 'color:#337ab7' ";
					} else {
						string += " class='confirmReturnPartialSerialNoRevers closePSR' ";
					}
					string += ">";
					if (d.anStatus == 2) {
						string += " DA ";
					} else {
						string += " NE ";
					}
					string += " </span></td>" +
						"</tr>";
				});
				string += "</table>";

			}
			$('.showResults').html(string);
		}
	});
}

$(document).on('click', '.confirmReturnPartialSerialNoRevers', function () {
	anId = $(this).data('id');
	thisItem = $(this);
	$.ajax({
		url: "/inventory/confirmSerialNoRevers",
		type: "post",
		data: {
			anId: anId,
		},
		dataType: 'json',
		success: function (data) {
			if (data == 1) {
				thisItem.closest('tr').remove();
			}
		}
	});
});

$(document).on('click', '.previewOrderOut', function (e) {
	e.preventDefault();
	$('#message').modal();
	$('#message').find('.modal-title').html("Unos fajla");
	$('#message').find('.modal-body').html(
		"<form id='importOrderOutFileExcel' action='' method='post' enctype='multipart/form-data' >" +
		"<div class='container' style='margin-top: 20px;'>" +
		"<div class='row'>" +
		"<div class='col-lg-4 col-sm-6 col-12'>" +
		"<div class='input-group'>" +
		"<label class='input-group-btn'>" +
		"<span class='btn btn-primary'>" +
		"Browse&hellip; <input type='file' name='cover_image' style='display: none;'>" +
		"</span>" +
		"</label>" +
		"<input type='text' class='form-control' readonly>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</form>"
	).css('height', '').css('overflow-y', '');
	$(function () {

		// We can attach the `fileselect` event to all file inputs on the page
		$(document).on('change', ':file', function () {
			var input = $(this),
				numFiles = input.get(0).files ? input.get(0).files.length : 1,
				label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
			input.trigger('fileselect', [numFiles, label]);
		});

		// We can watch for our custom `fileselect` event like this
		$(document).ready(function () {
			$(':file').on('fileselect', function (event, numFiles, label) {

				var input = $(this).parents('.input-group').find(':text'),
					log = numFiles > 1 ? numFiles + ' files selected' : label;

				if (input.length) {
					input.val(log);
				} else {
					if (log) alert(log);
				}

			});
		});

	});
	$('#message').find('.modal-footer').html(
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>" +
		"<button type='submit' class='btn btn-success confirmFileInport''>Potvrdi</button>"
	);
});

$(document).on('click', '.confirmFileInport', function (e) {
	e.preventDefault();
	$('.mainFog').show();
	$('.mainFogImage').show();
	var myForm = document.getElementById('importOrderOutFileExcel');
	var formData = new FormData(myForm);
	$.ajax({
		url: "/inventory/orderOutExcel",
		type: "post",
		data: formData,
		processData: false,
		contentType: false,
		dataType: 'json',
		success: function (result) {
			$('#message').find('.modal-body').html('').css('height', '').css('overflow-y', '');
			$('#message').find('.modal-footer').html('');
			stringNew = "";
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			if (result) {
				$('#message').find('.modal-body').html('').css('height', '500px').css('overflow-y', 'auto');
				stringNew = "<span style='font-weight:600'>Ukupno kutija: " + result.length + "</span>";
				stringNew += "<table>"
				"<tr><td>Kutija</td></tr>";
				$.each(result, function (i, d) {
					stringNew += "<tr><td class='identName'>" + d.acIdent + "</td></tr>";
				});
				stringNew += "</table>";
				$('#message').find('.modal-body').html(stringNew);
				$('#message').find('.modal-footer').html(
					"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>" +
					"<button type='submit' class='btn btn-success finishFileInport'>Potvrdi</button>"
				);
			} else {
				stringNew = "<span>Neuspešno okačen fajl</span>";
				$('#message').find('.modal-body').html(stringNew);
				$('#message').find('.modal-footer').html(
					"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
				);
			}
		}
	});
});

$(document).on('click', '.finishFileInport', function (e) {
	$('.mainFog').show();
	$('.mainFogImage').show();
	dataTmp = [];
	$('.identName').each(function (index) {
		dataTmp.push($(this).text());
	});
	$.ajax({
		url: "/inventory/orderOutExcelConfirm",
		type: "post",
		data: {
			dataTmp: dataTmp,
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			$('#message').find('.modal-body').html('').css('height', '').css('overflow-y', '');
			$('#message').find('.modal-footer').html('');

			$('#message').find('.modal-body').html(data.acMsg);
			$('#message').find('.modal-footer').html(
				"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
			);
		}
	});
});

$(document).on('click', '.previewOrderSerialOut', function (e) {
	e.preventDefault();
	type = $(this).data('type');
	$('#message').modal();
	$('#message').find('.modal-title').html("Unos fajla");
	$('#message').find('.modal-body').html(
		"<form id='importOrderSerialOutFileExcel' action='' method='post' enctype='multipart/form-data' >" +
		"<div class='container' style='margin-top: 20px;'>" +
		"<div class='row'>" +
		"<div class='col-lg-4 col-sm-6 col-12'>" +
		"<div class='input-group'>" +
		"<label class='input-group-btn'>" +
		"<span class='btn btn-primary'>" +
		"Browse&hellip; <input type='file' name='cover_image' style='display: none;'>" +
		"</span>" +
		"</label>" +
		"<input type='text' class='form-control' readonly>" +
		"<input type='hidden' name='docType' name='docType' value=" + type + " />" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</form>"
	).css('height', '').css('overflow-y', '');
	$(function () {

		// We can attach the `fileselect` event to all file inputs on the page
		$(document).on('change', ':file', function () {
			var input = $(this),
				numFiles = input.get(0).files ? input.get(0).files.length : 1,
				label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
			input.trigger('fileselect', [numFiles, label]);
		});

		// We can watch for our custom `fileselect` event like this
		$(document).ready(function () {
			$(':file').on('fileselect', function (event, numFiles, label) {

				var input = $(this).parents('.input-group').find(':text'),
					log = numFiles > 1 ? numFiles + ' files selected' : label;

				if (input.length) {
					input.val(log);
				} else {
					if (log) alert(log);
				}

			});
		});

	});
	$('#message').find('.modal-footer').html(
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>" +
		"<button type='submit' class='btn btn-success confirmFileInportSerial' data-type=" + type + ">Potvrdi</button>"
	);
});

$(document).on('click', '.confirmFileInportSerial', function (e) {
	e.preventDefault();
	$('.mainFog').show();
	$('.mainFogImage').show();
	var myForm = document.getElementById('importOrderSerialOutFileExcel');
	var formData = new FormData(myForm);
	$.ajax({
		url: "/inventory/orderOutSerialExcel",
		type: "post",
		data: formData,
		processData: false,
		contentType: false,
		dataType: 'json',
		success: function (result) {
			$('#message').find('.modal-body').html('').css('height', '').css('overflow-y', '');
			$('#message').find('.modal-footer').html('');
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			stringNew = "";
			if (result) {
				$('#message').find('.modal-body').html('').css('height', '500px').css('overflow-y', 'auto');
				stringNew = "<span style='font-weight:600'>Ukupno serijskih: " + result.acSerial.length + "</span>";
				stringNew += "<table>"
				"<tr><td>Serijski</td></tr>";
				$.each(result.acSerial, function (i, d) {
					stringNew += "<tr><td class='identName'>" + d.acSerial + "</td></tr>";
				});
				stringNew += "</table>";
				$('#message').find('.modal-body').html(stringNew);
				$('#message').find('.modal-footer').html(
					"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>" +
					"<button type='submit' class='btn btn-success finishFileInportSerial' data-type=" + result.dataType + " data-dismiss='modal'>Potvrdi</button>"
				);
			} else {
				stringNew = "<span>Neuspešno okačen fajl</span>";
				$('#message').find('.modal-body').html(stringNew);
				$('#message').find('.modal-footer').html(
					"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
				);
			}
		}
	});
});

$(document).on('click', '.finishFileInportSerial', function (e) {
	$('.mainFog').show();
	$('.mainFogImage').show();
	dataTmp = [];
	$('.identName').each(function (index) {
		dataTmp.push($(this).text());
	});
	type = $(this).data('type');
	$.ajax({
		url: "/inventory/orderSerialOutExcelConfirm",
		type: "post",
		data: {
			dataTmp: dataTmp,
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			$('#message').find('.modal-body').html('').css('height', '').css('overflow-y', '');
			$('#message').find('.modal-footer').html('');

			$('#message').find('.modal-body').html(data.acMsg);
			$('#message').find('.modal-footer').html(
				"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
			);
		}
	});
});

$(document).on('click', '.createHeadWarehouseOutNoInventory', function (i) {
	var name = $('#sectorName').val();

	if (!name) {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Morate da izaberete subjekta!');
	} else {
		$.ajax({
			url: '/inventory/createWarehouseOut',
			type: "post",
			data: {
				block: "01P0",
				name: name
			},
			dataType: 'json',
			success: function (data) {
				$('.selectedKey').html('<a style="margin:9px 18px 0 0; background: red" class="btn btn-primary btn-sm selectedKey" href="/inventory/orderEdit/' + data.key + '">' +
					'<span class="glyphicon glyphicon-list-alt"></span>&nbsp;&nbsp;' + name + '</a>');
				$('#removableSector').remove();
				$('#message').modal();
				$('#message').find('.modal-body p').html('Uspesno kreiran nalog ' + data.key);
				setTimeout(function () {
					$('#message').modal('dispose');
				}, 1000);
				$('#key').html(data.key);
				$('.addBoxExit').prop('disabled', false);
				if (data.key.includes('01D0')) {
					$('.addBoxExit').attr('data-doctype', '01D0');
				}
				if (data.key.includes('01F0')) {
					$('.addBoxExit').attr('data-doctype', '01F0');
				}
			}
		});
	}
});

$(document).on('click', '.finishOrderNoInventry', function () {
	key = $('#key').text();
	$.ajax({
		url: "/inventory/finishOrderNoInventry",
		type: "post",
		data: {
			orderKey: key
		},
		dataType: 'json',
		async: false,
		success: function (data) {
			if (data.ok == 'T') {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
				setTimeout(function () {
					window.location.href = '/inventory/viewOrderNoInventory';
				}, 1000);
			} else {
				$('#message').modal();
				$('#message').find('.modal-body p').html(data.message);
			}
		}
	});
});

$('select[name=statusOutNoInventory]').on('change', function () {
	status = $(this).val();
	$.ajax({
		url: "/inventory/viewOrderOutNoInventory",
		type: "post",
		data: {
			status: status
		},
		success: function (data) {
			$('.tableBody').html(data);
		}
	});
});

$(document).on('click', '.showHistory', function (e) {
	boxIdent = $(this).closest('tr').find('.ident').data('ident');
	$('.mainFog').show();
	$('.mainFogImage').show();
	$.ajax({
		url: "/inventory/viewBoxHistory",
		type: "post",
		data: {
			boxIdent: boxIdent
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			string = "<table style='width:100%'>" +
				"<tr>" +
				"<td>Mapa</td>" +
				"<td>Dokument</td>" +
				"<td>Opis</td>" +
				"<td>Datum</td>" +
				"</tr>";
			$.each(data, function (index, value) {

				string += "<tr style='background:#bce8f1'>";
				if (value.acMapCode == ' ' && value.acKey.substring(2, 6) == '1010') {
					string += "<td>Predpripremno</td>";
				} else if (value.acMapCode == ' ' && value.acKey.substring(2, 6) == '3R00') {
					string += "<td></td>";
				} else if (value.acMapCode == ' ') {
					string += "<td>Pripremno</td>"
				} else {
					string += "<td>" + value.acMapCode + "</td>"
				}
				string += "<td><a href='/inventory/showReceipts/" + value.acKey + "' target='_blank'>" + value.acKey + "</a></td>" +
					"<td>" + value.acDoc + "</td>" +
					"<td>" + value.adDate + "</td>" +
					"</tr>";
				$.each(value.acSerialNo, function (index2, value2) {
					string += "<tr>" +
						"<td></td>" +
						"<td></td>" +
						"<td>" + value2.acSerialNo + "</td>" +
						"<td></td>" +
						"</tr>";
				});
			});
			string += "</table>";
			$('#message').modal();
			$('.modal-content').css('width', '170%');
			$('#message').find('.modal-body p').html(string);
			$('#message').find('.modal-title').html("Istorija za kutiju " + data[0].acIdent);
		}
	});
});

$(document).on('keydown', 'input[name=serialMassNo]', function (e) {
	checkFlag = 'F';
	if (e.which == 13) {
		thisValue = $(this).val();
		$.each($('input[name=serialNo]'), function (i, d) {
			//console.log($(this).data('serialno'));
			if ($(this).data('serialno') == thisValue) {
				$(this).val(thisValue);
				$(this).prop('disabled', true).css('background-color', '#eee');
				$(this).css('border', '1px solid #ccc');
				checkFlag = 'T';
			}
		});
		if (checkFlag == 'F') {
			$('#message').modal();
			$('#message').find('.modal-body p').html("Zadati inventorski broj se ne nalazi na nalogu");
		}
		$('input[name=serialMassNo]').val('');
	}
});

$(document).on('click', '.boxAllocationDialog', function (e) {
	string = "<span style='display: inline-block; margin-right: 20px;'>Lokacija:</span>" +
		"<div class='modelDivEdit div3' style='width: 80%; display: inline-block;'>" +
		"<input class='noBorder created width100' type='text' name='acMapKeyToMove' />" +
		"</div>" +
		"<span style='display: inline-block; margin-right: 35px;'>Kutija:</span>" +
		"<div class='modelDivEdit div3' style='width: 80%; display: inline-block;'>" +
		"<textarea class='noBorder description width100' name='acIdentToMove' disabled type='text' ></textarea>" +
		"</div>";

	$('#message').modal();
	$('.modal-content').css('width', '170%')
	$('#message').find('.modal-body p').html(string);
	$('#message').find('.modal-title').html("Premeštanje kutija");
	$('#message').find('.modal-footer').html(
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>" +
		"<button type='submit' class='btn btn-success confirmBoxAllocation' data-dismiss='modal'>Potvrdi</button>");
	$("input[name=acMapKeyToMove]").focus();
});

$(document).on('keydown', 'input[name=acMapKeyToMove]', function (e) {
	if ((e.which == 13 || e.which == 9) && $('input[name=acMapKeyToMove]').val() != '') {
		$('input[name=acMapKeyToMove]').prop('disabled', true);
		$('textarea[name=acIdentToMove]').prop('disabled', false);
		$('textarea[name=acIdentToMove]').focus();
	}
});

$(document).on('click', '.confirmBoxAllocation', function (e) {
	$('.mainFog').show();
	$('.mainFogImage').show();
	acIdents = $('textarea[name=acIdentToMove]').val();
	acLocation = $('input[name=acMapKeyToMove]').val();
	acIdent = "";
	tt = acIdents.split("\n").map(function (item) {
		return item.trim();
	});

	$.each(tt, function (i, d2) {
		if (d2 != '') {
			acIdent += d2.trim() + ",";
		}
	});
	tmpIdn = acIdent.substring(0, acIdent.length - 1);
	tt2 = tmpIdn.split(",").map(function (item) {
		return item.trim();
	});

	$.ajax({
		url: "/inventory/boxChangeLocation",
		type: "post",
		data: {
			acIdent: acIdent,
			acLocation: acLocation,
			anCnt: tt2.length
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			$('#message').modal();
			$('.modal-content').css('width', '170%')
			$('#message').find('.modal-body p').html(data.message);
			$('#message').find('.modal-title').html("Info");
			$('#message').find('.modal-footer').html("<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>");
		}
	});
});

$(document).on('click', '.massImortSerial', function (e) {
	$('#confirm').modal();
	$('#confirm').find('.modal-title').html("Unos fajla");
	$('#confirm').find('.modal-body').html(
		"<form id='importFileExcelSerial' action='/inventory/importFilesSerial' method='post' enctype='multipart/form-data' >" +
		"<div class='showBlockToStor row'>" +
		"<div class='col-xs-6 form-group'>" +
		"<label for='blockType' style='display: block;'>Izbor bloka</label>" +
		"<select name='blockType' class='form-control'>" +
		"<option value='0'>Izaberite</option>" +
		"<option value='1'>Blok A</option>" +
		"<option value='2'>Blok B</option>" +
		"<option value='3'>Blok C</option>" +
		"<option value='4'>Blok D</option>" +
		"</select>" +
		"</div>" +
		"</div>" +
		"<div class='container' style='margin-top: 20px;'>" +
		"<div class='row'>" +
		"<div class='col-lg-4 col-sm-6 col-12'>" +
		"<div class='input-group'>" +
		"<label class='input-group-btn'>" +
		"<span class='btn btn-primary'>" +
		"Browse&hellip; <input type='file' name='cover_image' style='display: none;'>" +
		"</span>" +
		"</label>" +
		"<input type='text' class='form-control' readonly>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</form>"
	);
	$(function () {

		// We can attach the `fileselect` event to all file inputs on the page
		$(document).on('change', ':file', function () {
			var input = $(this),
				numFiles = input.get(0).files ? input.get(0).files.length : 1,
				label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
			input.trigger('fileselect', [numFiles, label]);
		});

		// We can watch for our custom `fileselect` event like this
		$(document).ready(function () {
			$(':file').on('fileselect', function (event, numFiles, label) {

				var input = $(this).parents('.input-group').find(':text'),
					log = numFiles > 1 ? numFiles + ' files selected' : label;

				if (input.length) {
					input.val(log);
				} else {
					if (log) alert(log);
				}

			});
		});

	});
	$('#confirm').find('.modal-footer').html(
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>" +
		"<button type='submit' class='btn btn-success confirmFileInport' data-dismiss='modal'>Potvrdi</button>"
	);
	$('.confirmFileInport').on('click', function (e) {
		e.preventDefault();
		$('#importFileExcelSerial').submit();
	});
});


$(document).on('click', '.massImortSerialSber', function (e) {
	$('#confirm').modal();
	$('#confirm').find('.modal-title').html("Unos fajla");
	$('#confirm').find('.modal-body').html(
		"<form id='importFileExcelSerial' action='/inventory/massImortSerialSber' method='post' enctype='multipart/form-data' >" +
		"<div class='container' style='margin-top: 20px;'>" +
		"<div class='row'>" +
		"<div class='col-lg-4 col-sm-6 col-12'>" +
		"<div class='input-group'>" +
		"<label class='input-group-btn'>" +
		"<span class='btn btn-primary'>" +
		"Browse&hellip; <input type='file' name='cover_image' style='display: none;'>" +
		"</span>" +
		"</label>" +
		"<input type='text' class='form-control' readonly>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</form>"
	);
	$(function () {

		// We can attach the `fileselect` event to all file inputs on the page
		$(document).on('change', ':file', function () {
			var input = $(this),
				numFiles = input.get(0).files ? input.get(0).files.length : 1,
				label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
			input.trigger('fileselect', [numFiles, label]);
		});

		// We can watch for our custom `fileselect` event like this
		$(document).ready(function () {
			$(':file').on('fileselect', function (event, numFiles, label) {

				var input = $(this).parents('.input-group').find(':text'),
					log = numFiles > 1 ? numFiles + ' files selected' : label;

				if (input.length) {
					input.val(log);
				} else {
					if (log) alert(log);
				}

			});
		});

	});
	$('#confirm').find('.modal-footer').html(
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>" +
		"<button type='submit' class='btn btn-success confirmFileInport' data-dismiss='modal'>Potvrdi</button>"
	);
	$('.confirmFileInport').on('click', function (e) {
		e.preventDefault();
		$('#importFileExcelSerial').submit();
	});
});

$(document).on('click', '.hiddenTest', function () {
	//alert(1);
	$('.contentHolderList').html(123);
});
$(document).on('click', '.questionAnsver', function () {
	$('.mainFog').show();
	$('.mainFogImage').show();
	var thisItem = $(this);
	anId = $(this).data('id');
	value = $(this).val();
	//console.log(value);
	dockey = $('.uploadFileSberb').attr('data-dockey');
	$.ajax({
		url: "/inventory/updateQuestionSber",
		type: "post",
		data: {
			anId: anId,
			value: value,
			anDocumentKey: dockey
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();

			if (data.isok == 1) {
				$('.statusKlasa').empty();
				thisItem.parent().parent().find('.answerHolder').html('<span class="glyphicon glyphicon-ok" style="color:green; float:right; padding-top: 5px;" title="Ispravno"></span>');
				$.each(data.newArrayQuestions, function (k, v) {
					$.each(v, function (ke, va) {
						$.each(va.questionArray, function (key, val) {
							if (va.isMandatory == 1) {
								if (val.isForCheck == 1) {
									var spanHolder = '<span style="float: right; margin-right: 25px; margin-left: 25px; background-color:#FF6347; border:2px solid #FF6347;">Obavezno</span>';
								} else {
									var spanHolder = '<span style="float: right; margin-right: 25px; margin-left: 25px; background-color:lightgreen; border:2px solid lightgreen; ">Neobavezno</span>';
								}
							}
							$('.klasa' + val.anId).html(spanHolder);
						});
					});
				});
			} else {
				$('.statusKlasa').empty();
				thisItem.parent().parent().find('.answerHolder').html('<span class="glyphicon glyphicon-remove" style="color:red; float:right; padding-top: 5px;"  title="Neispravno"></span>');
				$.each(data.newArrayQuestions, function (k, v) {
					$.each(v, function (ke, va) {
						$.each(va.questionArray, function (key, val) {
							if (va.isMandatory == 1) {

								if (val.isForCheck == 1) {
									var spanHolder = '<span style="float: right; margin-right: 25px; margin-left: 25px; background-color:#FF6347; border:2px solid #FF6347;">Obavezno</span>';
								} else {
									var spanHolder = '<span style="float: right; margin-right: 25px; margin-left: 25px; background-color:lightgreen; border:2px solid lightgreen; ">Neobavezno</span>';
								}
							}
							$('.klasa' + val.anId).html(spanHolder);
						});
					});
				});
			}

			// console.log(data);
			// location.reload();
		}
	});
});

// $(document).on('click', '.questionAnsver3', function(){

// 	nameGroup = $(this).closest('.contentGlobalCheckList').find('.questionTitle').attr('data-name');
// 	$('.mainFog').show();
// 	$('.mainFogImage').show();
// 	var thisItem = $(this);
// 	anId = $(this).data('id');
// 	value = $(this).val();
// 	 var tabId = $(".tabClickHandler.active").attr("data-id");
// 	//console.log(value);
// 	var dockey = $(".tabRulesHolder").attr("data-dockey");


// 	$.ajax({
// 		url:"/inventory/updateQuestionSber2",
// 		type: "post",
// 		data: {
// 			anId : anId,
// 			value : value,
// 			anDocumentKey: dockey,
// 			tabId:tabId
// 		},
// 		// dataType: 'json',
// 		success:function(data){
// 			$('.mainFog').hide();
// 			$('.mainFogImage').hide();

// 			//$('#sberViewContent').html(data);
// 			if(data.isok == 1){


// 				$('.statusKlasa').empty();
// 				thisItem.parent().parent().find('.answerHolder').html('<span class="glyphicon glyphicon-ok" style="color:green; float:right; padding-top: 5px;" title="Ispravno"></span>');
// 				var strCheckList = "";
// 				console.log(data.newArrayQuestions,'data.newArrayQuestions')
// 				$.each(data.newArrayQuestions, function(k, v){
// 					$.each(v, function(ke, va){
// 						console.log(nameGroup, 'nameGroup');
// 						console.log(va.acRuleDescription, 'va.acRuleDescription');

// 						if(va.acRuleDescription == nameGroup) {

// 							$.each(va.questionArray, function(key1, item3) {
// 								// console.log(item3, 'item3')


// 								var questionDescr = '';
// 								if(item3.questionDescr != '') {
// 									questionDescr = '(<span style="color:#666;"> '+item3.questionDescr+' </span>)';
// 								}

// 								if(item3.isOk == 1) {
// 									spanAnswerHolder = '<span class="answerHolder"><span class="glyphicon glyphicon-ok" style="color:green; float:right; padding-top: 5px;" title="Ispravno"></span></span>';
// 								} else {
// 									spanAnswerHolder = '<span class="answerHolder"><span class="glyphicon glyphicon-remove" style="color:red; float:right; padding-top: 5px;"  title="Neispravno"></span></span>';
// 								}

// 								checkedNew0 = '';
// 								checkedNew1 = '';
// 								if(item3.isNewChecked == 0) {
// 									checkedNew0 = 'checked';
// 								} else if(item3.isNewChecked == 1) {
// 									checkedNew1 = 'checked';
// 								}
// 								mandatorySpan = '';
// 								if(va.isMandatory == 1) {
// 									console.log(item3.isForCheck, 'item3.isForCheck')
// 									if (item3.isForCheck == 1) {
// 										mandatorySpan = '<span style="float: right; margin-right: 25px; margin-left: 25px; background-color:#FF6347; border:2px solid #FF6347;">Obavezno</span>';
// 									} else if(item3.isForCheck == 0) {
// 										mandatorySpan = '<span style="float: right; margin-right: 25px; margin-left: 25px; background-color:lightgreen; border:2px solid lightgreen; ">Neobavezno</span>';
// 									}
// 								}

// 								groupAction = '';
// 								acValueAction = '';
// 								if(data.isForGroupAction1 == 0) {
// 									if(item3.anActionKey == 1) {
// 										groupAction = '<a class="btn btn-info  btn-sm pull-right uploadFileSberb2" data-id="'+item3.anId+'" data-ruleid="'+item3.anLinkRuleRuleItemKey+'" data-dockey="'+dockey+'" style="margin-right: 10px; padding: 1px 4px;"><span class="glyphicon glyphicon-paperclip " aria-hidden="true"></span> Priloži fajl</a>';
// 									}
// 									if(item3.acValue.trim() != '') {
// 										acValueAction = '<a href="/'+item3.acValue+'" style="float: right; margin-right: 10px; padding-top: 5px;" target="_blank">'+item3.acActionDescriprion+'</a>';
// 									}
// 								}

// 								strCheckList += '<div  class="rowHolder orderKeyView left5 rowHolderContent'+item3.anId+'" data-id="'+item3.anId+'">'+
// 													'<label>'+
// 														'<span class="glyphicon glyphicon-triangle-right"></span>'+
// 														item3.question+questionDescr+
// 													'</label>'+
// 													spanAnswerHolder+
// 													'<span style="padding-right:10px; float:right;"><input type="radio" name="'+item3.anId+'" class="questionAnsver3" data-id="'+item3.anId+'" value="0" '+checkedNew0+' > NE</span>'+
// 													'<span style="padding-right:10px; float:right;"><input type="radio" name="'+item3.anId+'" class="questionAnsver3" data-id="'+item3.anId+'" value="1" '+checkedNew1+' > DA</span>'+
// 													'<div class="statusKlasa klasa'+item3.anId+'" style="display: inline;">'+mandatorySpan+'</div>'+
// 													groupAction+
// 													'<span class="scanDocumentHolder">'+
// 														acValueAction+
// 													'</span>'+
// 												'</div>';
// 							});

// 						}

// 						$.each(va.questionArray, function(key, val){
// 							if(va.isMandatory == 1){
// 								if(val.isForCheck == 1){
// 									var spanHolder = '<span style="float: right; margin-right: 25px; margin-left: 25px; background-color:#FF6347; border:2px solid #FF6347;">Obavezno</span>';
// 								} else {
// 									var spanHolder = '<span style="float: right; margin-right: 25px; margin-left: 25px; background-color:lightgreen; border:2px solid lightgreen; ">Neobavezno</span>';
// 								}
// 							}
// 							$('.klasa'+val.anId).html(spanHolder);
// 						});
// 					});
// 				});
// 				$(thisItem).closest('.contentGlobalCheckList').find('.marginLeft50').html(strCheckList);
// 			}else{
// 				$('.statusKlasa').empty();
// 				thisItem.parent().parent().find('.answerHolder').html('<span class="glyphicon glyphicon-remove" style="color:red; float:right; padding-top: 5px;"  title="Neispravno"></span>');
// 				$.each(data.newArrayQuestions, function(k, v){
// 					$.each(v, function(ke, va){
// 						$.each(va.questionArray, function(key, val){
// 							if(va.isMandatory == 1){

// 								if(val.isForCheck == 1){
// 									var spanHolder = '<span style="float: right; margin-right: 25px; margin-left: 25px; background-color:#FF6347; border:2px solid #FF6347;">Obavezno</span>';
// 								} else {
// 									var spanHolder = '<span style="float: right; margin-right: 25px; margin-left: 25px; background-color:lightgreen; border:2px solid lightgreen; ">Neobavezno</span>';
// 								}
// 							}
// 							$('.klasa'+val.anId).html(spanHolder);
// 						});
// 					});
// 				});
// 			}
// 		}
// 	});
// });
$(document).on("click", ".questionAnsver3", function () {
	nameGroup = $(this)
		.closest(".contentGlobalCheckList")
		.find(".questionTitle")
		.attr("data-name");
	$(".mainFog").show();
	$(".mainFogImage").show();
	var thisItem = $(this);
	anId = $(this).data("id");
	value = $(this).val();
	var tabId = $(".tabClickHandler.active").attr("data-id");
	//console.log(value);
	var dockey = $(".tabRulesHolder").attr("data-dockey");

	$.ajax({
		url: "/inventory/updateQuestionSber2",
		type: "post",
		data: {
			anId: anId,
			value: value,
			anDocumentKey: dockey,
			tabId: tabId,
		},
		// dataType: 'json',
		success: function (data) {
			$(".mainFog").hide();
			$(".mainFogImage").hide();

			$('#sberViewContent').html(data);

		},
	});
});

$(document).on("click", ".questionAnsverV2", function () {
	nameGroup = $(this)
		.closest(".contentGlobalCheckList")
		.find(".questionTitle")
		.attr("data-name");
	// $(".mainFog").show();
	// $(".mainFogImage").show();
	var thisItem = $(this);
	anId = $(this).data("id");
	value = $(this).val();

	var ruleCode = $(this).closest('.contentGlobalCheckList').attr('rule-code');

	var tabId = $(".tabClickHandler.active").attr("data-id");
	//console.log(value);
	var dockey = $(".tabRulesHolder").attr("data-dockey");

	$.ajax({
		url: "/inventory/updateQuestionSberV2",
		type: "post",
		data: {
			anId: anId,
			value: value,
			anDocumentKey: dockey,
			tabId: tabId,
			ruleCode: ruleCode,
		},
		dataType: 'json',
		success: function (data) {
			$(".mainFog").hide();
			$(".mainFogImage").hide();

			$.each(data, function(i,d) {
				if(d.isok == 1) {
					answerTrueFalse = '<span class="glyphicon glyphicon-ok" style="color:green; padding-top: 5px;" title="Ispravno"></span>';
				} else {
					answerTrueFalse = '<span class="glyphicon glyphicon-remove" style="color:red; padding-top: 5px;"  title="Neispravno"></span>';
				}

				$('.rowHolderContent'+d.anDocumentVerificationKey+'').find('.answerHolder').html(answerTrueFalse)
			});
		},
	});
});


$(document).on("click", ".cloneBtnDocument", function (e) {
	var anDocumentKey = $(this).attr("data-key");
	var anRuleKey = $(this).attr("data-rule");
	var tabId = $(".tabClickHandler.active").attr("data-id");

	$.ajax({
		url: "/inventory/cloneDocument",
		type: "post",
		data: {
			anDocumentKey: anDocumentKey,
			anRuleKey: anRuleKey,
			tabId: tabId,
		},
		success: function (data) {
			console.log(data);

			$("#sberViewContent").html(data);
		},
	});
});
$(document).on("click", ".cloneBtnDocumentDlt", function (e) {
	var anDocumentKey = $(this).attr("data-key");
	var anRuleKey = $(this).attr("data-rule");
	var acRuleExtended = $(this).attr("data-ruleext");
	var tabId = $(".tabClickHandler.active").attr("data-id");

	$.ajax({
		url: "/inventory/dltDocument",
		type: "post",
		data: {
			anDocumentKey: anDocumentKey,
			anRuleKey: anRuleKey,
			acRuleExtended: acRuleExtended,
			tabId: tabId,
		},
		success: function (data) {
			$("#sberViewContent").html(data);

			//
		},
	});
});

$(document).on('click', '.finishQUestion', function () {
	$('.mainFog').show();
	$('.mainFogImage').show();
	var thisItem = $(this);
	acKey = $(this).data('key');
	$.ajax({
		url: "/inventory/finishQUestion",
		type: "post",
		data: {
			acKey: acKey
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			$('#confirm').modal();
			$('#confirm').find('.modal-title').html("Završavanje dokumenta");
			$('#confirm').find('.modal-body p').html(data.message);
			$('#confirm').find('.modal-footer').html("<button type='submit' class='btn btn-success' data-dismiss='modal'>Zatvori</button>");
			if (data.ok == 1) {
				setTimeout(function () {
					window.location.href = '/inventory/viewSberbankList';
				}, 1000);
			}else {
				setTimeout(function () {
					location.reload();
				}, 2000);
			}
		}
	});
});

$(document).on('click', '.tabClickHandler', function (e) {
	id = $(this).attr('data-for-group');
	if (id == 1) {
		$('.btn-grouping-content').show();
	} else {
		$('.btn-grouping-content').hide();

	}
});

$(document).on('click', '.uploadFileSberbV2', function (e) {
	anId = $(this).data('id');
	anRuleid = $(this).data('ruleid');
	dockey = $(this).data('dockey');
	tabId = 1;
	$.each($('.quTabs'), function (i, d) {
		if ($(this).hasClass('active')) {
			console.log($(this));
			tabId = $(this).attr('data-id');
		}
	});

	creditNumber = $('.creditNumberNb').text();
	$('#confirm').modal();
	$('#confirm').find('.modal-title').html("Unos fajla");
	$('#confirm').find('.modal-body').html(
		"<form id='uploadFileSberbV2' action='/inventory/uploadFileSberbV2/" + anId + "/" + anRuleid + "/" + dockey + "/" + tabId + "' method='post' enctype='multipart/form-data' >" +
		"<div class='container' style='margin-top: 20px;'>" +
		"<div class='row'>" +
		"<div class='col-lg-4 col-sm-6 col-12'>" +
		"<div class='input-group'>" +
		"<label class='input-group-btn'>" +
		"<span class='btn btn-primary'>" +
		"Browse&hellip; <input type='file' name='cover_image' style='display: none;'>" +
		"</span>" +
		"</label>" +
		"<input type='text' class='form-control' readonly>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</form>"
	);
	$(function () {

		// We can attach the `fileselect` event to all file inputs on the page
		$(document).on('change', ':file', function () {
			var input = $(this),
				numFiles = input.get(0).files ? input.get(0).files.length : 1,
				label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
			input.trigger('fileselect', [numFiles, label]);
		});

		// We can watch for our custom `fileselect` event like this
		$(document).ready(function () {
			$(':file').on('fileselect', function (event, numFiles, label) {

				var input = $(this).parents('.input-group').find(':text'),
					log = numFiles > 1 ? numFiles + ' files selected' : label;

				if (input.length) {
					input.val(log);
				} else {
					if (log) alert(log);
				}

			});
		});

	});
	$('#confirm').find('.modal-footer').html(
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>" +
		"<button type='submit' class='btn btn-success confirmFileInportSberbV2' data-dismiss='modal'>Potvrdi</button>"
	);
	$('.confirmFileInportSberbV2').on('click', function (e) {
		e.preventDefault();
		$('#uploadFileSberbV2').submit();
	});
});


$(document).on('click', '.uploadFileSberb', function (e) {
	anId = $(this).data('id');
	anRuleid = $(this).data('ruleid');
	dockey = $(this).data('dockey');
	tabId = 1;
	$.each($('.quTabs'), function (i, d) {
		if ($(this).hasClass('active')) {
			console.log($(this));
			tabId = $(this).attr('data-id');
		}
	});

	creditNumber = $('.creditNumberNb').text();
	$('#confirm').modal();
	$('#confirm').find('.modal-title').html("Unos fajla");
	$('#confirm').find('.modal-body').html(
		"<form id='uploadFileSberb' action='/inventory/uploadFileSberb/" + anId + "/" + anRuleid + "/" + dockey + "/" + tabId + "' method='post' enctype='multipart/form-data' >" +
		"<div class='container' style='margin-top: 20px;'>" +
		"<div class='row'>" +
		"<div class='col-lg-4 col-sm-6 col-12'>" +
		"<div class='input-group'>" +
		"<label class='input-group-btn'>" +
		"<span class='btn btn-primary'>" +
		"Browse&hellip; <input type='file' name='cover_image' style='display: none;'>" +
		"</span>" +
		"</label>" +
		"<input type='text' class='form-control' readonly>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</form>"
	);
	$(function () {

		// We can attach the `fileselect` event to all file inputs on the page
		$(document).on('change', ':file', function () {
			var input = $(this),
				numFiles = input.get(0).files ? input.get(0).files.length : 1,
				label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
			input.trigger('fileselect', [numFiles, label]);
		});

		// We can watch for our custom `fileselect` event like this
		$(document).ready(function () {
			$(':file').on('fileselect', function (event, numFiles, label) {

				var input = $(this).parents('.input-group').find(':text'),
					log = numFiles > 1 ? numFiles + ' files selected' : label;

				if (input.length) {
					input.val(log);
				} else {
					if (log) alert(log);
				}

			});
		});

	});
	$('#confirm').find('.modal-footer').html(
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>" +
		"<button type='submit' class='btn btn-success confirmFileInportSberb' data-dismiss='modal'>Potvrdi</button>"
	);
	$('.confirmFileInportSberb').on('click', function (e) {
		e.preventDefault();
		$('#uploadFileSberb').submit();
	});
});

$(document).on('click', '.uploadFileSberb2', function (e) {
	anId = $(this).data('id');
	anRuleid = $(this).data('ruleid');
	dockey = $(this).data('dockey');
	tabId = 1;
	nameCheckList = $(this).closest('.contentGlobalCheckList').find('.questionTitle').attr('data-name');
	$.each($('.quTabs'), function (i, d) {
		if ($(this).hasClass('active')) {
			console.log($(this));
			tabId = $(this).attr('data-id');
		}
	});

	creditNumber = $('.creditNumberNb').text();
	$('#myModal').modal('show');
	$('#myModal').find('.modal-title').html("Unos fajla");
	$('#myModal').find('.modal-body').html(
		"<form id='createSpecialForm' enctype='multipart/form-data'>" +
		"<div class='container' style='margin-top: 20px;'>" +
		"<div class='row'>" +
		"<div class='col-lg-4 col-sm-6 col-12'>" +
		"<div class='input-group'>" +
		"<label class='input-group-btn'>" +
		"<span class='btn btn-primary'>" +
		"Browse&hellip; <input type='file' class='upload-file-special' name='cover_image' style='display: none;'>" +
		"</span>" +
		"</label>" +
		"<input type='text' class='form-control' readonly>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</form>"
	);
	$(function () {

		// We can attach the `fileselect` event to all file inputs on the page
		$(document).on('change', ':file', function () {
			var input = $(this),
				numFiles = input.get(0).files ? input.get(0).files.length : 1,
				label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
			input.trigger('fileselect', [numFiles, label]);
		});

		// We can watch for our custom `fileselect` event like this
		$(document).ready(function () {
			$(':file').on('fileselect', function (event, numFiles, label) {

				var input = $(this).parents('.input-group').find(':text'),
					log = numFiles > 1 ? numFiles + ' files selected' : label;

				if (input.length) {
					input.val(log);
				} else {
					if (log) alert(log);
				}

			});
		});

	});
	$('#myModal').find('.modal-footer').html(
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>" +
		"<button type='submit' class='btn btn-success confirmFileInportSberb2' data-id='" + anId + "' data-namechecklist='" + nameCheckList + "' data-rule='" + anRuleid + "' data-dockey='" + dockey + "' data-tab='" + tabId + "'>Potvrdi</button>"
	);
	// $('.confirmFileInportSberb').on('click',function(e){
	// 	e.preventDefault();
	// 	$('#uploadFileSberb').submit();
	// });
});

$(document).on('click', '.confirmFileInportSberb2', function () {
	var myForm = document.getElementById('createSpecialForm');
	var formData = new FormData(myForm);

	anRuleid = $(this).attr('data-rule');
	anId = $(this).attr('data-id');
	dockey = $(this).attr('data-dockey');
	tabId = $(this).attr('data-tab');
	nameCheckList = $(this).attr('data-namechecklist');

	fileValue = $('.upload-file-special').val();

	formData.append('anRuleid', anRuleid);
	formData.append('id', anId);
	formData.append('tabId', tabId);
	formData.append('dockey', dockey);

	if (fileValue != '') {
		$.ajax({
			url: "/inventory/uploadFileSberb2",
			type: "post",
			data: formData,
			processData: false,
			contentType: false,
			dataType: 'json',
			success: function (result) {
				console.log(result, 'result')
				$('#myModal').find('.modal-title').html("Unos fajla");
				$('#myModal').find('.modal-body').html(result.msg);
				$('#myModal').find('.confirmFileInportSberb2').remove();

				if (result.msg != 'Dogodila se greška probajte ponovo.') {
					$('.rowHolderContent' + anId).find('.scanDocumentHolder').html('<a href="/' + result.fileLink + '" style="float: right; margin-right: 10px; padding-top: 5px;" target="_blank">Skenirani dokument</a>');
					$('.rowHolderContent' + anId).find('.scanDocumentButtonsHolder').html('<a class="btn btn-warning  btn-sm pull-right removeFileSberb2" data-id="' + anId + '" data-ruleid="' + anRuleid + '" data-dockey="' + dockey + '" style="margin-right: 10px; padding: 1px 4px;"><span class="glyphicon glyphicon-paperclip " aria-hidden="true"></span> Ukloni fajl</a>');
					$(".rowHolderContent" + anId).find(".answerHolder").html('<span class="glyphicon glyphicon-ok" style="color:green; float:right; padding-top: 5px;" title="Ispravno"></span>');
					$(".rowHolderContent" + anId).find(".questionAnsver3[value='1']").attr("checked", "true");
					$(".rowHolderContent" + anId).find(".questionAnsver3[value='0']").removeAttr("checked");
				}

				setTimeout(function () {
					$('#myModal').modal('hide');
				}, 2000);

				// $(thisItem).closest('.col-sm-12').append('<div class="attachLink" style="float: right; margin-right: 10px; padding-top: 7px;"><a href="/'+result.fileLink+'" target="_blank">Skenirani dokument</a></div>');
			}
		});
	}

});

$(document).on('keydown', '.questionSearch', function (e) {
	if (e.which == 13) {
		val = $(this).val();
		$.each($('.questionTitle'), function (i, str) {
			anId = $(this).data('id');
			question = $(this).data('name');
			visit = $(this).attr('data-visit');
			block = $(this).data('block');
			thisItem = $(this);
			thisItem2 = $(this);
			if (question.indexOf(val) > 0 && visit == 0) {
				thisItem2.attr('data-visit', 1);
				$.each($('.quTabs'), function (i, str) {
					$(this).removeClass('active');
				});
				$.each($('#questionName'), function (i, str) {
					$(this).removeClass('highlight');
				});
				$('.tt' + block).addClass('active');
				$.each($('.quHolder'), function (i, str) {
					$(this).removeClass('active in');
				});
				$.each($('.highlight'), function (i, str) {
					$(this).contents().unwrap();
				});

				$('#' + block).addClass('active in');
				var top = document.getElementById(anId).offsetTop;
				var inputText = thisItem.context;
				var innerHTML = inputText.innerHTML;

				var index = innerHTML.indexOf(val);
				if (index >= 0) {
					innerHTML = innerHTML.substring(0, index) + "<span class='highlight' style='background-color: yellow;'>" + innerHTML.substring(index, index + val.length) + "</span>" + innerHTML.substring(index + val.length);
					inputText.innerHTML = innerHTML;
				}
				window.scrollTo(0, top);
				return false;
			}
		});
	} else {
		$.each($('.questionTitle'), function (i, str) {
			$(this).attr('data-visit', 0);
		});
	}
});



$(document).on('click', '.sendSberDocumentsPhis', function () {
	count = 0;
	acPartyCred = "";
	$.each($('.checkToSendSberPhis:checked'), function (i, d) {
		count = count + 1;
		acPartyCred += $(this).val() + ";";
	});

	if (acPartyCred != '') {
		$('#confirm').modal();
		$('.modal-content').css('width', '500px');
		$('#confirm').find('.modal-title').html("Snimanje dokumentacije");
		$('#confirm').find('.modal-body').html('');
		/*$('#confirm').find('.modal-body').html(
			"<div class='container' >"+
				"<div class='row'>"+
					"<div class='col-lg-7 col-sm-7 col-12'>"+
						"<label style='float:left'>Emailovi (Da bi poslali na više adresa odvoite sa tačka zarez)</label><br/>"+
						"<span>"+
							"<input type='text' name='emailSendSber' class='form-control emailSendSber'>"+
						"</span>"+
					"</div>"+
				"</div>"+
			"</div>"
		);*/
		$('#confirm').find('.modal-footer').html(
			'<button type="button" class="btn btn-success sendSberDocConfirm" tabindex="-1" data-party="' + acPartyCred + '">Snimi</button>' +
			'<button type="button" class="btn btn-danger " data-dismiss="modal">Ne</button>'
		);
	} else {
		$('#confirm').modal();
		$('#confirm').find('.modal-title').html("Snimanje dokumentacije");
		$('#confirm').find('.modal-body').html("Morate izabrati partije kredita");
		$('#confirm').find('.modal-footer').html('<button type="button" class="btn btn-danger" data-dismiss="modal">Zatvori</button>');
	}
});

$(document).on('click', '.sendSberDocConfirm', function () {
	acPartyCred = $(this).attr('data-party');
	//emailSendSber = $('input[name=emailSendSber]').val();
	emailSendSber = '';
	$('.mainFog').show();
	$('.mainFogImage').show();
	$.ajax({
		url: "/inventory/sendSberDoc",
		type: "post",
		data: {
			acPartyCred: acPartyCred,
			emailSendSber: emailSendSber
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			$('#confirm').modal();
			$('#confirm').find('.modal-title').html("Snimanje dokumentacije");
			$('#confirm').find('.modal-body').html(data.message);
			if (data.ok == 1) {
				/*$.each(data, function(i,d){
					if(i != '' && i != 'ok' && i != 'message' && i != 'anBatchBarcode'){
						var link = document.createElement("a");
						// If you don't know the name or want to use
						// the webserver default set name = ''
						link.setAttribute('download', i);
						link.href = '/'+d;
						document.body.appendChild(link);
						link.click();
						link.remove();
					}
				});*/
				setTimeout(function () {
					window.location.href = '/inventory/viewSberbankList';
				}, 1000);
			}
		}
	});
});

// preimenovano u V2 jer su postojale dve funkcije sa istim imenom
// Ivan Z. 16.03.2022.
function getFiltredListV2() {
	var myForm = document.getElementById('filterForm');
	var formData = new FormData(myForm);

	var isCompleted = $("ul#tabsBar li.active a").data('type');
	var isDocumentSent = $('input.isDocumentSent').is(':checked') ? "1" : "0";

	formData.append('isCompleted', isCompleted);
	formData.append('isDocumentSent', isDocumentSent);

	var error = 0;
	if (isCompleted == 1) {
		var documentType = $(".anCheckListTypeKey option:selected").val();
		if (documentType == 0) {
			$(".anCheckListTypeKey").parent().addClass('has-error');
			$("#helpBlock2").html('Morate izabrati tip dokumentacije!');
			error = 1;
		} else {
			$(".anCheckListTypeKey").parent().removeClass('has-error');
			$("#helpBlock2").html('');
		}
	}

	if (!error) {
		$('.mainFog').show();
		$('.mainFogImage').show();
		$.ajax({
			url: "/inventory/getSberbankList",
			type: "post",
			data: formData,
			processData: false,
			contentType: false,
			dataType: 'json',
			success: function (result) {

				var isComp = (isCompleted == 1) ? 'Završeno' : 'Nezavršeno';
				var isVisible = (isCompleted == 0) ? 'style="display:none"' : '';
				if (isCompleted == 1 && isDocumentSent == 0) {
					$(".selectAll").show();

				}
				string = '';
				string += '<table class="table table-striped data-table" border="0">' +
					'<thead>' +
					' <tr>' +
					'<th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Partija kredita</th>' +
					'<th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Datum Kredita</th>' +
					' <th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Ček lista</th>' +
					' <th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Inventarski broj</th>' +
					'<th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Broj kutije</th>' +
					'<th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Naziv komitenta</th>' +
					'<th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Status</th>';
				if (isComp == 1) {
					string += ' <th class="thSent" style="cursor: pointer; display: none"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Poslato</th>'
				}

				string += '</tr>' +
					'</thead>' +
					'<tbody class="tableBody">';



				$.each(result, function (key, item) {

					dd = item.adCreditReleaseDate ? item.adCreditReleaseDate : '';

					creditNumberLink = '';
					console.log(item.acCheckListDescr);
					if (item.acCheckListDescr == 'NEPOZNATO') {
						creditNumberLink = item.acCreditNumber;
					} else {
						creditNumberLink = '<a href="/inventory/viewSberbankDocument/' + item.anDocumentKey + '">' + item.acCreditNumber + '</a>';
					}
					string += '<tr>' +
						'<td>' +
						creditNumberLink +
						'</td>' +
						'<td>' + dd + '</td>' +
						'<td>' + item.acCheckListDescr + '</td>' +
						'<td>' + item.acInventNum + '</td>' +
						'<td>' + item.acIdent + '</td>' +
						'<td>' + item.acSubject + '</td>' +
						'<td>' + isComp + '</td>' +
						'<td class="tdSent" ' + isVisible + '>';

					if (item.isDocumentSent == 1) {
						string += 'Poslato';
					} else {
						string += '<input type="checkbox" name="senttosber" class="checkToSendSberComp" value="' + item.anDocumentKey + '"';
					}
					string += '</td>';
					'</tr>';
				})

				string += '</tbody>' +
					'</table>';

				$('.tableHolder').html(string);
				$('.mainFog').hide();
				$('.mainFogImage').hide();
			}
		});

	}
}
function getFiltredList() {
	var myForm = document.getElementById('filterForm');
	var formData = new FormData(myForm);

	var isCompleted = $("ul#tabsBar li.active a").data('type');
	var isDocumentSent = $('input.isDocumentSent').is(':checked') ? "1" : "0";

	formData.append('isCompleted', isCompleted);
	formData.append('isDocumentSent', isDocumentSent);

	var error = 0;
	if (isCompleted == 1) {
		var documentType = $(".anCheckListTypeKey option:selected").val();
		if (documentType == 0) {
			$(".anCheckListTypeKey").parent().addClass('has-error');
			$("#helpBlock2").html('Morate izabrati tip dokumentacije!');
			error = 1;
		} else {
			$(".anCheckListTypeKey").parent().removeClass('has-error');
			$("#helpBlock2").html('');
		}
	}

	if (!error) {
		$('.mainFog').show();
		$('.mainFogImage').show();
		$.ajax({
			url: "/inventory/getSberbankList",
			type: "post",
			data: formData,
			processData: false,
			contentType: false,
			dataType: 'json',
			success: function (result) {

				var isComp = (isCompleted == 1) ? 'Završeno' : 'Nezavršeno';
				var isVisible = (isCompleted == 0) ? 'style="display:none"' : '';
				if (isCompleted == 1 && isDocumentSent == 0) {
					$(".selectAll").show();

				}
				string = '';
				string += '<table class="table table-striped data-table" border="0">' +
					'<thead>' +
					' <tr>' +
					'<th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Partija kredita</th>' +
					'<th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Datum Kredita</th>' +
					' <th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Ček lista</th>' +
					' <th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Inventarski broj</th>' +
					'<th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Broj kutije</th>' +
					'<th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Naziv komitenta</th>' +
					'<th style="cursor: pointer"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Status</th>';
				if (isComp == 1) {
					string += ' <th class="thSent" style="cursor: pointer; display: none"><span class="glyphicon glyphicon-transfer sort-icon gly-rotate-90"></span>Poslato</th>'
				}

				string += '<th style="cursor: pointer"></th></tr>' +
					'</thead>' +
					'<tbody class="tableBody">';



				$.each(result, function (key, item) {

					dd = item.adCreditReleaseDate ? item.adCreditReleaseDate : '';

					if (item.acCheckListDescr == 'NEPOZNATO') {
						creditNumberLink = item.acCreditNumber;
					} else {
						creditNumberLink = '<a href="/inventory/viewSberbankDocument/' + item.anDocumentKey + '">' + item.acCreditNumber + '</a>';
					}

					string += '<tr>' +
						'<td>' +
						creditNumberLink +
						'</td>' +
						'<td>' + dd + '</td>' +
						'<td>' + item.acCheckListDescr + '</td>' +
						'<td>' + item.acInventNum + '</td>' +
						'<td>' + item.acIdent + '</td>' +
						'<td>' + item.acSubject + '</td>' +
						'<td>' + isComp + '</td>' +
						'<td class="tdSent" ' + isVisible + '>';

					if (item.isDocumentSent == 1) {
						string += 'Poslato';
					} else {
						string += '<input type="checkbox" name="senttosber" class="checkToSendSberComp" value="' + item.anDocumentKey + '"';
					}
					string += '</td>' +
						'<td><span class="glyphicon glyphicon-trash removeCreditDocument" style="cursor:pointer;" data-key = "' + item.anDocumentKey + '" title="Brisanje ručno unešenih partija"></span></td>' +
						'</tr>';
				})

				string += '</tbody>' +
					'</table>';

				$('.tableHolder').html(string);
				$('.mainFog').hide();
				$('.mainFogImage').hide();
			}
		});

	}
}

$(document).on('click', '.sendSberDocumentsComp', function () {

	count = 0;
	acPartyCred = "";
	$.each($('.checkToSendSberComp:checked'), function (i, d) {
		count = count + 1;
		acPartyCred += $(this).val() + ";";
	});



	if (acPartyCred != "") {
		console.log(acPartyCred, "doc");
		$("#confirm").modal();
		$(".modal-content").css("width", "500px");
		$("#confirm").find(".modal-title").html("Snimanje dokumentacije");
		$("#confirm").find(".modal-body").html("");
		/*$('#confirm').find('.modal-body').html(
		"<div class='container' >"+
			"<div class='row'>"+
				"<div class='col-lg-7 col-sm-7 col-12'>"+
					"<label style='float:left'>Emailovi (Da bi poslali na više adresa odvoite sa tačka zarez)</label><br/>"+
					"<span>"+
						"<input type='text' name='emailSendSber' class='form-control emailSendSber'>"+
					"</span>"+
				"</div>"+
			"</div>"+
		"</div>"
	);*/
		$("#confirm")
			.find(".modal-footer")
			.html(
				'<button type="button" class="btn btn-success sendSberDocConfirmComp" tabindex="-1" data-party="' +
				acPartyCred +
				'">Snimi</button>' +
				'<button type="button" class="btn btn-danger " data-dismiss="modal">Ne</button>'
			);
	} else {
		$("#confirm").modal();
		$("#confirm").find(".modal-title").html("Snimanje dokumentacije");
		$("#confirm").find(".modal-body").html("Morate izabrati partije kredita");
		$("#confirm").find(".modal-footer").html('<button type="button" class="btn btn-danger" data-dismiss="modal">Zatvori</button>');
	}

});

$(document).on('click', '.sendSberDocConfirmComp', function () {
	acPartyCred = $(this).attr('data-party');
	//emailSendSber = $('input[name=emailSendSber]').val();
	var documentType = $(".anCheckListTypeKey option:selected").val();
	emailSendSber = '';
	$('.mainFog').show();
	$('.mainFogImage').show();

	if (documentType == 1) {
		var urlName = '/inventory/sendSberDocCredit';
	} else if (documentType == 2) {
		var urlName = '/inventory/sendSberDocStatus';
	} else if (documentType == 3) {
		var urlName = '/inventory/sendSberDocComp';
	} else if (documentType == 4) {
		var urlName = '/inventory/sendSberDocCorporate';
	}

	$.ajax({
		url: urlName,
		type: "post",
		data: {
			acPartyCred: acPartyCred,
			emailSendSber: emailSendSber
		},
		dataType: 'json',
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			$('#confirm').modal();
			$('#confirm').find('.modal-title').html("Snimanje dokumentacije");
			$('#confirm').find('.modal-body').html(data.message);
			if (data.ok == 1) {
				/*$.each(data, function(i,d){
					if(i != '' && i != 'ok' && i != 'message' && i != 'anBatchBarcode'){
						var link = document.createElement("a");
						// If you don't know the name or want to use
						// the webserver default set name = ''
						link.setAttribute('download', i);
						link.href = '/'+d;
						document.body.appendChild(link);
						link.click();
						link.remove();
					}
				});*/
				setTimeout(function () {
					getFiltredList();
				}, 1000);
			}
		}
	});
});

$(document).on('click', '.exportDataArhiveBook', function () {
	$('.mainFog').show();
	$('.mainFogImage').show();
	company = $("input[name=subject]").val();
	dateCreateFrom = $("input[name=createdFrom]").val();
	dateCreateTo = $("input[name=createdTo]").val();
	window.location.href = "/inventory/arhiveBookExport/" + company + "/" + dateCreateFrom + "/" + dateCreateTo;
	$('.mainFog').hide();
	$('.mainFogImage').hide();
});

$('select[name=statusSberIn]').on('change', function () {
	status = $(this).val();
	$('.massSendToTransport').css('display', 'none');
	docType = $(this).attr('data-type');
	if (docType == '0TK0') {
		url = "/inventory/ordersSberList";
	} else if (docType == '0DK0') {
		url = "/inventory/ordersSberDkList";
	} else if (docType == '0KR0') {
		url = "/inventory/ordersSberKdList";
	} else if (docType == '0DP0') {
		url = "/inventory/ordersSberDdList";
	} else if (docType == '0PP0') {
		url = "/inventory/ordersSberPpList";
	} else if (docType == '0AN0') {
		url = "/inventory/ordersSberAnList";
	} else {
		url = "/inventory/ordersSberSdList";
	}
	$.ajax({
		url: url,
		type: "post",
		data: {
			status: status
		},
		success: function (data) {
			$('.tableBody').html(data);
		}
	});
});

$(document).on('click', '.orderStatusSber', function (i, d) {
	acKey = $(this).attr('data-key');


	block = $('select[name=blockType]').val();

	if (block == '0') {
		$('#message').modal();
		$('#message').find('.modal-body p').html('Morate da izaberete blok!');
	} else {
		$('.mainFog').show();
		$('.mainFogImage').show();
		$.ajax({
			url: "/inventory/orderStatusSber",
			type: "post",
			data: {
				acKey: acKey,
				acDocType: block
			},
			dataType: 'json',
			//async: false,
			success: function (data) {
				if (data.ok == 'F') {
					$('.mainFog').hide();
					$('.mainFogImage').hide();
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
					$('#message').find('.modal-footer').html(
						"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
					);
				} else {
					$('.mainFog').hide();
					$('.mainFogImage').hide();
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.message);
					$('#message').find('.modal-footer').html(
						"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
					);
					if (acKey.indexOf('0TK0') >= 0) {
						setTimeout(function () {
							window.location.href = '/inventory/ordersSberList';
						}, 2000);
					} else if (acKey.indexOf('0DK0') >= 0) {
						setTimeout(function () {
							window.location.href = '/inventory/ordersSberDkList';
						}, 2000);
					} else if (acKey.indexOf('0KR0') >= 0) {
						setTimeout(function () {
							window.location.href = '/inventory/ordersSberKdList';
						}, 2000);
					} else if (acKey.indexOf('0DP0') >= 0) {
						setTimeout(function () {
							window.location.href = '/inventory/ordersSberDdList';
						}, 2000);
					} else if (acKey.indexOf('0PP0') >= 0) {
						setTimeout(function () {
							window.location.href = '/inventory/ordersSberPpList';
						}, 2000);
					} else {
						setTimeout(function () {
							window.location.href = '/inventory/ordersSberSdList';
						}, 2000);
					}
				}

			}
		});
	}

});


$(document).on('click', '.searchReadyBox', function (e) {
	var status = $('select[name=positiveSelect]').val();
	$('.mainFog').show();
	$('.mainFogImage').show();
	$.ajax({
		url: "/inventory/readyBoxes",
		type: "post",
		data: {
			status: status
		},
		success: function (data) {
			$('.mainFog').hide();
			$('.mainFogImage').hide();
			$('.showResults').html(data);
		}
	});
});

$(document).on('change', '.importDepositBtn', function (e) {
	e.preventDefault();
	//$('#importedFileName').text(this.value.replace(/.*[\/\\]/, ''));
	var formData = new FormData();
	var inputFile = $('.importDepositExcelFile');
	var fileToUpload = inputFile[0].files[0];
	formData.append('excelFile', fileToUpload);
	$.ajax({
		url: "/inventory/importMonthlyDepositFromExcel",
		type: "post",
		data: formData,
		cache: false,
		contentType: false,
		processData: false,
		success: function (response) {
			console.log(response);
		},
		error: function (jqXhr, textStatus, errorMessage) {
			$('#message').modal();
			$('#message').find('.modal-body p').html('Greska u konekciji');
			$('#message').find('.modal-footer').html(
				"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
			);
			setTimeout(function () {
				$('#message').modal('hide');
			}, 3000);
		},
		complete: function () {
			$(".mainFog").hide();
			$(".mainFogImage").hide();
		}
	});
	$(".mainFog").show();
	$(".mainFogImage").show();
});

$(document).on('click', '.generateBoxNumbersBtn', function (e) {


	$.ajax({
		url: "/inventory/getSubjectsVer2",
		type: "post",
		dataType: "json",
		success: function (data) {

			console.log(data, 'data');

			stringBody = '<div class="row">' +
				'<div class="col-xs-12">' +
				'<div class="form-group">' +
				'<label>Broj kutija:</label>' +
				'<input type="text" class="form-control anQtyBox" />' +
				'</div>' +
				'<div class="form-group">' +
				'<label>Subjekat:</label>' +
				'<select class="form-control acSubjectBox">' +
				'<option value="0">Izaberite...</option>';
			$.each(data, function (i, d) {
				stringBody += '<option value="' + d.acSubject + '">' + d.acSubject + '</option>';
			});
			stringBody += '</select>' +
				'</div>' +
				'</div>' +
				'<div class="col-xs-12">' +
				'<div class="list-numbers-box-info"></div>' +
				'<div class="list-numbers-box">' +
				'<table class="table">' +
				'<thead>' +
				'<tr>' +
				'<th>Nastali brojevi</th>' +
				'</tr>' +
				'</thead>' +
				'<tbody class="list-numbers-box-table">' +
				'</tbody>' +
				'</table>' +
				'</div>' +
				'</div>' +
				'</div>';

			$('#message').modal();
			$('#message').find('.modal-dialog').removeClass('modal-sm').addClass('modal-l');
			$('#message').find('.modal-title').html("Generisanje brojeva kutija za ekspozituru");
			$('#message').find('.modal-body').html(stringBody);
			$('#message').find('.modal-footer').html('<button type="button" class="btn btn-success generateBoxNumbersBtnSubmit">Generiši</button>');
		}
	});
});

$(document).on('click', '.generateBoxNumbersBtnSubmit', function (e) {

	acSubject = $('.acSubjectBox').val();
	anQty = $('.anQtyBox').val();
	acPrfx = $('.acPrfx').val();
	error = 0;

	if (acSubject == 0) {
		error = 1;
	}
	if (anQty.trim() == '') {
		error = 1;
	}

	if (error == 0) {
		$.ajax({
			url: "/inventory/createSBXItem",
			type: "post",
			dataType: 'json',
			data: {
				acSubject: acSubject,
				anQty: anQty,
				acPrfx: acPrfx,
			},
			success: function (data) {
				console.log(data, 'data');
				$('.list-numbers-box-info').html('<div class="alert alert-success">' + data.info.acMessage + '</div>');

				setTimeout(function () {
					$('.list-numbers-box-info').html('');
				}, 3000);
				str = '';
				$.each(data.list, function (i, d) {
					str += '<tr><td>' + d.acIdent + '</td></tr>'
				});
				$('.list-numbers-box-table').html(str);
				$('.anQtyBox').val('');
				$('.acSubjectBox').val(0);
			}
		});
	} else {
		$('.list-numbers-box-info').html('<div class="alert alert-danger">Morate popuniti sva polja kako bi generisali kutije!</div>');
	}

});

$('input[name=identSberControlInput]').on('keydown', function (e) {
	thisItem = $(this);
	var acIdent = thisItem.val();

	if ((e.which == 13 || e.which == 9)) {
		//	if(acIdent == '' || acIdent.length == 13 ) {
		tempId = thisItem.attr('data-tempId');
		isForUpload = thisItem.attr('data-isForUpload');
		$.ajax({
			url: "/inventory/documentTempEditSber",
			type: "post",
			dataType: 'json',
			data: {
				tempId: tempId,
				acIdent: acIdent
			},
			success: function (data) {
				if (data.anOk == 1) {
					if (isForUpload == 0) {
						thisItem.closest('tr').find('.answerHolder').html('<span class="glyphicon glyphicon-ok" style="color:green; float:right; padding-top: 5px;" title="Ispravno"></span>');
						thisItem.prop('data-tempId', 1);
					} else {
						thisItem.closest('tr').find('.answerHolder').html('<span class="glyphicon glyphicon-remove" style="color:red; float:20px; float:right; padding-top: 5px;"  title="Neispravno"></span>');
						thisItem.prop('data-tempId', 0);
					}
					if (acIdent == '') {
						thisItem.closest('tr').find('.answerHolder').html('<span class="glyphicon glyphicon-remove" style="color:red; float:20px; float:right; padding-top: 5px;"  title="Neispravno"></span>');
						thisItem.prop('data-tempId', 0);
					}
				} else {
					$('#message').modal();
					$('#message').find('.modal-body p').html(data.acMessage);
					$('#message').find('.modal-footer').html(
						"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
					);
				}
			}
		});
		/*	}else{
					$('#message').modal();
					$('#message').find('.modal-body p').html("Neispravan format");
					$('#message').find('.modal-footer').html(
							"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
					);
				}*/
	}
});


$(document).on('click', '.arhivDepoConformation', function (e) {
	$('#message').modal();
	$('#message').find('.modal-title').html("Odabir bloka za smestanje");
	string = "<select id='arhivDepoConformation' name='arhivDepoConformation' class='width100 noBorder' title='Blok'>" +
		"<option value=0>Izaberite blok</option>" +
		"<option value='01A0'>Blok A</option>" +
		"<option value='01C0'>Blok B</option>" +
		"<option value='01E0'>Blok C</option>" +
		"</select>";
	$('#message').find('.modal-body p').html(string);
	$('#message').find('.modal-footer').html(
		"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>" +
		"<button type='button' class='btn btn-success arhivDepoConformationConfirm' >Potvrdi</button>"
	);
});

$(document).on('click', '.arhivDepoConformationConfirm', function (e) {

	$.ajax({
		url: "/inventory/arhivDepoConformationConfirm",
		type: "post",
		dataType: 'json',
		data: {
			docType: $('select[name=arhivDepoConformation]').val()
		},
		success: function (data) {
			//$('#message').modal();
			$('#message').find('.modal-body p').html(data.acMessage);
			$('#message').find('.modal-footer').html(
				"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
			);
			if (data.anOk == 1) {
				setTimeout(function () {
					location.reload();
				}, 2000);
			}
		}
	});
});


$('input[name=searchIdent]').on('keyup', function (e) {
	term = $(this).val().toLowerCase();
	$.each($('tbody tr'), function (i, d) {
		isFound = 0;
		$(this).find('td').each(function (j, d2) {
			if (d2.innerHTML.toLowerCase().includes(term)) {
				isFound = 1;
			}
		});
		if (isFound == 1) {
			$(this).show();
		} else {
			$(this).hide();
		}

	});
});

$('input[name=searchOj]').on('keyup', function (e) {
	term = $(this).val().toLowerCase();

	$.each($('.orgUnit'), function (i, d) {
		if (d.innerHTML.toLowerCase().includes(term)) {
			$(this).closest('tr').show();
		} else {
			$(this).closest('tr').hide();
		}
	});
});




$(document).on('change', '.uploadFileSberb22', function (e) {
	var anId = $(this).attr('data-id');


	// console.log($(this));
	var anRuleid = $(this).attr('data-ruleid');
	var dockey = $(this).attr('data-dockey');
	var tabId = 1;
	var nameCheckList = $(this).closest('.contentGlobalCheckList').find('.questionTitle').attr('data-name');
	$.each($('.quTabs'), function (i, d) {
		if ($(this).hasClass('active')) {
			console.log($(this));
			tabId = $(this).attr('data-id');
		}
	});

	creditNumber = $('.creditNumberNb').text();

	var myForm = document.getElementById('createSpecialForm2-' + anId);
	var formData = new FormData(myForm);

	formData.append('anRuleid', anRuleid);
	formData.append('id', anId);
	formData.append('tabId', tabId);
	formData.append('dockey', dockey);
	fileValue = this.value;

	if (fileValue != '') {
		$.ajax({
			url: "/inventory/uploadFileSberb2",
			type: "post",
			data: formData,
			processData: false,
			contentType: false,
			dataType: 'json',
			success: function (result) {

				if (result.msg != 'Dogodila se greška probajte ponovo.') {
					// console.log($('.rowHolderContent'+anId));
					// console.log(result.fileLink);
					$('.rowHolderContent' + anId).find('.scanDocumentHolder').html('<a href="/' + result.fileLink + '" style="float: right; margin-right: 10px; padding-top: 5px;" target="_blank">Skenirani dokument</a>');
					$('.rowHolderContent' + anId).find('.scanDocumentButtonsHolder').html('<a class="btn btn-warning  btn-sm pull-right removeFileSberb22" data-id="' + anId + '" data-filepath="' + result.fileLink + '" data-ruleid="' + anRuleid + '" data-dockey="' + dockey + '" style="margin-right: 10px; padding: 1px 4px;"><span class="glyphicon glyphicon-paperclip " aria-hidden="true"></span> Ukloni fajl</a>');
					$(".rowHolderContent" + anId).find(".answerHolder").html('<span class="glyphicon glyphicon-ok" style="color:green; float:right; padding-top: 5px;" title="Ispravno"></span>');
					$(".rowHolderContent" + anId).find(".questionAnsver3[value='1']").attr("checked", "true");
					$(".rowHolderContent" + anId).find(".questionAnsver3[value='0']").removeAttr("checked");
				}
			}
		});
	}



});

$(document).on('click', '.removeFileSberb22', function () {
	anId = $(this).data('id');
	anRuleid = $(this).attr('data-ruleid');
	dockey = $(this).attr('data-dockey');
	filepath = $(this).attr('data-filepath');
	tabId = $(this).attr('data-tab');
	nameCheckList = $(this).attr('data-namechecklist');

	// console.log('anId: '+anId);
	console.log(filepath);
	$.ajax({
		url: "/inventory/removeFileSberb",
		type: "post",
		dataType: 'json',
		data: {
			anId: anId,
			filepath: filepath,
		},
		success: function (data) {

			if (data != '') {

				$('.rowHolderContent' + anId).find('.scanDocumentHolder').html('');
				$('.rowHolderContent' + anId).find('.scanDocumentButtonsHolder').html('<form style="display:inline;" id="createSpecialForm2-' + anId + '"><label for= "upload-file-special-' + anId + '" class="upload-file-special btn btn-info  btn-sm pull-right" style="margin-right: 10px; padding: 1px 4px;" ><input type="file" class="uploadFileSberb22" style="display: none;" name="cover_image" id="upload-file-special-' + anId + '" data-id="' + anId + '" data-ruleid="' + anRuleid + '" data-dockey="' + dockey + '"/> <span class="glyphicon glyphicon-paperclip " aria-hidden="true"></span> Priloži fajl</label></form>')

				$(".rowHolderContent" + anId).find(".answerHolder").html('<span class="glyphicon glyphicon-remove" style="color:red; float:right; padding-top: 5px;" title="Neispravno"></span>');
				$(".rowHolderContent" + anId).find(".questionAnsver3[value='0']").attr('checked', 'true');
				$(".rowHolderContent" + anId).find(".questionAnsver3[value='1']").removeAttr("checked");
			}

		}
	});
});





$(document).on('click', '.removeFileSberb2', function () {
	anId = $(this).data('id');
	anRuleid = $(this).attr('data-ruleid');
	dockey = $(this).attr('data-dockey');
	tabId = $(this).attr('data-tab');
	nameCheckList = $(this).attr('data-namechecklist');

	console.log('anId: ' + anId);
	$.ajax({
		url: "/inventory/removeFileSberb",
		type: "post",
		dataType: 'json',
		data: {
			anId: anId,
		},
		success: function (data) {

			if (data != '') {

				$('.rowHolderContent' + anId).find('.scanDocumentHolder').html('');
				$('.rowHolderContent' + anId).find('.scanDocumentButtonsHolder').html('<a class="btn btn-info  btn-sm pull-right uploadFileSberb2" data-id="' + anId + '" data-ruleid="' + anRuleid + '" data-dockey="' + dockey + '" style="margin-right: 10px; padding: 1px 4px;"><span class="glyphicon glyphicon-paperclip " aria-hidden="true"></span> Priloži fajl</a>');
				$(".rowHolderContent" + anId).find(".answerHolder").html('<span class="glyphicon glyphicon-remove" style="color:red; float:right; padding-top: 5px;" title="Neispravno"></span>');
				$(".rowHolderContent" + anId).find(".questionAnsver3[value='0']").attr('checked', 'true');
				$(".rowHolderContent" + anId).find(".questionAnsver3[value='1']").removeAttr("checked");
			}

		}
	});
});


$(document).on('click', '.removeFileSberb2Global', function () {
	anId = $(this).data('id');
	anRuleid = $(this).attr('data-rule');
	dockey = $(this).attr('data-dockey');
	filepath = $(this).attr('data-filepath');
	tabId = $(this).attr('data-tab');
	nameCheckList = $(this).attr('data-namechecklist');

	console.log('anId: ' + anId);
	$.ajax({
		url: "/inventory/removeFileSberbFunction",
		type: "post",
		dataType: 'json',
		data: {
			anId: anId,
			dockey: dockey,
			anRuleid: anRuleid,
			filepath: filepath,
		},
		success: function (data) {
			if (data.anOk == 1) {
				if (data.isDeleted == 1) {
					location.reload();
				}
			}
		}
	});
});

$(document).on("change", ".checkBoxBackReverse", function () {
	var key = $(this).closest("tr").attr("data-ackey");
	var isChecked = $(this).is(":checked");

	var selectedKey = $(".submitCheckBoxInputReverse").attr("data-key");

	if ($(".checkBoxBackReverse:checked").length == 0) {
		$(".submitCheckBoxInputReverse").attr("data-key", "");
		$("tr").css("background-color", "");
		$(".submitCheckBoxInputReverse").attr("disabled", true);
	} else {
		$(".submitCheckBoxInputReverse").attr("disabled", false);
	}

	if (selectedKey == "") {
		selectedKey = $(".submitCheckBoxInputReverse").attr(
			"data-key",
			key
		);
		$.each($('tr[data-ackey="' + key + '"]'), function (key, item) {
			if (isChecked) {
				$(this).css("background-color", "#a8ffbf");
			}
		});
	} else if (selectedKey != key) {
		$(this).prop("checked", false);
		$(".errorMsg").show();
		setTimeout(function () {
			$(".errorMsg").hide();
		}, 2000);
	}
});

$(document).on("click", ".submitCheckBoxInputReverse", function (e) {
	var acKey = $(this).attr("data-key");

	$.ajax({
		url: "/inventory/createReversReturns",
		type: "post",
		data: {
			reversKey: acKey,
		},
		dataType: "json",
		success: function (data) {
			if (data.ok == "T") {
				$("#message").modal();
				$("#message").find(".modal-body p").html(data.message);
				setTimeout(function () {
					window.location.href = `/inventory/returnFromRevers/${data.key}`;
				}, 1000);
			} else {
				$("#message").modal();
				$("#message").find(".modal-body p").html(data.message);

				setTimeout(function () {
					$("#message").modal("hide");
				}, 1000);
			}
		},
	});
});

Date.prototype.toDateInputValue = (function () {
	var local = new Date(this);
	local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
	return local.toJSON().slice(0, 10);
});

$(document).on('click', '.importCreditExcelBtn', function (e) {
	var currentDate = new Date(),
		currentMonth = currentDate.getMonth();

	$('#importCreditExcelModal').find('.modal-body').html('');
	$('#importCreditExcelModal').modal();
	$('.modal-content').css('width', '400px');
	$('#importCreditExcelModal').find('.modal-header h4').html(" Importovanje <span id='creditInfo'>izveštaja za kredite</span>");

	$('#importCreditExcelModal').find('.modal-body').append(
		"<span style='display: inline-block; margin-right: 58px;'>Odaberite mesec za koji se importuje izveštaj</span>" +
		"<div class='div7' style='width: 100%; display: inline-block; margin-top: 1.5rem;'>"
	);
	console.log(currentMonth);
	$('#importCreditExcelModal').find('.modal-body .div7').append(
		"<select style='margin-top: .5rem; margin-bottom: 1.5rem;' class='form-control monthDropdown'>" +
		"<option value='01'>Januar</option>" +
		"<option value='02'>Februar</option>" +
		"<option value='03'>Mart</option>" +
		"<option value='04'>April</option>" +
		"<option value='05'>Maj</option>" +
		"<option value='06'>Jun</option>" +
		"<option value='07'>Jul</option>" +
		"<option value='08'>Avgust</option>" +
		"<option value='09'>Septembar</option>" +
		"<option value='10'>Oktobar</option>" +
		"<option value='11'>Novembar</option>" +
		"<option value='12'>Decembar</option></select>" +
		// "<label class='label label-default' for='importDateFrom'>Od datuma</label>"+
		// "<input class='importDateFrom form-control' style='margin-top: .5rem; margin-bottom: 1.5rem;' name='importDateFrom' value='"+new Date().toDateInputValue()+"' title='Datum od' type='date' />"+
		// "<label class='label label-default' for='importDateTo'>Do datuma</label>"+
		// "<input class='importDateTo form-control' style='margin-top: .5rem; margin-bottom: 1.5rem;' name='importDateTo' value='"+new Date().toDateInputValue()+"' title='Datum do' type='date' />"+
		"<label class='btn btn-sm btn-primary importCreditExcelFileBtn'>" +
		"<span class='glyphicon glyphicon-cloud-upload' aria-hidden='true'></span>" +
		"<input class='importCreditExcelFile' id='importCreditExcelFile' type='file'" +
		"style='display: none;'/>" +
		"<span style='margin-left: 10px'> IMPORT FAJLA</span></label>" +
		"<p id='importedFileName' style='font-size: 10px; margin-top: 1rem;'></p>"
	);
	$('.monthDropdown option:eq(' + currentMonth + ')').prop('selected', true);


	//$('#importCreditExcelModal').find('.modal-body').append(string);
});

$(document).on('change', '.importCreditExcelFileBtn', function (e) {
	e.preventDefault();
	var inputFile = $('.importCreditExcelFile');
	if (inputFile.val() != '') {
		$('#importedFileName').html("<span style='color: red; margin-right: 10px; cursor: pointer;' class='glyphicon glyphicon-remove removeInputFile' aria-hidden='true'></span>" + inputFile.val().replace(/.*[\/\\]/, ''));
	}
});

$(document).on('click', '.removeInputFile', function (e) {
	$('.importCreditExcelFile').val();
	$('.importCreditExcelFile').trigger('change');
	$('#importedFileName').html('');
});

// funkcija vraca ukupan broj dana u datom mesecu
function daysInMonth(month, year) {
	return new Date(year, month, 0).getDate();
}

$(document).on('click', '.confirmImportExcelCredit', function (e) {
	var formData = new FormData();
	var inputFile = $('.importCreditExcelFile');
	var fileToUpload = inputFile[0].files[0];
	var month = $('.monthDropdown').find(":selected").val();

	var currentDate = new Date(),
		currentYear = currentDate.getFullYear();

	var dateFrom = currentYear + '-' + month + '-01';
	var dateTo = currentYear + '-' + month + '-' + daysInMonth(month, currentYear);

	formData.append('excelFile', fileToUpload);
	formData.append('dateFrom', dateFrom);
	formData.append('dateTo', dateTo);

	$('#importCreditExcelModal').modal('hide');

	$.ajax({
		url: "/inventory/massImportFromExcelCredit",
		type: "post",
		data: formData,
		cache: false,
		contentType: false,
		processData: false,
		success: function (response) {
			if (response == 1) {
				$('#message').modal();
				$('#message').find('.modal-body p').html('Uspešno importovan fajl.');
				$('#message').find('.modal-footer').html(
					"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
				);
				setTimeout(function () {
					$('#message').modal('hide');
				}, 3000);
				//console.log(response);
			} else {
				$('#message').modal();
				$('#message').find('.modal-body p').html('Došlo je do greške.');
				$('#message').find('.modal-footer').html(
					"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
				);
				setTimeout(function () {
					$('#message').modal('hide');
				}, 3000);
			}
		},
		error: function (jqXhr, textStatus, errorMessage) {
			$('#message').modal();
			$('#message').find('.modal-body p').html('Greska u konekciji');
			$('#message').find('.modal-footer').html(
				"<button type='button' class='btn btn-danger' data-dismiss='modal'>Zatvori</button>"
			);
			setTimeout(function () {
				$('#message').modal('hide');
			}, 3000);
		},
		complete: function () {
			$(".mainFog").hide();
			$(".mainFogImage").hide();
		}
	});
	$(".mainFog").show();
	$(".mainFogImage").show();
});
