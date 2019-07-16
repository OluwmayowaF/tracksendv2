// JavaScript Document
//var SERVICE_HOST = "http://localhost/directory/services/";

function _getGlobals(id) {

  switch(id) {

    case "SERVICE_HOST" : return "/api/";
    break;

  }

} 

$(document).ready(function() {
	var campaign_confirmed = false;


	$('form').submit((e) => {
		$(e.target).find('span.loading_icon').show();
	})

	/* $('form').submit(function(e) {
		$(e.target).find('.loading_icon').show();
	}) */
	
	/* datepickerDefault = new MtrDatepicker({
			target: "scheduler_div",
	}); */
	if($('#datepicker').length) $('#datepicker').datetimepicker({
		// inline: true,
		// sideBySide: true
		collapse: true
	}).on('dp.change', function (e) {
		// alert(e.timeStamp);
		$('#schedule').val(e.timeStamp);
	});
  
  $('#new_contact_group').on('change', function(e) {
    if($(e.target).val() == -1) {
      console.log('hehe');
      
      $('#_new_group_info').find('input[name="name"]').attr('required','required');
      $('#_new_group_info').show()
    } else {
			console.log('popo'+$(e.target).val());
      
      $('#_new_group_info').hide()
      $('#_new_group_info').find('input[name="name"]').removeAttr('required');
    }
  })

	$('.compose_options_box > li').off('click');
	$('.compose_options_box > li').on('click', function(e) {
		// if($(e.target).attr('name') != 'check') return;

		var $wh = $(this);
		var inp = $wh.attr('id');
		// if(inp != 'ch-url') return;
		console.log('you selected: ' + $(e.target).attr('id'));
		var t, id;

		switch (inp) {
			case 'ch-firstname':
				t = 'firstname';
				id = 'firstname-in';
				
				break;
			case 'ch-lastname':
				t = 'lastname';
				id = 'lastname-in';
				
				break;
			case 'ch-email':
				t = 'email';
				id = 'email-in';
				
				break;
			case 'ch-url':
				return;
				
				break;
		}

		pasteDiv(id, t);

	})
	function pasteDiv(id, t) {
		// $('.editable_div').html($('.editable_div').html() + '<span spellcheck="false" contenteditable="false" id="'+id+'">'+t+'</span>');
		$('.editable_div').html($('.editable_div').html() + '<span spellcheck="false" contenteditable="false">'+t+'</span>');
		$('.editable_div').focus();
	}

	$('.create_short_url_btn').on('click', function (e) {

		var url = $('#long_url_link').val();

		if(url.length < 5) {
			alert('Kindly enter valid Link');
			return;
		}
		/* if($('.short_url_box #shorturlid').val().length > 0) {
			var urlid = '&id=' + $('.short_url_box #shorturlid').val();
		} else {
			var urlid = '';
		} */

		$s_ = $('#_edit_span');
		$t_ = $('#_edit_text');

		if($t_.is(':visible') && $t_.val() != '') {
			$s_.text($t_.val());
		}
		$t_.hide();
		$s_.show();

		var urlid = '';

		$.ajax({
			type: 'GET',
			url: _getGlobals('SERVICE_HOST')+'generateurl'+'?url='+url+urlid,
			contentType: 'application/json; charset=utf-8',
			// data: json_form_reg,
			success: function( data ) {

				// $('.short_url_box ._editable').val(data.shorturl);

				/* Scrambler({
					target: '.short_url_box ._editable',
					random: [1000, 2000],
					speed: 200,
					text: data.shorturl,
					beforeEach: function(element) {
						// console.log(`${element} about to scramble`);
					},
					afterAll: function(elements) {
						console.log('all done!');
					}
				}); */


				var el = document.querySelector('.short_url_box span._editable');
				var fx = new TextScramble(el);

				// var counter = 0;
				var next = function next() {
					// fx.setText(phrases[counter]).then(function () {
					fx.setText(data.shorturl).then(function () {
						// setTimeout(next, 800);
					});
					// counter = (counter + 1) % phrases.length;
				};

				next();

				$t_.val(data.shorturl);
				$('.short_url_box #shorturlid').val(data.id);
				$('.short_url_box').addClass('ready') ;
				$('.customize_url_btn').show('fade') ;


			},
			error: function(resp, dd, ww) {
				// $butt.removeAttr('disabled');
				// $butt.closest('div').find('.loading_icon').hide();
			}
		}).done(function(){
			// $butt.removeAttr('disabled');
			// $butt.closest('div').find('.loading_icon').hide();
		});

	})

	$('.customize_url_btn').on('click', function (e) {
		if(!$('.short_url_box').hasClass('ready')) return;

		$s_ = $('#_edit_span');
		$t_ = $('#_edit_text');

		if($s_.is(':visible')) {
			$t_.val($s_.text());
			$s_.hide();
			$t_.show();
		}


		// $('.short_url_box ._editable').attr('contenteditable', 'true');
		$('.short_url_box ._editable').removeAttr('readonly');
		// $('.short_url_box').text($('.short_url_box').text() + '/').focus();
		$('.short_url_box ._editable').focus();

	})

	$('.short_url_btn').on('click', function(e) {

		
		$s_ = $('#_edit_span');
		$t_ = $('#_edit_text');

		if($t_.is(':visible') && $t_.val() == '') {
			alert('Please enter your customized code, or click \'Create\' to generate new shortcode');
			return;
		}

		if($(this).hasClass('paste')) {
			if(!$('.short_url_box').hasClass('ready')) return;

			var t = 'url';
			var id = 'url-in';
			
			pasteDiv(id, t);
		}

		$.magnificPopup.close();
	})

	$('.campaign_summary_btn').on('click', function(e) {

		if($(this).hasClass('send')) {
			campaign_confirmed = true;
			$('#campaign_form').submit();
		}
		$.magnificPopup.close();

	})

	$('#campaign_form').submit(function (e) {

		if (campaign_confirmed) return true;
		
		var msg_ = $('.editable_div').html();
		msg_ = msg_.replace(/<span spellcheck="false" contenteditable="false">firstname<\/span>/g, '[firstname]')
					.replace(/<span spellcheck="false" contenteditable="false">lastname<\/span>/g, '[lastname]')
					.replace(/<span spellcheck="false" contenteditable="false">email<\/span>/g, '[email]')
					.replace(/<span spellcheck="false" contenteditable="false">url<\/span>/g, '[url]')
					.replace(/&nbsp;/g, ' ')
					.replace(/<span style="color: rgb\(112, 112, 112\); font-size: 15px; background-color: rgb\(255, 255, 255\); display: inline !important;">/g, '')
					.replace(/<\/span>/g, '');
		$('#campaignmessage').val(msg_);

		$me = $('#campaign_form');
		
		var json_campaign_login = JSON.stringify($me.serializeObject()); 

		$.ajax({
			type: 'POST',
			url: _getGlobals('SERVICE_HOST')+'analysecampaign',
			contentType: 'application/json',
			data: json_campaign_login,
				// data: json_form_reg,
			success: function( data ) {

				console.log(data);
				/* var msg_ = $('#campaignmessage').val();
				msg_ = msg_.replace(/<span spellcheck="false" contenteditable="false">firstname<\/span>/g, '[firstname]')
				.replace(/<span spellcheck="false" contenteditable="false">lastname<\/span>/g, '[lastname]')
				.replace(/<span spellcheck="false" contenteditable="false">email<\/span>/g, '[email]')
				.replace(/<span spellcheck="false" contenteditable="false">url<\/span>/g, '[url]')
				.replace(/&nbsp;/g, ' ')
				.replace(/<span style="color: rgb\(112, 112, 112\); font-size: 15px; background-color: rgb\(255, 255, 255\); display: inline !important;">/g, '')
				.replace(/<\/span>/g, ''); */



				$('#analysis-box #cpm_summary_name').text($('#campaign_name').val());
				$('#analysis-box #cpm_summary_sender').text($('#sel_sender_id option:selected').text());
				$('#analysis-box #cpm_summary_msg').text(msg_);
				$('#analysis-box #cpm_summary_to').text($('#sel_contact_group option:selected').text());
				$('#analysis-box #cpm_summary_recp').text(data.contactcount);
				$('#analysis-box #cpm_summary_count').text(data.msgcount);
				$('#analysis-box #cpm_summary_avg').text(parseInt(data.msgcount)/parseInt(data.contactcount));
				$('#analysis-box #cpm_units_chrg').text(data.units);

				var bal;
				if(data.units > data.balance) {
					bal = '<span style="color: red">' + data.balance + ' (INSUFFICIENT) </span>';
					$('.campaign_summary_btn.send').hide();
				} else {
					bal = data.balance;
					$('.campaign_summary_btn.send').show();
				}
				$('#analysis-box #cpm_units_balance').html(bal);

				$('#click_analysis_box').click();

			},
			error: function(resp, dd, ww) {
				// $butt.removeAttr('disabled');
				// $butt.closest('div').find('.loading_icon').hide();
			}
		}).done(function(){
			// $butt.removeAttr('disabled');
			// $butt.closest('div').find('.loading_icon').hide();
		});

		return false;

	})

	var hideTimer = window.setTimeout(() => {
		$('.to_hide').fadeOut();
	}, 1000);

	var st_select_searchterm = '';
	var done = "raaaa";
	if (typeof $('.select-search').select2 === "function") 
    // safe to use the function
	$('.select-search').select2({
		placeholder: "Enter the name",
		minimumInputLength: 3,
		multiple: false,
//		closeOnSelect: false,
//   		id: function(orgs){return {id: orgs.orgid};},
		ajax: {
			url: _getGlobals('SERVICE_HOST')+'providers',
			dataType: 'json',
			quietMillis: 100,
			data: function (term, page) { // page is the one-based page number tracked by Select2
				st_select_searchterm = term;
				return {
					q: term, //search term
					page_limit: 20, // page size
					// page: page, // page number
//					apikey: "ju6z9mjyajq2djue3gbvv26t" // please do not use so this example keeps working
				};
			},
			results: function(data){
			
				// var more = (page * 3) < data.total; // whether or not there are more results available
	 
				// notice we return the value of more so Select2 knows if more results can be loaded
				// return {results: data, more: more};
				return {results: data};
			}
		},
		 // omitted for brevity, see the source of this page
		templateSelection: function (dat) { 

			if(st_select_searchterm != '' && st_select_searchterm != this.me) {
				$('#providername').val(dat.text);
				if($('#same_prov_loc_chk').is(':checked')) {
					$('#same_prov_loc_chk').click();
					$('#same_prov_info_chk').click();
				} else {
					if (dat.id != -1) {
						$('#type_id').val(dat.type).trigger('chosen:updated');
						$('#_provider_type').val(dat.type);
						$('#same_prov_loc_chk').click();
						$('#same_prov_info_chk').click();
					} else {
						$('#same_prov_info_chk').attr('disabled', 'disabled');
						$('#same_prov_loc_chk').attr('disabled', 'disabled');
					}
				}
				this.me = st_select_searchterm;
			}
			return dat.text;
		}, // omitted for brevity, see the source of this page
//		dropdownCssClass: "bigdrop", //"select2-result-selectable", // apply css that makes the dropdown taller
//		escapeMarkup: function (m) { return m; } // we do not want to escape markup since we are displaying html in results
	}).on('select2-close', function(e) {
	}).on('change', function(e) {
	}).on('select2-opening', function(e) {
		if($(this).val() != "") {
			
		}
	});

	$('#sel_contact_group').on('change', function(e) {
		var opt = $(e.target).val();
		console.log('efasd sfdasdfasdf sfdasd...'+opt);

		if(opt == '0') {
			$('#show_contacts_pane').hide();			
			$('.lists #contact_list').html('');			
			return;
		}

		$.ajax({
			type: 'GET',
			url: _getGlobals('SERVICE_HOST')+'groupconts'+'?grp='+opt,
			contentType: 'application/json; charset=utf-8',
			// data: json_form_reg,
			success: function( data ) {
				$('#show_contacts_pane').show();			
					console.log(data.contacts);
					var header = '<li class="list_item _hd" style="font-weight: bolder">' +
					'	<ul class="saved_item">' +
					'		<li style="flex: 3">First Name</li>' +
					'		<li style="flex: 3">Last Name</li>' +
					'		<li style="flex: 2">Phone</li>' +
					'		<li style="flex: 4">Email</li>' +
					'		<li style="flex: 2">Status</li>' +
					'		<li style="flex: 1; text-align: center; font-size: 2em; line-height: 0.3;"> ... </li>' +
					'	</ul>' +
					'</li>';

					$('.lists #contact_list').html(header);
					var count = 0;

					if(opt == -1) {
						$('#group_name').text('ALL Groups');

						data.forEach(el => {
							$('#group_contact_count').text(count += el.count);
							do_html(el.contacts);
						});

					} else {
						$('#group_name').text(data.name);
						$('#group_contact_count').text(data.count);

						do_html(data.contacts);
						
						initializeActionBtns();

					}

					function do_html(list) {
						
						list.forEach(i => {
							console.log('this is: ' + i.firstname);
							var status = '';
							switch (i.status) {
								case 0:
									status = "Unverified";
									break;
							
								case 1:
									status = "Non-DND";
									break;
							
								case 2:
									status = "DND";
									break;
							
							}
							var html = '<li class="list_item" data-wh="contact">' +
													'	<ul class="saved_item">' +
													'		<input type="hidden" class="cid" value="'+i.id+'" />' +
													'		<li style="flex: 3" class="dv_firstname">'+i.firstname+'</li>' +
													'		<li style="flex: 3" class="dv_lastname">'+i.lastname+'</li>' +
													'		<li style="flex: 2">'+i.phone+'</li>' +
													'		<li style="flex: 4" class="dv_email">'+i.email+'</li>' +
													'		<li style="flex: 2">'+status+'</li>' +
													'		<li style="margin: 3px; margin-right:0; height: 33px; flex: 1; display: flex; background-color: #eee;">' +
													'			<span style="flex: 1; text-align:center" class="edit_item_btn"><a class="tooltip top" title="Edit" style="cursor: pointer"><i class="fa fa-edit"></i></a></span>|' +
													'			<span style="flex: 1; text-align:center" class="del_item_btn"><a class="tooltip top" title="Delete" style="cursor: pointer"><i class="fa fa-trash-o"></i></a></span>' +
													'		</li>' +
													'	</ul>' +
													'	<div class="inline_edit">' +
														'	<form>' +
														'	<div class="row with-forms">' +
														'		<div class="col-md-5">' +
														'			<h5>First Name </h5>' +
														'			<input type="text" name="firstname" class="ed_firstname" value="'+i.firstname+'">' +
														'			<input type="hidden" name="id" class="id" value="'+i.id+'">' +
														'		</div>' +
														'		<div class="col-md-6">' +
														'			<h5>Last Name </h5>' +
														'			<input type="text" name="lastname" class="ed_lastname" value="'+i.lastname+'">' +
														'		</div>' +
														'		<div class="col-md-1">' +
														'			<h5 style="text-align: center"><i class="fa fa-ellipsis-h"></i></h5>' +
														'			<div style="display: flex; padding-top: 10px;">' +
														'				<span style="flex: 1; text-align:center;" class="save_edit_btn"><a class="tooltip top" title="Save" style="color: green; cursor: pointer"><i class="fa fa-check"></i></a></span> | ' +
														'				<span style="flex: 1; text-align:center" class="cancel_edit_btn"><a class="tooltip top" title="Cancel" style="color: red; cursor: pointer"><i class="fa fa-times"></i></a></span>' +
														'			</div>' +
														'		</div>' +
														'	</div>' +
														'	<div class="row with-forms">' +
														'		<div class="col-md-5">' +
														'			<h5>Phone <span>(unchangeable)</span> </h5>' +
														'			<input type="text" value="'+i.phone+'" disabled>' +
														'		</div>' +
														'		<div class="col-md-6">' +
														'			<h5>Email </h5>' +
														'			<input type="text" name="email" class="ed_email" value="'+i.email+'">' +
														'		</div>' +
														'		<div class="col-md-1">' +
														'		</div>' +
														'	</div>' +
														'	</form>' +
														'</div>' +
													'</li>';

							$('.lists #contact_list').append(html);
							var $tpht1 = $('.lists #contact_list li:last-of-type .edit_item_btn a');
							$tpht1.tipTip();
							var $tpht2 = $('.lists #contact_list li:last-of-type .del_item_btn a');
							$tpht2.tipTip();
							var $tpht3 = $('.lists #contact_list li:last-of-type .save_edit_btn a');
							$tpht3.tipTip();
							var $tpht4 = $('.lists #contact_list li:last-of-type .cancel_edit_btn a');
							$tpht4.tipTip();

						});

					}
			},
			error: function(resp, dd, ww) {
				// $butt.removeAttr('disabled');
				// $butt.closest('div').find('.loading_icon').hide();
			}
		}).done(function(){
			// $butt.removeAttr('disabled');
			// $butt.closest('div').find('.loading_icon').hide();
		});
	
	})


	initializeActionBtns();
	function initializeActionBtns() {
		$('.edit_item_btn').off('click');
		$('.edit_item_btn').on('click', function(e) {
			var $btn = $(e.target);
			var $item = $btn.closest('.list_item');
			$item.find('.saved_item').hide();
			$item.find('.inline_edit').show();

		})
		
		$('.del_item_btn').off('click');
		$('.del_item_btn').on('click', function(e) {
		
			var del = prompt('Are you sure you want to delete this Sender ID? Type "YES" to proceed.');
			if(del.toUpperCase() == 'YES') {
				var $btn = $(e.target);
				var $item = $btn.closest('.list_item');
				var wh = $item.attr('data-wh');
				var id = $item.find('form .id').val();
			
				$.ajax({
					type: 'GET',
					url: _getGlobals('SERVICE_HOST')+'del' + wh + '?id=' + id,
					contentType: 'application/json; charset=utf-8',
					success: function( data ) {
						
						if(data.response == 'success') {
							console.log('ssssssssuuuuuuuuuuu');
							
							$item.remove();
							
							$('.notification.other3').removeClass('success error').addClass('success');
							$('.notification.other3 p').text('Item successfully deleted.');
							$('.notification.other3').css('opacity',100);
							$('.notification.other3').show();
							
						} else {
							$('.notification.other3').removeClass('success error').addClass('error');
							$('.notification.other3 p').text(data.response);
							$('.notification.other3').css('opacity',100);
							$('.notification.other3').show();
							
						} 
						
					},
					error: function(resp, dd, ww) {
						$('.notification.other3').removeClass('success error').addClass('error');
						$('.notification.other3 p').text('An error occurred. Please check your connection and try again.');
						$('.notification.other3').css('opacity',100);
						$('.notification.other3').show();

					}
				}).done(function(){
					
					
				});

			} else return;

		})

		$('.save_edit_btn').off('click');
		$('.save_edit_btn').on('click', function(e) {
			var $btn = $(e.target);
			var $item = $btn.closest('.list_item');
			var wh = $item.attr('data-wh');
			var $me = $item.find('form');

			var json_save_form = JSON.stringify($me.serializeObject()); 
			console.log('json', json_save_form);
			
			// var $butt = $me.find('input.button');
			// $butt.attr('disabled','disabled');
			// $me.find('.loading_icon').show();
		
			$.ajax({
				type: 'POST',
				url: _getGlobals('SERVICE_HOST')+'save'+wh,
				contentType: 'application/json; charset=utf-8',
				data: json_save_form,
				success: function( data ) {
					
					if(data.response == 'success') {
						console.log('ssssssssuuuuuuuuuuu');
						
						$item.find('.dv_firstname').text($item.find('.ed_firstname').val());
						$item.find('.dv_lastname').text($item.find('.ed_lastname').val());
						$item.find('.dv_email').text($item.find('.ed_email').val());

						$item.find('.dv_name').text($item.find('.ed_name').val());
						$item.find('.dv_desc').text($item.find('.ed_desc').val());
						if(wh == 'senderid') $item.find('.dv_status').text('Pending...');
						$item.find('.dv_updated').text('Pending...');
						
						$item.find('.inline_edit').hide();
						$item.find('.saved_item').show();
						
						$('.notification.other3').removeClass('success error').addClass('success');
						$('.notification.other3 p').text('Item successfully modified.');
						$('.notification.other3').css('opacity',100);
						$('.notification.other3').show();

					} else {
						$('.notification.other3').removeClass('success error').addClass('error');
						$('.notification.other3 p').text(data.response);
						$('.notification.other3').css('opacity',100);
						$('.notification.other3').show();
					} 
					
				},
				error: function(resp, dd, ww) {
					$('.notification.other3').removeClass('success error').addClass('error');
					$('.notification.other3 p').text('An error occurred. Please check your connection and try again.');
					$('.notification.other3').css('opacity',100);
					$('.notification.other3').show();
			}
			}).done(function(){
				
				
			});

		})

		$('.cancel_edit_btn').off('click');
		$('.cancel_edit_btn').on('click', function(e) {
			var $btn = $(e.target);
			var $item = $btn.closest('.list_item');
			$item.find('.inline_edit').hide();
			$item.find('.saved_item').show();

		})
	}
	//	SPACE PAGE: format opening hours
	$('._moment_me_time').each((i, el) => {
		$(el).text(moment($(el).text(), 'hh:mm:ss').format('h:mm A'));
	})
	
	//	DASHBOARD - REVIEWS: on select of listing from dropdown
	$('._filter_reload').on('change', function(e) {
		var $we = $(e.target);
		var url = "";

		if($we.val() == "0") {
			url = "/dashboard/" + $we.closest('.sort-by-select').find('#sort_type').val();
		} else {
			url = $we.val();
		}

		location.href = url;
	})

	//	DASHBOARD - MYLISTINGS: delete...	not using Ajax for now, so page reloads
	$('._del_my_listing').on('click', function(e) {

		var wh = confirm('Are you sure you want to delete this Space?');

		return wh;

	})

	$('#pwrd_edit_form').submit(function(e) {
		var $we = $(e.target);
		$('._e_listing .e_list').html('');
		var $htl = $we.find('._e_listing .e_list');

		if($we.find('#new_password').val() != $we.find('#new_password_confirmation').val()) {
			$htl.append('<li>Password mismatch</li>');
			$we.find('._form_errors._e_listing').show();
			$we.find('.loading_icon').hide();

			return false;
		}
		return true;
	})

	$('#floating_msg._show').delay(3000).fadeOut();
	$('#floating_msg._show').on('click', function(e) {
		$(e.target).hide();
	});

	$('#amount_entry').on('keyup', function (e) {
		var ent = parseFloat($(this).val());
		console.log('entered: ' + ent);
		
		var bands = [
			[2, 1, 50000],
			[1.9, 50001, 100000],
			[1.8, 100001, 500000],
			[1.7, 500001, 1000000000000],
		]

		if(!ent) {
				$('#_rate').text('??');
				$('#_units').text('??');
				$('#_amount').text('??');
		} else {
			bands.forEach(band => {
				if(ent >= band[1] && ent <= band[2]) {
					$('#_rate').text('N' + band[0] + '/unit');
					$('#_units').text(Math.floor(ent / band[0]));
					$('#_amount').text('N' + ( Math.floor(ent / band[0])) * band[0]);
				}
			});
		}
		
	})

})



function doDate() {
	//console.log('EXECUTED!');
	$('.date').each(function(i,el) {
		$(el).text(ourDate($(el).text()))
	})
}

function doRegistration() {
	// console.log(th);
	
	$('._form_errors').hide();
	$('._e_reg').hide();
	$('._e_reg .e_list').html('');

	var $me = $('#register_form');
	$me.find('.error').removeClass('error');

	if ($me.find('#password1').val().length < 3) {
		$me.find('._form_errors._e_register').text('Password length is minimum of 3 characters');
		$me.find('._form_errors._e_register').show();
		$me.find('.loading_icon').hide();
		
		return false;
	} else if ($me.find('#password1').val() != $me.find('#password2').val()) {
		$me.find('._form_errors._e_register').text('Password does not match');
		$me.find('._form_errors._e_register').show();
		$me.find('.loading_icon').hide();

		return false;
	} 

	var json_form_reg = JSON.stringify($me.serializeObject()); 
	console.log('json', json_form_reg);
	
	var $butt = $me.find('input.button');
	$butt.attr('disabled','disabled');
	$me.find('.loading_icon').show();

  $.ajax({
		type: 'POST',
		url: _getGlobals('SERVICE_HOST')+'register',
		contentType: 'application/json; charset=utf-8',
		data: json_form_reg,
		success: function( data ) {
			
			$butt.removeAttr('disabled');
			console.log('regis: ' + data[0]);
			
			if(data[0] && data[0] == 'registered') {
				$('#login_form')[0].reset();
				$('#register_form')[0].reset();
				$.magnificPopup.close();	//	to hide dialog box

				$('.notification.other2').addClass('success');
				$('.notification.other2 p').text('Registration successful. Please sign in.');
				$('.notification.other2').show();
				// location.href = '#welcome';
				// floatingMsg('success',"Welcome to Spaceba, " + data.name + ". Kindly sign in.");
				/* var el = $('#sign-in-dialog');
				$.magnificPopup.open({
					items: {
							src: el,
							type: 'inline'
					},
				}); */
				// $('.sign-in._link').click();

			} else if(data.errors) {
				$.each(data.errors, function(key, data) {
					// console.log('error = ' + data.errors.map((inp) => inp.message));
					console.log('error = ' + data.message);
					var err = 'Sorry error occurred';
					if(data.message == 'email must be unique') {
						err = "Account with this email already exists.";
					}
					
					$me.find('._form_errors._e_register').text(err);
					$me.find('._form_errors._e_register').show();

				})
			} /* else if(data.errors) {
				var errors = new Array();
				$.each(data.errors, function(key, data) {
					errors.push(data)
					
				})
			} */

		},
		error: function(resp, dd, ww) {
			$butt.removeAttr('disabled');
			$me.find('.loading_icon').hide();

			if(resp.responseText) {
				var rp = resp.responseText;
				var rpp = JSON.parse(rp);//.serializeObject();

				$.each(rpp.errors, function(key, data) {
					$me.find('input[name='+key+']').addClass('error');
					$('._e_reg .e_list').append('<li>'+data+'</li>');
					$('._e_reg').show();
					$('._e_reg ._form_errors').show();
				})

				
			//msgBox("Something's wrong with your connection. Please check and try again.","error");
			return;
			}
		}
	}).done(function(){
    $butt.removeAttr('disabled');
		$me.find('.loading_icon').hide();
	});
}

function doLogin() {
	console.log('gbdfnhgb');
	// return false;
	
	$('._form_errors').hide();
	$('._e_login').hide();
	$('._e_login .e_list').html('');

// var json_form_reg = JSON.stringify($('#registration_form').serializeObject()); 
	var $me = $('#login_form');
	$me.find('.error').removeClass('error');
	var json_form_login = JSON.stringify($me.serializeObject()); 
	
	var $butt = $('#login_btn');
	$butt.attr('disabled','disabled');
	$me.find('.loading_icon').show();

  $.ajax({
		type: 'POST',
		url: _getGlobals('SERVICE_HOST')+'login',
		contentType: 'application/json; charset=utf-8',
		data: json_form_login,
		success: function( data ) {

			$butt.removeAttr('disabled');
			$me.find('.loading_icon').hide();

			if(data[0] && data[0] == 'autheticated') {
				
				location.href = '/dashboard';

			} else if(data == 'unauthorized') {
				$me.find('._form_errors._e_login').text('Invalid email/password');
				$me.find('._form_errors._e_login').show();
			}
			
		},
		error: function(resp, dd, ww) {
			if(ww == 'Unauthorized') {
				console.log('failed');
				
				$me.find('._form_errors._e_login').text('Invalid email/password');
				$me.find('._form_errors._e_login').show();
			}
			console.log('error...' + JSON.stringify(resp) + '...' + dd + '...' + ww);
			
			$butt.removeAttr('disabled');
			$me.find('.loading_icon').hide();
		
		}
	}).done(function(){

		$me.find('.loading_icon').hide();
    $butt.removeAttr('disabled');
	});
}

function floatingMsg(type,msg) {
	var $d = $('#floating_msg');
	$d.text(msg);
	$d.removeClass('info, warning, error');
	$d.addClass(type).show();

	var msgTimer = window.setTimeout(() => {
		$d.hide();
	}, 3000);

	$d.on('mouseup', function(){
		clearTimeout(msgTimer);
		$d.hide();
});

}

function ourDate(dt) {
	var trudate = moment(dt,"YYYY-MM-DD hh:mm:ss").fromNow();
	var xdate = '';
	var minn_now = moment().format('mm');
	var minn_then = moment(dt).format('mm');
	var minn_diff = parseInt(minn_now) - parseInt(minn_then);
	var hour_now = moment().format('hh');
	var hour_then = moment(dt).format('hh');
	var hour_diff = parseInt(hour_now) - parseInt(hour_then);
	var day_now = moment().format('DD');
	var day_then = moment(dt).format('DD');
	var day_diff = parseInt(day_now) - parseInt(day_then);
	var month_now = moment().format('MM');
	var month_then = moment(dt).format('MM');
	var month_diff = parseInt(month_now) - parseInt(month_then);

	trud_arr = trudate.split(' ');
	start_word = trud_arr[0];
	start_wordn = parseInt(start_word);
	mid_word = trud_arr[1];
	
	if(mid_word.substr(0,4) == 'hour') {
		if(start_word == 'an') {
			if(minn_diff == 0) return 'Just now';
			else return _s('minute', minn_diff)+' ago';
		} else {
			if(start_wordn > hour_now) return 'Yesterday, ' + moment(dt).format('hh:mm a');
			else if(start_wordn >= 12) return 'Today, ' + moment(dt).format('hh:mm a');
		}
	} else if(mid_word.substr(0,3) == 'day') {
		if(start_word == 'a') return 'Yesterday, ' + moment(dt).format('hh:mm a');
		else if(start_wordn < 7) return moment(dt).format('ddd, hh:mm a');
		else return moment(dt).format('DD MMM, hh:mm a');
		/*else if(start_wordn > day_now ) {	//	we assume difference can't be more than 1, since its still using 'days'
			return 'Last month';
		}*/
	} else if(mid_word.substr(0,5) == 'month') {
		if((start_word == 'a') || (start_wordn < month_now)) return moment(dt).format('DD MMM'); //.format('DD MMM, hh:mm a');
		else return moment(dt).format('DD MMM, YY');
	}//minn = moment(dt).format('YYYY-MM-DD hh:mm:ss');
	//xdate = moment(dt,"YYYY-MM-DD hh:mm:ss").fromNow();
	
	return trudate;
}

$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

function monthsIntervalTillToday(dt,wh) {
	wh = wh.toLowerCase();
	var tod_y = parseInt(moment().format('YYYY'));
	var tod_m = parseInt(moment().format('MM')) - 1; //	end of previous month
	
	var then_y = parseInt(moment(dt).format('YYYY'));
	var then_m = parseInt(moment(dt).format('MM'));
	
	var ydiff = tod_y - then_y;
	var mdiff = tod_m - then_m;
	
	var totdiff;
	
	if(wh=='month') {
		totdiff = (ydiff * 12) + mdiff;
	} else if(wh=='year') {
		totdiff =  Math.floor(((ydiff * 12) + mdiff) / 12);
	}
		
	return (totdiff > 0 ) ? totdiff : '--';

}

function ourDate(dt) {
	var trudate = moment(dt,"YYYY-MM-DD hh:mm:ss").fromNow();
	var xdate = '';
	var minn_now = moment().format('mm');
	var minn_then = moment(dt).format('mm');
	var minn_diff = parseInt(minn_now) - parseInt(minn_then);
	var hour_now = moment().format('hh');
	var hour_then = moment(dt).format('hh');
	var hour_diff = parseInt(hour_now) - parseInt(hour_then);
	var day_now = moment().format('DD');
	var day_then = moment(dt).format('DD');
	var day_diff = parseInt(day_now) - parseInt(day_then);
	var month_now = moment().format('MM');
	var month_then = moment(dt).format('MM');
	var month_diff = parseInt(month_now) - parseInt(month_then);

	trud_arr = trudate.split(' ');
	start_word = trud_arr[0];
	start_wordn = parseInt(start_word);
	mid_word = trud_arr[1];
	
	if(mid_word.substr(0,4) == 'hour') {
		if(start_word == 'an') {
			if(minn_diff == 0) return 'Just now';
			else return _s('minute', minn_diff)+' ago';
		} else {
			if(start_wordn > hour_now) return 'Yesterday, ' + moment(dt).format('hh:mm a');
			else if(start_wordn >= 12) return 'Today, ' + moment(dt).format('hh:mm a');
		}
	} else if(mid_word.substr(0,3) == 'day') {
		if(start_word == 'a') return 'Yesterday, ' + moment(dt).format('hh:mm a');
		else if(start_wordn < 7) return moment(dt).format('ddd, hh:mm a');
		else return moment(dt).format('DD MMM, hh:mm a');
		/*else if(start_wordn > day_now ) {	//	we assume difference can't be more than 1, since its still using 'days'
			return 'Last month';
		}*/
	} else if(mid_word.substr(0,5) == 'month') {
		if((start_word == 'a') || (start_wordn < month_now)) return moment(dt).format('DD MMM'); //.format('DD MMM, hh:mm a');
		else return moment(dt).format('DD MMM, YY');
	}//minn = moment(dt).format('YYYY-MM-DD hh:mm:ss');
	//xdate = moment(dt,"YYYY-MM-DD hh:mm:ss").fromNow();
	
	return trudate;
}

function getNewExpiryDate(oldd, intv, perd) {
	var arr = [
				moment(oldd).add(intv, perd+'s').format('YYYY-MM-DD'),
				moment(oldd).add(intv, perd+'s').format('Do MMM YYYY')
			 ];
	
	return arr;
}

function formatMyNumber(num, curr) {
	nnum = num.toString().split(',');
	num = '';
	for(var i=0;i<nnum.length;i++) {
		num += nnum[0];
	}
	return (curr || '') + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toShortTime(date) {
	var str = date.toString().split(' ');
	//var arr = 
	return str[0]+', '+str[1]+' '+str[2]+' '+str[3]+' '+str[4];
}

function toLocalTime(utc) {
	var date = new Date(utc);
	var str = date.toString().split(' ');
	return str[0]+', '+str[1]+' '+str[2]+' '+str[3]+' '+str[4];
}

function _s(str,intg) {
	if(intg == 1) return intg + ' ' + str;
	else return intg + ' ' + str + 's';
}

function _ys(str,intg) {
	if(intg == 1) return intg + ' ' + str;
	else return intg + ' ' + str.substr(0,str.length-1) + 'ies';
}

function _mod(numer,denom) {
	var intt = Math.floor(numer / denom);
	return (numer - intt); 
}

