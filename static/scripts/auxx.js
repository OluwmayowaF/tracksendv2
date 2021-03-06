// import EmojiButton from '@joeattardi/emoji-button';
// import { json, JSON } from "sequelize/types";

// JavaScript Document
//var SERVICE_HOST = "http://localhost/directory/services/";


var _getGlobals = {
	SERVICE_HOST : "/api/",
	SMS_SIZE_MSG1 : 160,
	SMS_SIZE_MSG2 : 150,
	SMS_SIZE_MSG3 : 150,
	SMS_SIZE_MSG4 : 150,
	editable_node: null,
	editable_sel: null,
	editable_range: null,
	editable_start: null,
	// editable_position: 0,
	// editable_offset: null,

	performanceCampaignSelectedCriteria: [],
};

/* $.validator.setDefaults({
	ignore: ":hidden:not(.chosen-select)"
}) */
 
$(document).ready(function() {
	var campaign_confirmed = false;
	var sms_campaign = false;
	var whatsapp_campaign = false;
	var _campaign_options_checked_count = 0;

	// navigator.geolocation.getCurrentPosition(positionSuccess, positionFailure, { enableHighAccuracy: true });
	function positionSuccess(position) {
		console.log('====================================');
		console.log('POSITION: ' + JSON.stringify(position));
		console.log('====================================');
	}
	function positionFailure(error) {
		console.log('====================================');
		console.log('POSITION error: ' + JSON.stringify(error.code));
		console.log('====================================');
	}

	if($('#_date_picker').length) {
		console.log('DATE PICKING...');
		console.log('TYPE = ' + $('#_date_picker').attr('type'));
	}
	/* $.ajax({
		type: 'GET',
		url: 'https://ipinfo.io?token=d79a26c84fa03a',
		contentType: 'application/json; charset=utf-8',
		// data: json_form_reg,
		success: function( data ) {
			console.log('====================================');
			console.log('RESPONSE TO URL = ' + JSON.stringify(data));
			console.log('====================================');

		},
		error: function(resp, dd, ww) {
			console.log('====================================');
			console.log('RESPONSE TO URL = ' + JSON.stringify(resp));
			console.log('====================================');

		}
	}).done(function(){
			console.log('====================================');
			console.log('RESPONSE TO URL = DONE');
			console.log('====================================');
	}); */

	/* try {
		createBox('place_it_here', 'GGGk4XndliwBmnFbC5ukOfx78Fgpwvlk');
	} catch(e) {
		console.log("Tracksend Box Error: " + e);
	} */

	$('form').submit((e) => {
		// if($(e.target).find('span.loading_icon').is(':visible')) return false;
		$(this).find('span.loading_icon').show();

	})

	// const picker = new EmojiButton();
	// $('.editable_div').on('blur', function (e) {
	// $('#wa_contenteditable').on('keyup mouseup', function (e) {
	$('.editable_div').on('blur keyup mouseup', function (e) {
		e.preventDefault();

		// console.log('11111111111111');

		
		setGetSelectionThings('editable_div');
		/* let parent_node_class = 'editable_div';
		let editable_sel = window.getSelection();
		let editable_range = editable_sel.getRangeAt(0);
		let editable_node = editable_range.startContainer;
		console.log('====================================');
		console.log('node = ' + editable_node.nodeValue + ' | ' + editable_node.nodeType + ' | parentnode_id = ' + editable_node.parentElement.id + ' | parentnode_class = ' + editable_node.parentElement.className);
		console.log('====================================');

		//	check if getSelection is working from proper node
		if(editable_node.parentElement.className.indexOf(parent_node_class) == -1) return;

		_getGlobals.editable_sel = editable_sel;// = window.getSelection();
		_getGlobals.editable_range = editable_range;// = _getGlobals.editable_sel.getRangeAt(0);
		_getGlobals.editable_node = editable_node;// = _getGlobals.editable_range.startContainer;
		_getGlobals.editable_start = _getGlobals.editable_range.startOffset;
	
		return true; */
		/* var el = document.getElementById('wa_contenteditable');
		let p = getCaretPosition(el);
		// _getGlobals.editable_position = p[1];
		_getGlobals.editable_node = p[0];
		_getGlobals.editable_offset = p[1];
		console.log('position = ' + _getGlobals.editable_position); 
		// var el = $(e.target)[0];
		/* var el = document.getElementById('wa_contenteditable');
		
		console.log('====================================');
		console.log('...leaving me...' + $(el.childNodes[0]).prop('selectionStart') + '; nodes = ' + el.childNodes.length);
		console.log('====================================');
		return true;
		// node_walk: walk the element tree, stop when func(node) returns false 
		/* function node_walk(node, func) { 
			var result = func(node); 
			for(node = node.firstChild; result !== false && node; node = node.nextSibling) 
				result = node_walk(node, func); 
			return result; 
		}; // getCaretPosition: return [start, end] as offsets to elem.textContent that 
		// correspond to the selected portion of text 
		// (if start == end, caret is at given position and no text is selected) 
		/* function getCaretPosition(elem) { 
			var sel = window.getSelection(); 
			var cum_length = [0, 0]; 
			if(sel.anchorNode == elem) {
				cum_length = [sel.anchorOffset, sel.focusOffset]; //extentOffset
			} 	else { 
				var nodes_to_find = [sel.anchorNode, sel.focusNode]; //extentNode
				if(!elem.contains(sel.anchorNode) || !elem.contains(sel.focusNode)) //extentNode
				// if(0) {
				{
					console.log('return null');
				
					// return 'undefined'; 
					return [null,0]; 
				} else { 
					var found = [0,0]; 
					var i; 
					node_walk(elem, function(node) { 
						for(i = 0; i < 2; i++) { 
							if(node == nodes_to_find[i]) { 
								found[i] = true; 
								if(found[i == 0 ? 1 : 0]) 
								console.log('return false');
								
								return false; 
								// return [null,0];
								// all done 
							} 
						} 
						if(node.textContent && !node.firstChild) { 
							for(i = 0; i < 2; i++) { 
								if(!found[i]) 
									cum_length[i] += node.textContent.length; 
							} 
						} 
					}); 
					cum_length[0] += sel.anchorOffset; 
					cum_length[1] += sel.focusOffset; //extentOffset
					// console.log('node is : ' + JSON.stringify(sel.focusNode));
					
				} 
			} 
			if(cum_length[0] <= cum_length[1]) {
				// return cum_length; 
				return [sel.focusNode, sel.focusOffset]; 
			}
			console.log('nodetype is : ' + sel.focusNode.nodeType + 'nodevalue is : ' + sel.focusNode.nodeValue + 'nodeoffset is : ' + sel.focusOffset);
			sel.focusNode.nodeValue = 'yeye';
			console.log('nodetype is : ' + sel.focusNode.nodeType + 'nodevalue is : ' + sel.focusNode.nodeValue + 'nodeoffset is : ' + sel.focusOffset);
			return [sel.focusNode, sel.focusOffset];
			// return [cum_length[1], cum_length[0]]; 
		} */
	})

	$('#new_contact_form, #csv_upload_form').submit(function (e) {
		$('._form_errors._e_consent').hide();
		$('._form_errors._e_consent').text('');
		$('._errorable').css('color', 'inherit');
		
		if(!$('#have_consent').is(':checked')) {
			$('._errorable').css('color', 'red');
			$('._form_errors._e_consent').text('You are only allowed to add contacts who have given you consent to send them messages.');
			$('._form_errors._e_consent').show();
			$(this).find('span.loading_icon').hide();

			return false;
		} 
		return true;
	})

	$('.editable_div._sms').on('keyup', (e) => {
		/* if(e.shiftKey){ //enter && shift
			e.preventDefault(); //Prevent default browser behavior
			console.log('====================================');
			console.log('sdasdads');
			console.log('====================================');
	}		//$(e.target).html($(e.target).html().replace(/<br>$/g, ' '));
		$(e.target)[0].selectionStart = $(e.target)[0].selectionEnd = $(e.target).val().length; */
		var $we = $(e.target).closest('._collection')

		countChars($we);
	} );

	/* $('#to_optin, #to_awoptin').on('change', (e) => {
		$we = $(e.target);
		$it = $we.closest('.col-md-12');

		if($we.is(':checked')) {
			++_campaign_options_checked_count;
			
			$it.find('.switch input').removeAttr('disabled');

			if(_campaign_options_checked_count == 2) {
				$it.closest('._campaign_options').find('.switch').each((i, el) => {
					if($(el).find('input').is(':checked')) $(el).find('.slider.round').click();
					if($(el).find('input').is(':checked')) $(el).find('.slider.round').click();
				})
				$it.closest('._campaign_options').find('.switch input').attr('disabled', 'disable');//.each((i, el) => {
			} else {
					console.log('founder');
			}
		} else {
			--_campaign_options_checked_count;
			$we.closest('._campaign_options').find('#to_optin, #to_awoptin').each((i, el) => {
				if($(el).is(':checked')) $(el).closest('.col-md-12').find('.switch input').removeAttr('disabled');
			})

			$it.find('.switch input').attr('disabled', 'disable');
			if($it.find('.switch input').is(':checked')) $it.find('.slider.round').click();
		}
	}); */

	$('.add_optout #add_optout, .add_optin #add_optin').on('change', (e) => {
		var $we = $(e.target).closest('._collection')
		countChars($we);
	});

	/* if($('._followup_campaign._1 .chk_followup').is(':checked')) {
		$('._followup_campaign._1 .chk_followup').parent().click();
		$('._followup_campaign._2').show();
	} 
	if($('._followup_campaign._2 .chk_followup').is(':checked')) {
		$('._followup_campaign._2').show();
		$('._followup_campaign._2 .chk_followup').parent().click();
		$('._followup_campaign._3').show();
	}
	if($('._followup_campaign._3 .chk_followup').is(':checked')) {
		$('._followup_campaign._3').show();
		$('._followup_campaign._3 .chk_followup').parent().click();
		$('._followup_campaign._4').show();
	}
	if($('._followup_campaign._4 .chk_followup').is(':checked')) {
		$('._followup_campaign._4').show();
		$('._followup_campaign._4 .chk_followup').parent().click();
	} */

	(function newCampaignFollowupCheckBoxEvents() {

		$('._followup_campaign .chk_followup').off('change');
		$('._followup_campaign .chk_followup').on('change', function(e) {
			let $new;
			let cumm = parseInt($('#followup_campaign_cumm').val()) + 1;
			console.log('__changed__');

			let $cpgnhtml = $('<div class="_followup_campaign _' + cumm + ' _collection" style="margin-top: 20px;"><hr><input type="hidden" data-name="analysis_id" id="analysis_id" value="0"><div class="trigger"><div class="col-lg-12  checkboxes toggle active"><input id="chk_followup' + cumm + '" class="chk_followup" type="checkbox" name="chk_followup"><label for="chk_followup' + cumm + '" style="width: 100%;">Create <b>Follow-Up</b> Campaign</label></div></div><div class="clearfix"></div></div>');

			let $tg = $(e.target);
			if($tg.is(':checked')) {
				console.log('__checked__');
				let $cpgn_ = $tg.closest('._followup_campaign');
				let $cpgn = $cpgn_.find('.toggle-container');
				$cpgn_.find('.trigger .checkboxes label').append('<span> [uncheck to remove follow-up campaign]</span>');

				$cpgn.show(function() {		//	callback after show comlpletes
					$cpgn.find('.chosen-select-no-single').each(function(i, el) {
						$(el).chosen("destroy");
					})

					let $nxt = $cpgn.clone();
					$cpgnhtml.insertAfter($cpgn_);

					$new = $('.all_campaigns ._followup_campaign._' + cumm);
					$nxt.insertAfter($new.find('.trigger'));

					// $new.find('._sel_contact_group').attr('id', 'sel_contact_group'+cumm);
					// $new.find('._sel_sender_id').attr('id', 'sel_sender_id'+cumm);
					// $new.find('._sel_short_url').attr('id', 'sel_short_url'+cumm);

					$('._followup_campaign .chosen-select-no-single').each(function(i, el) {
						console.log('chosen-here-'+i);
						$(el).chosen({
							disable_search_threshold: 4,
						});
					})

					$new.find('.toggle-container').hide();

					$cpgn_.find('[data-name]').each(function(i, el) {
						console.log('data-name='+$(el).attr('data-name'));
						
						$(el).attr('name', $(el).attr('data-name'));
					})

					$('#followup_campaign_cumm').val(cumm);

					newCampaignFollowupCheckBoxEvents();

				});


			} else {

				let count = $('.all_campaigns ._followup_campaign').length;
				if(count > 1) {
					$tg.closest('._followup_campaign').remove();

					$('.notification.other3').removeClass('success error').addClass('success');
					$('.notification.other3 p').text('Follow-up removed.');
					$('.notification.other3').css('opacity',100);
					$('.notification.other3').show();
					setTimeout(() => {
						$('.notification.other3').hide('fade');
						$('.notification.other3 p').text('');
						$('.notification.other3').removeClass('success error');
					}, 2000);
					
				} else {
					let $cpgn = $tg.closest('._followup_campaign');

					$cpgn.find('[data-name]').each(function(i, el) {
						console.log('data-name='+$(el).attr('data-name'));
						
						$(el).removeAttr('name');
					})
					$cpgn.hide();
				}

				console.log('__unchecked__');
				
			}
			
		});

		$('.compose_options_box > li').off('click');
		$('.compose_options_box > li').on('click', function(e) {
	
			var $wh = $(this);
			var $we = $wh.closest('._collection');
			var inp = $wh.attr('class');
			// if(inp != 'ch-url') return;
			console.log('you selected: ' + $(e.target).attr('class'));
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
					t = 'url';
					id = 'url-in';
					
					if(!($we.find('#sel_short_url').val() > 0)) {
						alert('Please select the Short URL to insert from above.');
						return false;
					}
	
					$we.find('.add_utm').show('fade');
					
					break;
				case 'ch-emoji':
					t = 'emoji';
					id = 'emj-in';
					
					$we.find('#emoji_list').toggle();
					// picker.pickerVisible ? picker.hidePicker() : picker.showPicker();
			}
	
			inp = $wh.attr('id');
			if(id == null) {
	
				if(inp == 'clr_msg_butt') {
					if(window.confirm('Clear message?')) {
						$we.find('.editable_div').html('').focus();
						countChars($we);
					}
					return;
				}
	
				let wha = ($(this).attr('id') == 'add_img_butt') ? 'image' : 'video';
				let whb = ($(this).attr('id') == 'add_img_butt') ? 'im-icon-Photo' : 'im-icon-Video-4';
				let init = ($('.content_attachments input').length == 0) ? true : false;
				$we.find('.content_attachments').html('<input type="file" name="att_file" id="att_file" accept="'+ wha +'/*" hidden>');
	
				$we.find('.content_attachments #att_file').click(() => {
					$we.find('.content_attachments #att_file').change(() => {
						if($we.find('.content_attachments #att_file').val()) {
							// $('.content_attachments').html('<input type="file" name="att_file" id="att_file" accept="'+ wha +'/*" hidden>');
							console.log('file = ' + $we.find('.content_attachments #att_file').val());
							
							$we.find('.content_attachments').css('display','flex');
							$we.find('.content_attachments').append('Attachment: <i class="im '+ whb +'" style="font-size:2em;margin: 0 5px;"></i> <span class="att_file_name">' + $we.find('.content_attachments #att_file').val() + '</span> [ <span id="remove_attachment" style="color:red;color:red;font-size:0.7em;cursor:pointer"> remove </span> ]');
	
							$we.find('#remove_attachment').click(() => {
								console.log('GO!');
								
								$we.find('.content_attachments').hide();
								$we.find('.content_attachments').html('');
							})
						} else {
							console.log('NO-FILE');
							
							$we.find('.content_attachments').html('');
						}
					})
				});
				$we.find('.content_attachments #att_file').click();
				
				/* $('#att_img, #att_vid').off('change');
				$('#att_img, #att_vid').on('change', () => {
					if($('#att_img, #att_vid').val()) {
						$('.content_attachments').show(); 
						console.log('id = ' + $(this).attr('id'));
						 
					}
				}) */
	
				switch(inp) {
					case 'add_img_butt':
						// $('#att_img').click();
						$we.find('.editable_div').focus();
						break;
					case 'add_vid_butt':
						// $('#att_vid').click();
						$we.find('.editable_div').focus();
						break;
				}
			} else {
	
					if(t != 'emoji') insertText(id, 'arg', t, 'span');
					countChars($we);
			}
		})
		
		$('.chk_followup').on('click', (e) => {
			e.stopPropagation();
		})
	})()


	/* 

	$('._followup_campaign._1 .chk_followup').on('change', (e) => {
		if($(e.target).is(':checked')) {
			$('._followup_campaign._2').show()
		} else {
			if(!$('._followup_campaign._2 .chk_followup').is(':checked')) $('._followup_campaign._2').hide()
		}
	})
	$('._followup_campaign._2 .chk_followup').on('change', (e) => {
		if($(e.target).is(':checked')) {
			$('._followup_campaign._3').show()
		} else {
			if(!$('._followup_campaign._3 .chk_followup').is(':checked')) $('._followup_campaign._3').hide()
		}
	})
	$('._followup_campaign._3 .chk_followup').on('change', (e) => {
		if($(e.target).is(':checked')) {
			$('._followup_campaign._4').show()
		} else {
			if(!$('._followup_campaign._4 .chk_followup').is(':checked')) $('._followup_campaign._4').hide()
		}
	}) */

	//	FOR CALCULATION OF TOPUPS 
	var topupbands = [];
	$('.rates_list div._rates').each(function (i, el) {
		
		$w = $(el);
		topupbands.push([
			$w.find('._rates_amt').val(),
			$w.find('._rates_lwr').val(),
			$w.find('._rates_upr').val(),
		])
	})
		console.log('q: ' + JSON.stringify(topupbands));
	//	...end

	function countChars($ww) {	//	note that 'e' argument is not to be used, as this refers to divergent types of objects
		var $we = $ww.find('.editable_div._sms');
		var $sw1 = $ww.find('.add_optout #add_optout');
		var $sw2 = $ww.find('.add_optin #add_optin');
		var sp = $we.find('span.arg').length;
		var ch = 0;
		var msgs = 0;
		var $q = $we;
		var arr = [];


		//	count chars 
		if(sp > 0) {
			var $dd = $ww.find('.editable_div._sms').clone();
			$dd.find('span.arg').remove();
			ch = $dd.text().length  + (sp * 15);

			// console.log('with sp = ' + sp + '; alls = ' + ch);

			
		} else {
			// $we.html($we.text());
			ch = $we.text().length;
			console.log('no sp; alls = ' + ch);
		} 

		if($sw1.is(':checked')) {
			ch += 30;
		}
		if($sw2.is(':checked')) {
			ch += 30;
		}

		//	count msgs
		if(ch <= _getGlobals.SMS_SIZE_MSG1) {
			msgs = 1;
		} else if(ch <= (_getGlobals.SMS_SIZE_MSG1 + _getGlobals.SMS_SIZE_MSG2)) {
			msgs = 2;
		} else if(ch <= (_getGlobals.SMS_SIZE_MSG1 + _getGlobals.SMS_SIZE_MSG2 + _getGlobals.SMS_SIZE_MSG3)) {
			msgs = 3;
		} else if(ch <= (_getGlobals.SMS_SIZE_MSG1 + _getGlobals.SMS_SIZE_MSG2 + _getGlobals.SMS_SIZE_MSG3 + _getGlobals.SMS_SIZE_MSG4)) {
			msgs = 4;
		} else {
			alert('Maximum charaters reached.');
			return false;
		}
		
		$ww.find('#msg_char_count').text(ch + (sp > 0? ' (est.)' : ''));
		$ww.find('#msg_count').text(msgs);
		
	}

	/* $('form').submit(function(e) {
		$(e.target).find('.loading_icon').show();
	}) */
	
	/* datepickerDefault = new MtrDatepicker({
			target: "scheduler_div",
	}); */
	/* if($('#datepicker').length) $('#datepicker').datetimepicker({
		// inline: true,
		// sideBySide: true
		collapse: true
	}).on('dp.change', function (e) {
		// alert(e.timeStamp);
		console.log('TM: ' + JSON.stringify(e));
		
		// $('#schedule').val(e.timeStamp);
	});
	if($('#datepickerwa').length) $('#datepickerwa').datetimepicker({
		// inline: true,
		// sideBySide: true
		collapse: true
	}).on('dp.change', function (e) {
		// alert(e.timeStamp);
		console.log('TM: ' + JSON.stringify(e));
		
		// $('#schedule').val(e.timeStamp);
	}); */
  
  $('#new_contact_group').on('change', function(e) {
    if($(this).val() == -1) {
      console.log('hehe');
      
      $('#_new_group_info').find('input[name="name"]').attr('required','required');
      $('#_new_group_info').show()
    } else {
			console.log('popo'+$(e.target).val());
      
      $('#_new_group_info').hide()
      $('#_new_group_info').find('input[name="name"]').removeAttr('required');
    }
  })

	$('.ch-emoji #emoji_list li').on('click', function (e) {
		console.log('emoji = ' + $(this).text());
		
		let txt = $(this).text().replace('&#', '0');
		console.log('====================================');
		console.log('SDASD = ' + txt);
		console.log('====================================');
		// insertText(null, null, String.fromCodePoint(txt), 'emoji');
		insertText(null, null, txt, 'emoji');

	})

	$('.create_short_url_btn').on('click', function (e) {

		var $we = $(this);
		var url = encodeURIComponent($('#long_url_link').val());
		
		if(url.length < 5) {
			alert('Kindly enter valid Link');
			return false;
		}

		$we.closest('div').find('.loading_icon').show();
		
		$s_ = $('#_edit_span');
		$t_ = $('#_edit_text');

		if($t_.is(':visible') && $t_.val() != '') {
			$s_.text($t_.val());
		}
		$t_.hide();
		$s_.show();

		var urlid = '&id=' + $('#shorturlid').val();
		
		$.ajax({
			type: 'GET',
			url: _getGlobals.SERVICE_HOST+'generateurl'+'?url='+url+urlid,
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

				$we.closest('div').find('.loading_icon').hide();

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
				$we.closest('div').find('.loading_icon').hide();
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

		var $s_ = $('#_edit_span');
		var $t_ = $('#_edit_text');

		if($s_.is(':visible')) {
			$t_.val($s_.text());
			$s_.hide();
			$t_.show();

			$('._editing').hide('fade');
			$('._afteredit').show('fade');
		} 

		// $('.short_url_box ._editable').attr('contenteditable', 'true');
		$('.short_url_box ._editable').removeAttr('readonly');
		// $('.short_url_box').text($('.short_url_box').text() + '/').focus();
		$('.short_url_box ._editable').focus();

		$('._afteredit .do_lnk_btn').click(function (e) {
			let tt = $t_.val();
			if(tt.length < 3) {
				alert('Kindly enter at least 3 characters.');
			} else if(tt.search(/[a-zA-Z]/g) == -1) {
				alert('Custom entry must contain at least one alphabet.' + tt.search(/[a-zA-Z]/g));
			} else {
				$.ajax({
					type: 'GET',
					url: _getGlobals.SERVICE_HOST+'savecustomoptinlink'+'?url='+tt,
					contentType: 'application/json; charset=utf-8',
					// data: json_form_reg,
					success: function( data ) {
		
						if(data.status == 'PASS') {
							$s_.text($t_.val());
							$('.notification.other3').removeClass('success error').addClass('success');
							$('.notification.other3 p').text('Link updated.');
							$('.notification.other3').css('opacity',100);
							$('.notification.other3').show();
							
							$t_.hide();
							$s_.show();

							$('._afteredit').hide('fade');				
							$('._editing').show('fade');
						} else if(data.status == 'FAIL') {
							$('.notification.other3').removeClass('success error').addClass('error');
							$('.notification.other3 p').text(data.msg);
							$('.notification.other3').css('opacity',100);
							$('.notification.other3').show();							
						}

					},
					error: function(resp, dd, ww) {
						$('.notification.other3').removeClass('success error').addClass('error');
						$('.notification.other3 p').text('Error occured. Please check your connection and try again later.');
						$('.notification.other3').css('opacity',100);
						$('.notification.other3').show();

					}
				}).done(function(){

					// $butt.removeAttr('disabled');
					// $butt.closest('div').find('.loading_icon').hide();
				});
						
			}
		})

		$('._afteredit .cls_lnk_btn').click(function (e) {
			$t_.hide();
			$s_.show();

			$('._afteredit').hide('fade');				
			$('._editing').show('fade');
		})

	})

	$('._editing .reset_url_btn').click(function (e) {

		if(!confirm('Reset Link?')) return;

		$.ajax({
			type: 'GET',
			url: _getGlobals.SERVICE_HOST+'savecustomoptinlink?reset=true',
			contentType: 'application/json; charset=utf-8',
			// data: json_form_reg,
			success: function( data ) {

				if(data.status == 'PASS') {
					let $s_ = $('#_edit_span');
					let $t_ = $('#_edit_text');
					$s_.text(data.msg);
					$('.notification.other3').removeClass('success error').addClass('success');
					$('.notification.other3 p').text('Link updated.');
					$('.notification.other3').css('opacity',100);
					$('.notification.other3').show();
				} else if(data.status == 'FAIL') {
					$('.notification.other3').removeClass('success error').addClass('error');
					$('.notification.other3 p').text(data.msg);
					$('.notification.other3').css('opacity',100);
					$('.notification.other3').show();							
				}

			},
			error: function(resp, dd, ww) {
				$('.notification.other3').removeClass('success error').addClass('error');
				$('.notification.other3 p').text('Error occured. Please check your connection and try again later.');
				$('.notification.other3').css('opacity',100);
				$('.notification.other3').show();

			}
		}).done(function(){

			// $butt.removeAttr('disabled');
			// $butt.closest('div').find('.loading_icon').hide();
		});
					
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
			
			if(t != 'emoji') insertText(id, 'arg', t, 'span');
		}

		$.magnificPopup.close();
	})

	$('.campaign_summary_btn').on('click', function(e) {

		$.magnificPopup.close();;

		if($(this).hasClass('send')) {
			campaign_confirmed = true;
			$('#campaign_form_sms').submit();
			$('.activity_status').text('Sending...').show();
		}

	})

	//	re-examine usefulness for whatsapp campagns if necessary
	/* $('.campaign_send_btn').on('click', function(e) {

		campaign_confirmed = true;
		if($('#analyseperf_btn').length) { whatsapp_campaign = false; sms_campaign = true; }

		$(this).closest('form').submit();
		$(this).closest('form').find('.activity_status').text('Sending...').show();
		$(this).closest('div').find('.loading_icon').show();

	}) */

	$('.campaigntypes form').submit(function (e) {		//	 FOR NOW, THIS WORKS FOR BOTH NORMAL AND PERFORMANCE CAMPAIGNS
		// e.preventDefault();

		var $me = $(this);
		if($('#analyseperf_btn').length) {
			var N_CMPGN = false, P_CMPGN = true;
			console.log('true p_cmpgn');
			var $butt = $me.find('#analyseperf_btn');
			var apiadd = 'analyseperfcampaign';
			campaign_confirmed = true;
		} else {
			var N_CMPGN = true, P_CMPGN = false;
			var $butt = $me.find('#analyse_btn');
			var apiadd = 'analysecampaign';
		}
		
		$butt.closest('div').find('.loading_icon').show();

		console.log('====================================');
		console.log('sending...');
		console.log('====================================');

		// validate the Campaign
		// if(!validateAndSendCampaign()) return false;

		//	check if it's not a whatsapp campaign
		console.log('1...campaign_confirmed: ', campaign_confirmed, '; whatsapp_campaign: ', whatsapp_campaign, '; N_CMPGN: ', N_CMPGN, '; P_CMPGN: ', P_CMPGN);
		if (campaign_confirmed && !whatsapp_campaign && N_CMPGN) return true;
		console.log('1sending...');
		
		$('#analysis-box .followup_su').hide();
		$butt.closest('div').find('.activity_status').text('Analyzing...');
		console.log('2...campaign_confirmed: ', campaign_confirmed, '; whatsapp_campaign: ', whatsapp_campaign, '; N_CMPGN: ', N_CMPGN, '; P_CMPGN: ', P_CMPGN);
		console.log('2a...datepicker: ', $me.find('#datepicker').val());

		let w = moment($me.find('#datepicker').val(), 'YYYY-MM-DDTHH:mm').format('YYYY-MM-DD HH:mm:ss Z');
		let wwa = moment($me.find('#datepickerwa').val(), 'MM/DD/YYYY h:mm A').format('YYYY-MM-DD HH:mm:ss Z');
		$me.find('#schedule').val(moment.utc(w, 'YYYY-MM-DD HH:mm:ss Z').format('YYYY-MM-DD HH:mm:ss'));
		$me.find('#schedulewa').val(moment.utc(wwa, 'YYYY-MM-DD HH:mm:ss Z').format('YYYY-MM-DD HH:mm:ss'));
		// $('#datepicker').val();

		var json_campaign_add = JSON.stringify($me.serializeObject()); 
		console.log('====================================');
		console.log('ALL FORM: ' + json_campaign_add);
		console.log('====================================');
		console.log('3...campaign_confirmed: ', campaign_confirmed, '; whatsapp_campaign: ', whatsapp_campaign, '; N_CMPGN: ', N_CMPGN, '; P_CMPGN: ', P_CMPGN);
		//	check if it's a whatsapp campaign
		if (campaign_confirmed && (whatsapp_campaign || P_CMPGN)) return true;
		console.log('2sending...');
		console.log('4...campaign_confirmed: ', campaign_confirmed, '; whatsapp_campaign: ', whatsapp_campaign, '; N_CMPGN: ', N_CMPGN, '; P_CMPGN: ', P_CMPGN);

		// $me = $('#campaign_form');
		

		$.ajax({
			type: 'POST',
			url: _getGlobals.SERVICE_HOST + apiadd,
			contentType: 'application/json',
			data: json_campaign_add,
				// data: json_form_reg,
			success: function( data ) {

				console.log(data);
				if(data.responseType == "SUCCESS") {
					let data_ = data.response;

					/* data.tmpid.forEach(id => {
						
					}); */



					$('._main_campaign #analysis_id').val(data_.tmpid[0]);

					$('._followup_campaign .chk_followup:checked').each(function(i, el) {
						$(el).closest('._followup_campaign').find('#analysis_id').val(data_.tmpid[i + 1])
					})

					var tot = 0;
					var len = data_.tmpid.length;
					let $bo = $('#analysis-box .sign-in-form');
					$bo.html('');

					$('.all_campaigns ._collection').each(function(i, el) {
						// $bo.show();
						if(i >= len) return;

						let cpm_summary_title 	= (i === 0) ? "Main Campaign" : "Follow-Up Campaign " + i;
						let cpm_summary_name 		= (i === 0) ? $(el).find('#campaign_name').val() : "";
						let cpm_summary_sender 	= $(el).find('._sel_sender_id option:selected').text();
						let cpm_summary_msg 		=	sanitizeMsg($(el), true);
						let cpm_summary_to 			=	$(el).find('._sel_contact_group option:selected').text();
						let cpm_summary_recp 		=	data_.contactcount.counts[i] + (i > 0 ? ' (est.)' : '');
						let cpm_summary_count 	= data_.msgcount.counts[i] + (i > 0 ? ' (est.)' : '');
						let cpm_summary_avg 		=	(parseInt(data_.contactcount.counts[i]) > 0) ? (parseInt(data_.msgcount.counts[i])/parseInt(data_.contactcount.counts[i])) + (i > 0 ? ' (est.)' : '') : '--';
						let cpm_units_chrg 			=	data_.units.counts[i] + (i > 0 ? ' (est.)' : '');

						let $su = $('<div class="_su"><div class="trigger"><div class="col-lg-12 toggle active _hdr">' + cpm_summary_title + '</div></div><div class="col-lg-12 toggle-container" style="display: none"><div class="row with-forms">' + ((i === 0) ? '<div class="col-md-12"><h5>Campaign Name: </h5><span id="cpm_summary_name">' + cpm_summary_name + '</span></div>' : '') + '<div class="col-md-12"><h5>Sender ID: </h5><span id="cpm_summary_sender">' + cpm_summary_sender + '</span></div><div class="col-md-12"><h5>Message: </h5><span id="cpm_summary_msg">' + cpm_summary_msg + '</span></div><div class="col-md-12"><h5>To: </h5><span id="cpm_summary_to">' + cpm_summary_to + '</span></div><div class="col-md-12"><h5>Send Time: </h5><span id="cpm_summary_time">Immediately</span></div><div class="col-md-12 sepr"></div><div class="col-md-12"><h5>Number of Recipients: </h5><span id="cpm_summary_recp">' + cpm_summary_recp + '</span></div><div class="col-md-12"><h5>Total Messages: </h5><span id="cpm_summary_count">' + cpm_summary_count + '</span></div><div class="col-md-12"><h5>Average Message(s) per Recipient: </h5><span id="cpm_summary_avg">' + cpm_summary_avg + '</span></div><div class="col-md-12"><h5>Total Units Charge: </h5><span id="cpm_units_chrg" style="font-weight: bold">' + cpm_units_chrg + '</span></div><div class="col-md-12 sepr"></div></div></div><div class="clearfix"></div></div>')
						
						$bo.append($su);
						tot += data_.contactcount.counts[i];
						
					})
					
					let cpm_summary_recp 	= tot + (len > 1 ? ' (est.)' : '') + (data_.invalidphones > 0 ? ' <span style="display: inline;font-size: 0.85em;color: #ff4a21;"> * invalid: ' + data_.invalidphones + ' *</spa>' : '');
					let cpm_summary_count = data_.msgcount.acc + (len > 1 ? ' (est.)' : '');
					let cpm_units_chrg 		= data_.units.acc + (len > 1 ? ' (est.)' : '');

					let $sutt = '<div class="su_totals" style="background-color: #bae7ec;margin-top: 5px;"><div class="row with-forms"><div style="text-align: center;padding: 5px;font-weight: bold;background-color: #85ccd2;color: #444;border-bottom: solid white 1px;">Totals</div><div class="col-md-12"><h5>Number of Recipients: </h5><span id="cpm_summary_recp">' + cpm_summary_recp + '</span></div><div class="col-md-12"><h5>Total Messages: </h5><span id="cpm_summary_count">' + cpm_summary_count + '</span></div><div class="col-md-12"><h5>Total Units Charge: </h5><span id="cpm_units_chrg" style="font-weight: bold">' + cpm_units_chrg + '</span></div><div class="col-md-12 sepr"></div><div class="col-md-12"><h5>Available Balance: </h5><span id="cpm_units_balance" style="font-weight: bold">--</span></div></div></div>';

					$bo.append($sutt);
					
					var bal, noc;
					if(data_.units.acc > data_.balance) {
						bal = '<span style="color: red">' + data_.balance + ' (INSUFFICIENT) </span>';
						
						$('.campaign_summary_btn.send').hide();
					} else if(tot == 0) {
						bal = data_.balance;
						// noc = '<span style="color: red">' + data_.contactcount + ' (NO CONTACTS ADDED) </span>';
						noc = '<span style="color: red"> (NO CONTACTS ADDED) </span>';
						$('#analysis-box #cpm_summary_recp').html(noc);
						$('#analysis-box #cpm_summary_avg').text('--');
						$('#analysis-box .su_totals #cpm_summary_recp').html(noc);
						$('#analysis-box .su_totals #cpm_summary_avg').text('--');
						$('.campaign_summary_btn.send').hide();
					} else {
						bal = data_.balance;
						$('.campaign_summary_btn.send').show(); 
					}

					$('#analysis-box #cpm_units_balance').html(bal);

					$('#click_analysis_box').click();

					$butt.closest('div').find('.loading_icon').hide();
					$butt.closest('div').find('.activity_status').text('');

					$('#analysis-box .trigger').click(function(e) {
						e.stopPropagation()
						$(e.target).closest('._su').find('.toggle-container').slideToggle();
					})

				} else {
					$butt.closest('div').find('.loading_icon').hide();
					$butt.closest('div').find('.activity_status').text('');
					if(N_CMPGN) $me.find('._form_errors._e_analyse').text('Check that all inputs are valid, and that you\'re properly logged in.');
					if(P_CMPGN) $me.find('._form_errors._e_analyse').text(data.responseText);
					$me.find('._form_errors._e_analyse').show();
					
				}
			},
			error: function(resp, dd, ww) {
				// $butt.removeAttr('disabled');
				$butt.closest('div').find('.loading_icon').hide();
				$butt.closest('div').find('.activity_status').text('');
				$me.find('._form_errors._e_analyse').text('An error occurred. Please try again, or refresh page.');
				$me.find('._form_errors._e_analyse').show();
			}
		}).done(function(){
			// $butt.removeAttr('disabled');
			$butt.closest('div').find('.loading_icon').hide();
			$butt.closest('div').find('.activity_status').text('');
		});

		return false;

	})

	var hideTimer = window.setTimeout(() => {
		$('.to_hide').fadeOut();
	}, 1000);

	$('#wa_send_method').on('change', function(e) {
		
		var $we = $(this).closest('form');

		if($(this).val() == 1) {
			$we.find('.ch-firstname').show();
			$we.find('.ch-lastname').show();
			$we.find('.ch-email').show();
		} else {
			$we.find('.ch-firstname').hide();
			$we.find('.ch-lastname').hide();
			$we.find('.ch-email').hide();
		}

	})

	
	var st_select_searchterm = '';
	var done = "raaaa";
	if (typeof $('.search_clients').select2 === "function") 
    // safe to use the function
	$('.search_clients').select2({
		placeholder: "Type in client name or ID",
		minimumInputLength: 2,
		multiple: false,
//		closeOnSelect: false,
//   		id: function(orgs){return {id: orgs.orgid};},
		ajax: {
			url: _getGlobals.SERVICE_HOST+'getclients',
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
			/* processResults: function (data) {
				return {
					results: data.items
				};
			}, */
			
		},
		templateResult: function(data, container){
			
			// var more = (page * 3) < data.total; // whether or not there are more results available
	
			// notice we return the value of more so Select2 knows if more results can be loaded
			// return {results: data, more: more};
			console.log('====================================');
			console.log('templating...');
			console.log('====================================');
			var $result = $("<span></span>");
			// $result.html("<b>" + data.id + ": " + data.text);
			$result.html("<b>" + data.id + ": " + "</b>" + data.text);

			return $result;// {results: data};
		},
		 // omitted for brevity, see the source of this page
		templateSelection: function (dat) { 

			/* if(st_select_searchterm != '' && st_select_searchterm != this.me) {
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
			} */
			return dat.id + ": " + dat.text;
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
		let $we = $(this);
		if($we.hasClass('_plain')) return;

		var opt = $we.val();
		console.log('0 -- efasd sfdasdfasdf sfdasd...'+opt);

		if(opt == '0') {
			$('#show_contacts_pane').hide();			
			$('.lists #contact_list').html('');			
			return;
		}

		_getContacts(opt, $('#sel_contact_group option:selected').text(), '');
	
	})

	$('#sel_contact_grouptype').on('change', function(e) {
		$we = $(this);
		if($we.hasClass('_plain')) return;

		var opt = $we.val();
		var txt = '';//$('#sel_contact_grouptype:selected').text();

		console.log('1 -- efasd sfdasdfasdf sfdasd...'+txt);

		$('#show_contacts_pane').hide();			
		$('.lists #contact_list').html('');			

		_getGroups(opt, txt);
	
	})

	//	FOR LINKING GROUPS TO CONTACT LIST
	var ggd = $('#linked_group_id').val();
	if(ggd) {
		$('#sel_contact_group').val(ggd).trigger('chosen:updated');
		$('#sel_contact_group').change();
	}
	//	...end

	
	$('#search_conts_btn').on('click', function(e) {

		var tt = $('#search_conts_box #search_conts').val();
		// if(tt.length == 0) return;

		var opt = $('#sel_contact_group').val();
		console.log('2 -- efasd sfdasdfasdf sfdasd...'+$('#sel_contact_group option:selected').text());

		/* if(opt == '0') {
			$('#show_contacts_pane').hide();			
			$('.lists #contact_list').html('');			
			return;
		} */

		_getContacts(opt, $('#sel_contact_group option:selected').text(), tt);
	
	})

	function _getContacts(opt, gname, txt) {

		var arg;

		arg = (txt) ? 'groupconts'+'?grp='+opt+'&txt='+txt : 'groupconts?grp='+opt;
		$('._loader').show();
		
		$.ajax({
			type: 'GET',
			url: _getGlobals.SERVICE_HOST + arg,
			contentType: 'application/json; charset=utf-8',
			// data: json_form_reg,
			success: function( data ) {
				$('#show_contacts_pane').show();			
				$('._loader').hide();

					console.log(data[0].contacts);
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
					let searchall = (opt == -1);
					let switchgrp = (txt == '');
					let dat;

					//	set contacts result group name title
					$('#grp_typ_name').text($('#sel_contact_grouptype:selected').text());
					console.log('DASDSDAS' + $('#sel_contact_grouptype:selected').text());
					if(searchall) {

						/* data.forEach(el => {
							$('#group_contact_count').text(count += el.count);
							do_html(el.contacts ? el.contacts : el);
						}); */

						if(switchgrp) {
							$('#search_conts_box #search_conts').val('');
							$('#group_contact_count').text(data[0].length);
							dat = data;
						} else {
							$('#group_contact_count').text(data.length);
							dat = data;
						}
						
						$('#group_name').text('ALL Groups');

						$('#_group_info').hide();
						$('#_group_info #_desc').text('');
						$('#_group_info #_dnds').text('');
						$('#_group_info #_ndnds').text('');
						$('#_group_info #_awoptin').text('');
						$('#_group_info #_optin').text('');
						$('#_group_info #_optout').text('');
						$('#_group_info #_unverifs').text('');
						$('#_group_info #_conts').text('');
						$('#_group_info #_cdate').text('');
						$('#_group_info #_udate').text('');
						
					} else {
						// console.log('ount: ' + JSON.stringify(data[2].contacts[0].ccount));
						
						if(switchgrp) {
							$('#search_conts_box #search_conts').val('');
							$('#group_contact_count').text(data[0].length);
							$('#group_name').text(data[0].name);
							$('#group_contact_count').text(data[0].contacts.length);
							
							$('#_group_info #_desc').text(data[0].description ? data[0].description : '[none]');
							$('#_group_info #_conts').text(data[2].contacts[0].ccount); //data[0].contacts.length);
							$('#_group_info #_dnds').text(data[1][0].dnd);
							$('#_group_info #_ndnds').text(data[1][0].ndnd);
							$('#_group_info #_awoptin').text(data[1][0].awoptin);
							$('#_group_info #_optin').text(data[1][0].optin);
							$('#_group_info #_optout').text(data[1][0].optout);
							$('#_group_info #_unverifs').text(data[1][0].unverified);
							$('#_group_info #_cdate').text(moment.utc(data[0].createdAt, 'YYYY-MM-DD HH:mm:ss Z').format('h:mm a, DD-MMM, YYYY'));
							$('#_group_info #_udate').text(moment.utc(data[0].updatedAt, 'YYYY-MM-DD HH:mm:ss Z').format('h:mm a, DD-MMM, YYYY'));
							$('#_group_info').show();
							
							$('#contact_download_link').attr('href', '/dashboard/contacts/download/' + opt + '/' + data[0].name);
							dat = data[0].contacts;
						} else {
							$('#group_contact_count').text(data.length);
							$('#group_name').text(gname + ' (Search Results for \'' + txt + '\')');
							$('#group_contact_count').text(data.count);

							dat = data;
						}

					}


					do_html(dat);//a.contacts ? data.contacts : data);
					initializeActionBtns();

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

							let repltxt = new RegExp('(' + txt + ')', 'gi');
							var html = '<li class="list_item" data-wh="contact">' +
													'	<ul class="saved_item">' +
													'		<input type="hidden" class="cid" value="'+i._id+'" />' +
													'		<li style="flex: 3" class="dv_firstname">'+(!i.firstname ? '--' : ((txt == '') ? i.firstname : i.firstname.replace(repltxt, '<span style="text-decoration: underline">$1</span>')))+'</li>' +
													'		<li style="flex: 3" class="dv_lastname">'+(!i.lastname ? '--' : ((txt == '') ? i.lastname : i.lastname.replace(repltxt, '<span style="text-decoration: underline">'+txt+'</span>')))+'</li>' +
													'		<li style="flex: 2">'+((txt == '') ? i.phone : i.phone.replace(repltxt, '<span style="text-decoration: underline">'+txt+'</span>'))+'</li>' +
													'		<li style="flex: 4" class="dv_email">'+(!i.email ? '--' : ((txt == '') ? i.email : i.email.replace(repltxt, '<span style="text-decoration: underline">'+txt+'</span>')))+'</li>' +
													'		<li style="flex: 2' + (status == 'DND'? '; color: red' : (status == 'Non-DND'? '; color: green' : '')) + '">'+status+'</li>' +
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
														'			<input type="hidden" name="id" class="id" value="'+i._id+'">' +
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
				$('._loader').hide();
				// $butt.removeAttr('disabled');
				// $butt.closest('div').find('.loading_icon').hide();
			}
		}).done(function(){
			$('._loader').hide();
			// $butt.removeAttr('disabled');
			// $butt.closest('div').find('.loading_icon').hide();
		});
	}

	function _getGroups(opt, txt) {

		var arg;

		$('._loader').show();
		
		$.ajax({
			type: 'GET',
			url: _getGlobals.SERVICE_HOST + 'getgroups?grptype=' + opt,
			contentType: 'application/json; charset=utf-8',
			// data: json_form_reg,
			success: function( data ) {

				$('#search_conts_box #search_conts').val('');
				$('#group_contact_count').text('');
			
				$('#grp_typ_name').text(txt);
				$('#group_name').text('');

				$('#_group_info').hide();
				$('#_group_info #_desc').text('');
				$('#_group_info #_dnds').text('');
				$('#_group_info #_ndnds').text('');
				$('#_group_info #_awoptin').text('');
				$('#_group_info #_optin').text('');
				$('#_group_info #_optout').text('');
				$('#_group_info #_unverifs').text('');
				$('#_group_info #_conts').text('');
				$('#_group_info #_cdate').text('');
				$('#_group_info #_udate').text('');

				$('#sel_contact_group').html('');
				data.forEach(g => {
					if($('#sel_contact_group').find('option').length === 0) {
						$('#sel_contact_group').append('<option disabled selected>Choose...</option>');
					}
					if(g.name == '[Uncategorized]')
					$('#sel_contact_group').append('<option disabled>--------------------------</option>');
					$('#sel_contact_group').append('<option value="'+ g._id +'">'+ g.name +'</option>');
				});
				if($('#sel_contact_group').find('option').length === 0) {
						$('#sel_contact_group').append('<option disabled selected>No groups created.</option>');	
				}

				$('#sel_contact_group').trigger('chosen:updated');

			},
			error: function(resp, dd, ww) {
				$('._loader').hide();
				// $butt.removeAttr('disabled');
				// $butt.closest('div').find('.loading_icon').hide();
			}
		}).done(function(){
			$('._loader').hide();
			// $butt.removeAttr('disabled');
			// $butt.closest('div').find('.loading_icon').hide();
		});
	}

	
	$('.trigger_off').on('click', function (e) {
		$('._blink').fadeOut(70).fadeIn(70).fadeOut(70).fadeIn(70);
	})

	$('.inline_edit').on('click', function (e) {
		e.stopPropagation();
		if(!$(e.target).hasClass('checkboxes') && $(e.target).closest('.checkboxes').length == 0) e.preventDefault();
	})
	
	// $('.inline_edit *').on('click', function (e) {
	// 	// e.stopPropagation();
	// 	e.preventDefault();
	// })
	
	initializeActionBtns();
	function initializeActionBtns() {
		$('.edit_item_btn').off('click');
		$('.edit_item_btn').on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();

			if($(this).closest('.edit_pcmpgn').length) {
				let indx = $(this).attr('data-indx');
				$('#click_edit_pcpgn_'+indx).click();
				return;
			}

			var $btn = $(this);
			var $item = $btn.closest('.list_item');
			$item.find('.saved_item').hide();
			$item.find('.inline_edit').show();

		})
		
		$('.del_item_btn').off('click');
		$('.del_item_btn').on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();

			var $btn = $(this); console.log('btn = ' + $btn.attr('class'));
			var $item = $btn.closest('.list_item');
			var id = $item.find('form .id').val();
			var wh = $item.attr('data-wh');
			var whh = (wh == 'group') ? '. (NOTE THIS WILL ALSO DELETE ALL CONTACTS IN THE GROUP!)' : '';

			var del = prompt('Are you sure you want to delete this '+ wh + whh + '? Type "YES" to proceed.');
			if(del.toUpperCase() == 'YES') {
			
				$.ajax({
					type: 'GET',
					url: _getGlobals.SERVICE_HOST+'del' + wh + '?id=' + id,
					contentType: 'application/json; charset=utf-8',
					success: function( data ) {
						
						if(data.response == 'success') {
							console.log('ssssssssuuuuuuuuuuu');
							
							$item.remove();
							var cnt = parseInt($('span.items_count').text());
							$('span.items_count').text(--cnt);
							
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

		$('.copy_item_btn').off('click');
		$('.copy_item_btn').on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();

			var $btn = $(this); console.log('btn = ' + $btn.attr('class'));
			var $item = $btn.closest('.list_item');
			var id = $item.find('form .id').val();
			var wh = $item.attr('data-wh');
			var whh = (wh == 'group') ? '. (NOTE THIS WILL ALSO DELETE ALL CONTACTS IN THE GROUP!)' : '';

			var yes = confirm('Duplicate '+ wh + whh + '?');
			if(yes) {
				console.log('====================================');
				console.log('copying ' + wh + '; with id = ' + id);
				console.log('====================================');

				location.href = '/dashboard/campaigns/copy?id=' + id;

			} else return;

		})

		$('.cpy_lnk_btn').off('click');
		$('.cpy_lnk_btn').on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();

			var $btn = $(this); //console.log('btn = ' + $btn.attr('class'));
			var $item = $btn.closest('.list_item');
			var $div = $item.find('.dv_desc');
			
			var range = document.createRange();
			// range.selectNode(document.getElementById("a"));
			range.selectNode($div[0]);
			window.getSelection().removeAllRanges(); // clear current selection
			window.getSelection().addRange(range); // to select text
			document.execCommand("copy");
			window.getSelection().removeAllRanges();// to deselect
			console.log('====================================');
			console.log('COPIED TEXT');
			console.log('====================================');
			$('.notification.other3').removeClass('success error').addClass('success');
			$('.notification.other3 p').text('Short link copied.');
			$('.notification.other3').css('opacity',100);
			$('.notification.other3').show();
})

		$('.save_edit_btn').off('click');
		$('.save_edit_btn').on('click', function(e) {
			e.stopPropagation();
			e.preventDefault();
			
			var $btn = $(this);
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
				url: _getGlobals.SERVICE_HOST+'save'+wh,
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
						$item.find('.dv_status').text($item.find('._sel_status').val());		//	for updating performance campaigns
						$item.find('.dv_optin').text($item.find('.can_optin_chk').is(':checked') ? 'Yes' : 'No');
						if(wh == 'senderid') $item.find('.dv_status').text('Pending...');
						if(wh == 'group') {}
						else $item.find('.dv_updated').text('Pending...');
						
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

		$('.send_item_btn').off('click');
		$('.send_item_btn').on('click', function(e) {
			e.stopPropagation();
			e.preventDefault();
			
			var $btn = $(this);
			var $item = $btn.closest('.list_item');
			var wh = $item.attr('data-wh');
			var $me = $item.find('form');
			var id = $item.find('.cid').val();

			console.log('clicked send');
			if($(this).closest('.edit_pcmpgn').length) {
				let meas = $item.find('._pcp_measure').val();
				let cost = $item.find('._pcp_cost').val();
				let conf = confirm('This Campaign is charged at N' + cost + ' ' + meas + '. More details have been sent to your email. Proceed to confirm.');
				if(!conf) return;
			}
			// console.log('here we go');
			// var json_save_form = JSON.stringify($me.serializeObject()); 
			// console.log('json', json_save_form);
			
			// var $butt = $me.find('input.button');
			// $butt.attr('disabled','disabled');
			// $me.find('.loading_icon').show();
		
			$.ajax({
				type: 'GET',
				url: _getGlobals.SERVICE_HOST + 'send' + wh + '?id=' + id,
				contentType: 'application/json; charset=utf-8',
				success: function( data ) {
					
					if(data.response == 'success' || data.responseType == "OK") {

						$('.notification.other3').removeClass('success error').addClass('success');
						$('.notification.other3 p').text('Campaign successfully sent out.');
						$('.notification.other3').css('opacity',100);
						$('.notification.other3').show();

						$item.find('.send_item_btn a').css({'cursor': 'default', 'color': '#aaa'});
						$item.find('.send_item_btn').removeClass('send_item_btn').off('click');
						$item.find('.dv_status').text("Sent").css({'font-weight': 'bold', 'color': '#444'});

					} else {

						$('.notification.other3').removeClass('success error').addClass('error');
						$('.notification.other3 p').text(data.response ? data.response : "An error occured. Kindly try again or contact Admin");
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
			e.stopPropagation();
			e.preventDefault();

			var $btn = $(this);
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
		var $we = $(this);
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
		$(this).hide();
	});

	$('#amount_entry').on('keyup', function (e) {
		var ent = parseFloat($(this).val());
		console.log('entered: ' + ent);
		
			/* [2, 1, 50000],
			[1.9, 50001, 100000],
			[1.8, 100001, 500000],
			[1.7, 500001, 1000000000000],
		] */

		if(!ent) {
				$('#_rate').text('??');
				$('#_units').text('??');
				$('#_amount').text('??');
		} else {
			topupbands.forEach(band => {
				if(ent >= band[1] && ent <= band[2]) {
					$('#_rate').text('N' + band[0] + '/unit');
					$('#_units').text(formatMyNumber(Math.floor(ent / band[0])));
					$('#_amount').text(formatMyNumber(Math.floor( ( Math.floor(ent / band[0]) ) * band[0] ), 'N'));
				}
			});
		}
		
	})

	$('#sel_custom_question_type').on('change', (e) => {
		let typ = parseInt($('#sel_custom_question_type').val());
		console.log('hanged' + typ);
		let htl;
		switch (typ) {
			case 1:
				htl = '<span style="float: right; cursor: pointer " id="clear_question_btn">Delete question <i class="sl sl-icon-trash"></i></span><h5>Enter question </h5><input type="text" name="new_question_title" id="new_question_title" maxlength="100" required ><div id="new_question_error" hidden></div><button type="button" id="save_question_btn" style="margin-top: 10px;">Save question <i class="fa fa-arrow-circle-right"></i></button><span class="loading_icon fa fa-hourglass-2"></span>'
				break;
				
			case 2:
				htl = '<span style="float: right; cursor: pointer " id="clear_question_btn">Delete question <i class="sl sl-icon-trash"></i></span><h5>Enter question </h5><input type="text" name="new_question_title" id="new_question_title" maxlength="100" required ><ul class="response_options_list" style="margin-bottom: 0;"></ul><div id="new_response_input" hidden><input type="text" name="name" maxlength="50" required style="width: 80%; display: inline; margin-right: 10px; height: 35px;"><span class="tooltip top" title="Save" style="cursor: pointer"><i class="fa fa-check" id="save_response_btn" style="margin-right: 10px; cursor: pointer"></i></span><span class="tooltip top" title="Cancel" style="cursor: pointer"><i class="fa fa-close" style="margin-right: 10px; cursor: pointer" id="remove_response_btn"></i></span></div><div style="cursor: pointer; margin-top: 5px" id="add_response_btn"><i class="sl sl-icon-plus"></i> Add response option [max: 5]</div><div id="new_question_error" hidden></div><button type="button" id="save_question_btn" style="margin-top: 10px;">Save question <i class="fa fa-arrow-circle-right"></i></button><span class="loading_icon fa fa-hourglass-2"></span>'
				break;
					
			case 3:
				htl = '<span style="float: right; cursor: pointer " id="clear_question_btn">Delete question <i class="sl sl-icon-trash"></i></span><h5>Enter question </h5><input type="text" name="new_question_title" id="new_question_title" maxlength="100" required ><div class="col-lg-12 radiobutton"><div class="col-lg-6 "><input id="chk_yesno" class="chk_followup" value="Yes-No" type="radio" name="chk_polar" checked style="display: inline-block; margin-right: 10px"><label for="chk_yesno" style="display: inline-block; margin-right: 10px"> Yes-No </label></div><div class="col-lg-6 "><input id="chk_truefalse" class="chk_followup" value="True-False" type="radio" name="chk_polar" style="display: inline-block; margin-right: 10px"><label for="chk_truefalse" style="display: inline-block; margin-right: 10px"> True-False </label></div></div><div id="new_question_error" hidden></div><button type="button" id="save_question_btn" style="margin-top: 10px;">Save question <i class="fa fa-arrow-circle-right"></i></button><span class="loading_icon fa fa-hourglass-2"></span>'
				break;
		
			default:
				break;
		}

		$('#new_question_box').html(htl).show();
		$('#sel_custom_question_type').parent().hide();
		$('#new_question_box #new_question_title').focus();
		
		$('#add_response_btn').click(() => {
			$('#add_response_btn').hide()
			$('#new_response_input').show();
			$('#new_response_input input').focus();
		})
		$('#save_response_btn').click(function() {
			let ww = $('#new_response_input input').val();
			if(ww.length == 0) return;
			$('.response_options_list').append('<li>' + ww + '<span class="tooltip top" title="Remove" style="cursor: pointer"><i class="fa fa-close remove_response_btn" style="cursor: pointer; margin-left: 7px"></i></span><input type="hidden" name="question_response" value="' + ww + '" /></li>')
			$('.remove_response_btn').click(function() {
				$(this).parent().remove();
				if(!$('#new_response_input').is(':visible')) $('#add_response_btn').show()
			})
			if($('.response_options_list li').length < 5) $('#add_response_btn').show()
			$('#new_response_input').hide();
			$('#new_response_input input').val('');
		})
		$('#remove_response_btn').click(function() {
			$('#add_response_btn').show()
			$('#new_response_input').hide();
			$('#new_response_input input').val('');
		})

		$('#clear_question_btn').click(function () {
			let sure = confirm('Delete this question?');
			if(sure) {
				$(this).parent().html('');
				$('#sel_custom_question_type').val(0).trigger('chosen:updated');
				// $('#sel_custom_question_type').change();
				$('#sel_custom_question_type').parent().show();
			}
		})

		$('#save_question_btn').click(function () {
			$('#new_question_error').hide();
			if($('#new_question_title').val().length == 0) {
				$('#new_question_error').text('Empty field').show();
				return;
			}

			let json_form = JSON.stringify($('#new_question_form').serializeObject()); 
			console.log('json', json_form);
		
			$.ajax({
				type: 'POST',
				url: _getGlobals.SERVICE_HOST+'customoptin/add/question',
				contentType: 'application/json; charset=utf-8',
				data: json_form,
				success: function( data ) {
					if(data.code == "SUCCESS") {
						$('#existing_questions').append(
							'<div class="existing_question" style="border: solid 1px #ddd; padding: 10px; font-size: 0.9em; line-height: 1.7; background-color: #f3f3f3; margin: 10px;">' +
							'		<span style="float: right; cursor: pointer; margin-left: 10px " class="delete_question_btn tooltip top" title="Delete Question"><i class="sl sl-icon-trash"></i></span>' +
							'		<span style="font-weight: bold;">Question: </span>' +
							'		<span style="font-style: italic;">' + $('#new_question_title').val() + '</span>' + 
							'		<input type="hidden" class="existing_question_id" value="' + data.newid + '" />' + 
							((typ == 2) ? '<ul class="_clear_dels" >' + $('.response_options_list').html() + '</ul>' : '') +
							((typ == 3) ? '<ul><li>' + $('.chk_followup:checked').val() + '</li></ul>' : '') +
							'</div>');

							$('._clear_dels .remove_response_btn').remove();	//	for typ-2 responses
							
							$('#clear_question_btn').parent().html('');
							$('#sel_custom_question_type').val(0).trigger('chosen:updated');
							$('#sel_custom_question_type').parent().show();
		
					} else {
						$('#new_question_error').text(data.msg).show();
					}

					$('.delete_question_btn').off('click');
					$('.delete_question_btn').on('click', function () {
						let q = confirm('Delete question?');
						if(!q) return;

						let $del_dv = $(this).closest('.existing_question');
						let del_id = $del_dv.find('.existing_question_id').val();
						console.log('json = ', del_id);
					
						$.ajax({
							type: 'DELETE',
							url: _getGlobals.SERVICE_HOST+'customoptin/delete/question/' + del_id,
							contentType: 'application/json; charset=utf-8',
							// data: json_form,
							success: function( data ) {
								if(data.code == "SUCCESS") {
									$del_dv.remove();
								}
							},
							error: function(resp, dd, ww) {
						}
						}).done(function(){
							
						});
					})

				},
				error: function(resp, dd, ww) {
			}
			}).done(function(){
				
			});
		})
				
	})

	$('.delete_question_btn').click(function () {
		if(!confirm('Delete question?')) return;

		let $del_dv = $(this).closest('.existing_question');
		let del_id = $del_dv.find('.existing_question_id').val();
		console.log('json = ', del_id);
	
		$.ajax({
			type: 'DELETE',
			url: _getGlobals.SERVICE_HOST+'customoptin/delete/question/' + del_id,
			contentType: 'application/json; charset=utf-8',
			// data: json_form,
			success: function( data ) {
				if(data.code == "SUCCESS") {
					$del_dv.remove();
				}
			},
			error: function(resp, dd, ww) {
		}
		}).done(function(){
			
		});
	})

	$('#custom_optin_type').submit(function () {
		$('.customoption_errors').hide();
		let opt = $('.chk_customoptinoption:checked').val();
		let grps = $('#sel_contact_group').val()
		if(!opt) {
			$('.customoption_errors').text("Select either the '2-Click' or the 'Complete' option.").show();
			$(this).find('span.loading_icon').hide();
			return false;
		} else if((opt == 'two-click') && !grps) {
			$('.customoption_errors').text("For the '2-Click', kindly select group(s) to auto-opt-in to.").show();
			$(this).find('span.loading_icon').hide();
			return false;
		} else if(!$('#optin_sms').is(':checked') && !$('#optin_whatsapp').is(':checked')) {
			$('.customoption_errors').text("Kindly select at least one Channel for opt in.").show();
			$(this).find('span.loading_icon').hide();
			return false;
		}

		console.log('@@$$$$$$$$=' + opt + ';grps=' + grps);
		let arr = [];
		if($('#optin_sms').is(':checked')) arr.push('sms');
		if($('#optin_whatsapp').is(':checked')) arr.push('whatsapp');
		
		$(this).find('#_option').val(opt);
		$(this).find('#_grps').val(grps);
		$(this).find('#_channels').val(arr);

		return true;
		/* let json_form = JSON.stringify({
			option: opt,
			grps: grps,
		});  */
		// console.log('json', json_form, 'hek', grps);

	})

	$('#toggle_my_dashnav').click(function (e) {
		$('.dashboard-nav').toggleClass('_hidden');
		$('.dashboard-content').toggleClass('_hidden');
	})

	/* $('.chk_customoptinoption').change(function (e) {
		if($(this).val() == 'two-click') selectedcustomoptinoption = 'two-click';
		if($(this).val() == 'complete') selectedcustomoptinoption = 'complete';
	}) */

	$('.can_optin_chk').on('change', (e) => {
		// e.stopPropagation();
		// e.preventDefault();

		console.log('kkkkkllllliiiiiiiiikkkkkkkkkkkkkkkkkddddddddd');
		
	})

	$('._for_new_field select').on('change', function(e) {
	  console.log($(this).val());
		if($(this).val() == "n_f") {
			$(this).closest('._for_new_field').find('input').show();
		} else {			
			$(this).closest('._for_new_field').find('input').hide();
		}
	})

	$('._toggle_crit').click(function(e) {
		// console.log('clicked');
		$(this).children('div').first().slideToggle();
	})
	$('#upload_fields_form').submit(function (e) {
		// e.preventDefault();

		console.log('validting...');
		$('._form_errors._e_upload_field').text('');
		$('._form_errors._e_upload_field').hide();
		let list = [];
		let has_phone = false;
		let is_repeated = false;
		let is_new_empty = false;
		let is_empty = true;
		let msg = '';

		$('._for_new_field').each((i, el) => {
			console.log('...........' + i);
			let selet = $(el).find('select').val();
			if(selet == "phone") has_phone = true;
			if((selet == "n_f") && !($(el).find('input._new_field').val().trim().length)) is_new_empty = true;
			if((selet != "n_0") && (selet != "n_f")) is_empty	= false;
			if((selet != "n_0") && (selet != "n_f") && (list.indexOf(selet) != -1)) is_repeated	= true;
			list.push(selet);
		})

		if(!has_phone) msg += "'Phone' field is compulsory | ";
		if(is_empty) msg += "Choose Columns | ";
		if(is_repeated) msg += "Columns should be unique | ";
		if(is_new_empty) msg += "Specify name for 'new field' or select 'Ignore' | ";

		if(msg != '') {
			msg += "Kindly check. ";
			$(e.target).find('span.loading_icon').hide();
			$('._form_errors._e_upload_field').text(msg);
			$('._form_errors._e_upload_field').show();

			return false;
		} else {
			return true;
		}
	})

	_initPerformanceCampaignInPageActions();
})

function _initPerformanceCampaignInPageActions() {
	$('._sel_pc_criteria').off('change');
	$('._pc_add_criteria').off('click');
	$('._pc_del_criteria').off('click');

	$('._sel_pc_criteria').on('change', function(e) {

		let is_only = $('._sel_pc_criteria').length === 1;
		let _target_area = '<h5 class="_title_target">Target(s) </h5>' +
											( ($(this).val() == 'loc') ?
											'<input type="text" name="pc_target_loc" id="pc_target_loc" maxlength="100" required placeholder="Separate location(s) with commas, e.g. Abuja, Ogun, Ikeja">' :
											'<select class="chosen-select-no-single _plain _sel_pc_target" name="pc_target_' + $(this).val() + '" id="" multiple required>' +
												'<option label="blank"></option>' +
												getCriteriaTargetOptions($(this).val()) +
											'</select>');

		let _butts_area = '<h5 class="_title_butts" style="overflow: hidden; white-space: nowrap; text-align: center">[ . . . ] </h5>' +
											'<div style="justify-content: space-between; display: flex; padding-top: 11px;">' +
												'<i class="fa fa-times-circle _pc_del_criteria" style="font-size: 1.6em; color: red; cursor: pointer"></i>' +
												'<i class="fa fa-plus-circle _pc_add_criteria" style="font-size: 1.6em; color: green; cursor: pointer"></i>' +
											'</div>';

		let full = '	<div class="row with-forms _pc_region">' +
										'<div class="col-md-6">' +
											'<h5 class="_title_criteria">Select Criteria </h5>' +
											'<select class="chosen-select-no-single _sel_pc_criteria" name="pc_criteria" id="">' +
												'<option label="blank"></option>' +
												'<option value="loc">Location</option>' +
												'<option value="age">Age</option>' +
												'<option value="gdr">Gender</option>' +
												'<option value="sts">Status</option>' +
												'<option value="inc">Income Class</option>' +
												'<option value="int">Interest</option>' +
											'</select>' +
										'</div>' +
										'<div class="col-md-5 _pc_target_region" style="display: none;"></div>' +
										'<div class="col-md-1 _pc_butts_region" style="display: none;"></div>' +
									'</div>';

		$(this).closest('._pc_region').find('._pc_target_region').html(_target_area);
		$(this).closest('._pc_region').find('._pc_target_region').show();
		$(this).closest('._pc_region').find('._pc_target_region ._sel_pc_target').chosen({
				disable_search_threshold: 4,
		});

		$(this).closest('._pc_region').find('._pc_butts_region').html(_butts_area).show();
		$('._pc_region').find('._title_target, ._title_butts').hide();
		$('._pc_region').first().find('._title_target, ._title_butts').show();
		/* if(is_only) {
			$(this).closest('._pc_region').find('._title_target, ._title_butts').show();
		} else {
			$(this).closest('._pc_region').find('._title_target, ._title_butts').hide();
		} */

		getUpdatedCriteria();
		_initPerformanceCampaignInPageActions();
	})

	$('._pc_add_criteria').on('click', function(e) {

		// console.log($(this).val());
		// let is_only = false;
		// _getGlobals.performanceCampaignSelectedCriteria.push($(this).closest('._pc_region').find('._sel_pc_criteria').val());


		let _target_area = '<select class="chosen-select-no-single _plain _sel_pc_target" name="pc_target" id="" multiple required>' +
												'<option label="blank"></option>' +
												'<option value="per_imp">Per Impression</option>' +
												'<option value="per_clk">Per Click</option>' +
											'</select>';

		let _butts_area = '<div style="justify-content: space-between; display: flex; padding-top: 11px;">' +
												'<i class="fa fa-times-circle _pc_del_criteria" style="font-size: 1.6em; color: red; cursor: pointer"></i>' +
												'<i class="fa fa-plus-circle _pc_add_criteria" style="font-size: 1.6em; color: green; cursor: pointer"></i>' +
											'</div>';

		let full = '	<div class="row with-forms _pc_region">' +
										'<div class="col-md-6">' +
										'<h5 class="_title_criteria">Select Criteria </h5>' +
										'<select class="chosen-select-no-single _sel_pc_criteria" name="pc_criteria" id="">' +
												'<option label="blank"></option>' +
												'<option value="loc">Location</option>' +
												'<option value="age">Age</option>' +
												'<option value="gdr">Gender</option>' +
												'<option value="sts">Status</option>' +
												'<option value="inc">Income Class</option>' +
												'<option value="int">Interest</option>' +
									'</select>' +
										'</div>' +
										'<div class="col-md-5 _pc_target_region" style="display: none;"></div>' +
										'<div class="col-md-1 _pc_butts_region" style="display: none;"></div>' +
									'</div>';

			let $new_region = $(full).insertAfter($(this).closest('._pc_region'));
			$new_region.find('._title_criteria').hide();
			// $(this).closest('._pc_region').find('._pc_target_region').html(_target_area);
			$new_region.find('._sel_pc_criteria').chosen({
					disable_search_threshold: 4,
			});

			$new_region.find('._title_target, ._title_butts').hide();

			/* $new_region.find('._pc_target_region').show();
			$new_region.find('._pc_target_region ._sel_pc_target').chosen({
					disable_search_threshold: 4,
			});
			$new_region.find('._pc_butts_region').html(_butts_area).show();
 */
			// $(this).closest('._pc_region').find('._pc_target_region ._sel_pc_target').trigger('chosen:updated');
			// $(this).closest('._pc_region').find('._pc_target_region ._sel_pc_target').trigger('chosen:updated');
			getUpdatedCriteria();
			_initPerformanceCampaignInPageActions();

	})

	$('._pc_del_criteria').on('click', function(e) {

		let is_only = $('._pc_region').length === 1;

		if(is_only) {
			$('._pc_region').find('._pc_target_region').html('').hide();
			$('._pc_region').find('._pc_butts_region').html('').hide();
			// $('._pc_region').find('._title_criteria').show();
			$('._pc_region').find('._sel_pc_criteria').val('').trigger('chosen:updated');
		} else {
			$(this).closest('._pc_region').remove();
			// if($('._pc_region').length === 1) $('._pc_region').find('._title_criteria, ._title_target, ._title_butts').show();
		}
		$('._pc_region').find('._title_criteria, ._title_target, ._title_butts').hide();
		$('._pc_region').first().find('._title_criteria, ._title_target, ._title_butts').show();

		getUpdatedCriteria();
		_initPerformanceCampaignInPageActions();

	})

	$('._performance_expectation').each(function(i, el) {
		let $me = $(this);

		let $regn = $me.closest('.list_item');
		let measure = $regn.find('._pcp_measure').val();
		let budget = parseInt($regn.find('._pcp_budget').val());
		let cost = parseInt($regn.find('._pcp_cost').val());
		let vol = (Math.floor(budget/cost)).toLocaleString();
		$regn.find('._performance_expectation').text('Number of ' + measure.substr(4) + 's: ' + vol);
	})
}

function getCriteriaOptions() {

	const all_criteria = [
		{ value: 'age', option: 'Age' },
		{ value: 'gdr', option: 'Gender' },
		{ value: 'int', option: 'Interests' },
		{ value: 'inc', option: 'Income Class' },
		{ value: 'sts', option: 'Status' }
	]


	// let sel_criteria = _getGlobals.performanceCampaignSelectedCriteria;
	let sel_criteria = [];

	$('._pc_region').each((i, el) => {
		sel_criteria.push($(el).find('._sel_pc_criteria').val());
	})

	console.log('selected are ' + JSON.stringify(sel_criteria));
	
	let rem_criteria = all_criteria.filter(c => {
		return (sel_criteria.indexOf(c.value) === -1);
	});
	console.log('remaining are ' + JSON.stringify(rem_criteria));

	let ret_str = '';
	rem_criteria.forEach(t => {
		ret_str += '<option value="' + t.value + '">' + t.option + '</option>';
	})

	return ret_str;
}

function getUpdatedCriteria() {

	/* const all_criteria = [
		{ value: 'age', option: 'Age' },
		{ value: 'gdr', option: 'Gender' },
		{ value: 'int', option: 'Interests' },
		{ value: 'inc', option: 'Income Class' },
		{ value: 'sts', option: 'Status' }
	] */


	// let sel_criteria = _getGlobals.performanceCampaignSelectedCriteria;
	let sel_criteria = [];

	$('._pc_region').each((i, el) => {
		sel_criteria.push($(el).find('._sel_pc_criteria').val());
	})

	console.log('selected are ' + JSON.stringify(sel_criteria));
	
	/* let rem_criteria = all_criteria.filter(c => {
		return (sel_criteria.indexOf(c.value) === -1);
	});

	let ret_str = '';
	rem_criteria.forEach(t => {
		ret_str += '<option value="' + t.value + '">' + t.option + '</option>';
	})
 */
	$('._pc_region ._sel_pc_criteria').each(function(i, el) {
		$(el).find('option').each(function(i, eel) {
			if((sel_criteria.indexOf($(eel).attr('value')) !== -1) && ($(el).val() !== $(eel).attr('value'))) {
				$(eel).attr('disabled', 'disabled');
				console.log('disbaling...');
			} else {
				$(eel).removeAttr('disabled');
			}
		});
		$(el).trigger('chosen:updated');
	});

	// return ret_str;
}

function getCriteriaTargetOptions(crit) {

	const criteriatargets = {
		 criteria_age: [
			'18 - 24',
			'25 - 34',
			'35 - 44',
			'45 - 54',
			'55 - 65',
			'Above 65'
		],

		criteria_gdr: [	//	gender
			'Female',
			'Male'
		],

		criteria_int: [	//	interest
			'Shopping',
			'Jobs/Career',
			'Education',
			'Travel',
			'Entertainment',
			'Entrepreneurship'
		],

		criteria_inc		: [	//	incomeclass
			'Class B',
			'Class C',
			'Class D	'
		],

		criteria_sts: [			//	status
			'Professional',
			'Business'
		],
	};

	let targets = criteriatargets['criteria_' + crit];
	let ret_str = '';
	targets.forEach(t => {
		ret_str += '<option>' + t + '</option>';
	})

	return ret_str;
}

function halidate(we) {
	console.log('halidated');
	/* if(!($(we).find('#sms').is(':checked')) && !($(we).find('#whatsapp').is(':checked'))) {
		$(we).find('._form_errors._e_consent').text('Kindly select at least one Channel.').show()
		$(we).find('span.loading_icon').hide();
		return false;
	} */
}

function sanitizeMsg($fr, html) {
	var $el = $fr.find('.editable_div');
	var msg_ = $el.html();
/*  
	msg_ = msg_.replace(/<span[^<]*?class="arg"[^<]*firstname.*?<\/span>/g, '[firstname]')
				.replace(/<span[^<]*?class="arg"[^<]*lastname.*?<\/span>/g, '[lastname]')
				.replace(/<span[^<]*?class="arg"[^<]*email.*?<\/span>/g, '[email]')
				.replace(/<span[^<]*?class="arg"[^<]*url.*?<\/span>/g, '[url]')
				.replace(/^<div[^<]*?>/g, '')
				.replace(/<div[^<]*?>/g, '<br>')
				.replace(/<\/div>/g, '') 
				.replace(/&nbsp;/g, ' ')
				.replace(/<br>/g, ' ')
				.replace(/<span.*style=".*?">/g, '') 
				.replace(/<\/span>/g, '');
 */

	//	remember to add case-insensitivity
	msg_ = msg_
				.replace(/\[firstname\]/g, html? '<span style="display: inline; font-size: 0.9em; background-color: yellow;">[firstname]</span>' : '[firstname]')
				.replace(/\[first name\]/g, html? '<span style="display: inline; font-size: 0.9em; background-color: yellow;">[firstname]</span>' : '[firstname]')
				.replace(/\[lastname\]/g, html? '<span style="display: inline; font-size: 0.9em; background-color: yellow;">[lastname]</span>' : '[lastname]')
				.replace(/\[last name\]/g, html? '<span style="display: inline; font-size: 0.9em; background-color: yellow;">[lastname]</span>' : '[lastname]')
				.replace(/\[email\]/g, html? '<span style="display: inline; font-size: 0.9em; background-color: yellow;">[email]</span>' : '[email]')
				.replace(/\[e-mail\]/g, html? '<span style="display: inline; font-size: 0.9em; background-color: yellow;">[email]</span>' : '[email]')
				.replace(/\[url\]/g, html? '<span style="display: inline; font-size: 0.9em; background-color: yellow;">[url]</span>' : '[url]')
				/* .replace(/^<div[^<]*?>/g, '')
				.replace(/<div[^<]*?>/g, '<br>')
				.replace(/<\/div>/g, '') 
				.replace(/&nbsp;/g, ' ')
				.replace(/<br>/g, ' ')
				.replace(/<span.*style=".*?">/g, '') 
				.replace(/<\/span>/g, ''); */

	console.log('ADJUSTED FILE... : ' + msg_);
	
	var $dd = $el.clone();
	$dd.html(msg_); 
	var msg = $dd.text();
	$fr.find('.campaignmessage').val(msg);
	return msg_;			
}

function validateAndSendCampaign(btn) {

	var has_error = false;
	function checkElements($we) {

		sanitizeMsg($we);

		var ii = 0;
		$we.find('h5').removeClass('_invalid');
		$we.find('[required]').each((i, el) => {
			if(!$(el).val() || $(el).val() == null || $(el).val().length == 0 || $(el).val() == 0) {
				ii++;
				$(el).parent().find('h5').addClass('_invalid');
			}
		})
		console.log(ii+'naso='+ $we.find('.editable_div').text().trim() +'==')
		if($we.find('.editable_div').text().trim() ==  "") {
			ii++;
			$we.find('.editable_div').parent().find('h5').addClass('_invalid');
		}

		if(ii) {
			$(btn).closest('div').find('.loading_icon').hide();
			$(btn).closest('div').find('.activity_status').text('');
			$form.find('._form_errors._e_analyse').html('There\'s an error in your form, crosscheck the fields with red labels');
			$form.find('._form_errors._e_analyse').show();
			return false;
		}
		
		if($we.find('#to_optin').length && !$we.find('#to_optin').is(':checked') && $we.find('#to_awoptin').length && !$we.find('#to_awoptin').is(':checked')) {
			$(btn).closest('div').find('.loading_icon').hide();
			$(btn).closest('div').find('.activity_status').text('');
			$form.find('._form_errors._e_analyse').html('Select between <b>\'Send to Opted in Contacts\'</b> and <b>\'Send to Awaiting-Opt-In Contacts\'</b>');
			$form.find('._form_errors._e_analyse').show();
			return false;
		}
		/* else if($('._followup_campaign._1 #sel_contact_group').val() == $('._followup_campaign._2 #sel_contact_group').val()) {
			if($('._followup_campaign._1 .chk_followup').is(':checked') && $('._followup_campaign._2 .chk_followup').is(':checked') && $('._followup_campaign._1  #sel_contact_group').val() != "elapsed") {
				$(btn).closest('div').find('.loading_icon').hide();
				$(btn).closest('div').find('.activity_status').text('');
				$form.find('._form_errors._e_analyse').html('Follow-up Campaign "conditions" must be unique. Please ensure that they are differrent.');
				$form.find('._form_errors._e_analyse').show();
				return false;
			}
		} */

		return true;
	}

	var $form =$(btn).closest('form');
	$form.find('._form_errors').hide();
	$form.find('._e_analyse').hide();

	//	first, main campaign
	var $we = $(btn).closest('form').find('._main_campaign');
	if(!checkElements($we)) has_error = true;

	//	next, followup campaigns
	$('._followup_campaign .chk_followup:checked').each(function (i, el) {
		var $we = $(el).closest('._followup_campaign');
		if(!checkElements($we)) has_error = true;
	}) 
	/* {
		var $we = $(btn).closest('form').find('._followup_campaign._1');
		if(!checkElements($we)) return false;
	} */
	
	//	lastly, second followup campaign
	/* if($('._followup_campaign._2 .chk_followup').is(':checked')) {
		var $we = $(btn).closest('form').find('._followup_campaign._2');
		if(!checkElements($we)) return false;
	} */
		
	if(has_error) {
		return false
	} else $form.submit();

}

function activateWhatsApp(e) {
	// e.preventDefault();
	if(e != "do") {
		//	when switch is first clicked before displaying message
		let $sw = $(e);

		if($sw.is(':checked')) {
			$('#pre_activate_whatsapp').show();
		} else {
			$('#pre_activate_whatsapp').hide();
			$('#pre_activate_whatsapp button').show();
			$('#pre_activate_whatsapp .loading_icon').hide();
		}
	} else {
		//	after 'Proceed' is clicked 
		$('#pre_activate_whatsapp button').hide();
		$('#pre_activate_whatsapp .loading_icon').css('display', 'inline-block');

		$.ajax({
			type: 'GET',
			url: _getGlobals.SERVICE_HOST+'getwhatsappqrode',
			contentType: 'application/json; charset=utf-8',
			// data: json_form_reg,
			success: function( data ) {

				if(data.code == "exists") {

				}
				else if(data.error) {
					// $('#img_whatsappqrcode').attr('src', data.code);
					alert('Server error occurred. Please try again later or contact Admin.');
					$('#whatsapp_qrcode').hide();
					$('#pre_activate_whatsapp button').show();
					$('#pre_activate_whatsapp .loading_icon').hide();
					$('#pre_activate_whatsapp').show();
				} else {
					$('#img_whatsappqrcode').attr('src', data.code);
					$('#whatsapp_qrcode').show();
					$('#pre_activate_whatsapp').hide();
				}
				

			},
			error: function(resp, dd, ww) {
				$we.closest('div').find('.loading_icon').hide();
				// $butt.removeAttr('disabled');
				// $butt.closest('div').find('.loading_icon').hide();
			}
		}).done(function(){
			// $butt.removeAttr('disabled');
			// $butt.closest('div').find('.loading_icon').hide();
		});


	}

}

function doDate() {
	//console.log('EXECUTED!');
	$('.date').each(function(i,el) {
		$(el).text(ourDate($(el).text()))
	})
}

function doRegistration() {
	// console.log(th);
	
	var $me = $('#register_form');
	// if($me.find('.loading_icon').is(':visible')) return;

	$('._form_errors').hide();
	$('._e_reg').hide();
	$('._e_reg .e_list').html('');

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
		url: _getGlobals.SERVICE_HOST+'register',
		contentType: 'application/json; charset=utf-8',
		data: json_form_reg,
		success: function( data ) {
			
			$butt.removeAttr('disabled');
			console.log('regis: ' + data[0]);
			
			if(data[0] && data[0] == 'registered') {
				// $('#login_form')[0].reset();
				$('#register_form')[0].reset();
				$.magnificPopup.close();	//	to hide dialog box

				$('.notification.other2').addClass('success');
				$('.notification.other2 p').text('Registration successful. Please sign in.');
				$('.notification.other2').show();

				location.href = '/dashboard';
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
					if((data.message == 'email must be unique') || (data.type == 'unique violation')) {
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

					$me.find('._form_errors._e_register').text('Please check your connection and try again.');
					$me.find('._form_errors._e_register').show();
			/* if(resp.responseText) {
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
			} */
		}
	}).done(function(){
    $butt.removeAttr('disabled');
		$me.find('.loading_icon').hide();
	});
}

function doLogin() {
	console.log('gbdfnhgb');
	// return false;
	
	var $me = $('#login_form');
	
	$('._form_errors').hide();
	$('._e_login').hide();
	$('._e_login .e_list').html('');

// var json_form_reg = JSON.stringify($('#registration_form').serializeObject()); 
	$me.find('.error').removeClass('error');
	var json_form_login = JSON.stringify($me.serializeObject()); 
	
	var $butt = $('#login_btn');
	$butt.attr('disabled','disabled');
	$me.find('.loading_icon').show();
	let hyd = true;

  $.ajax({
		type: 'POST',
		url: _getGlobals.SERVICE_HOST+'login',
		contentType: 'application/json; charset=utf-8',
		data: json_form_login,
		success: function( data ) {

			$butt.removeAttr('disabled');

			if(data[0] && data[0] == 'autheticated') {
				hyd = false;
				location.href = '/dashboard';

			} else if(data == 'unauthorized') {
				$me.find('.loading_icon').hide();
				$me.find('._form_errors._e_login').text('Invalid email/password');
				$me.find('._form_errors._e_login').show();
			}
		},
		error: function(resp, dd, ww) {
			if((ww == 'Unauthorized') || (resp.responseText == 'Unauthorized')) {
				console.log('failed');
				
				$me.find('._form_errors._e_login').text('Invalid email/password');
				$me.find('._form_errors._e_login').show();
			} else {
				$me.find('._form_errors._e_login').text('Please check your connection, and try aggin.');
				$me.find('._form_errors._e_login').show();
			}
			console.log('error...' + JSON.stringify(resp) + '...' + dd + '...' + ww);
			console.log('error2...' + resp.responseText);
			
			$butt.removeAttr('disabled');
			$me.find('.loading_icon').hide();
		
		}
	}).done(function(){
		if(hyd) $me.find('.loading_icon').hide();
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
	if(!num) return '--';
	nnum = num.toString().split(',');
	num = '';
	for(var i=0;i<nnum.length;i++) {
		num += nnum[0];
	}
	return (curr || '') + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toShortTime(date) {
	if(!date) return '--';
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

function insertText(id, cls, txt, typ) {
	let newestNode, shift;

	// _getGlobals.editable_node.parentElement.focus();
	if(typ == 'span') {
		let newel = document.createElement("span");
		newel.innerHTML = txt;
		newel.setAttribute('id', id);
		newel.setAttribute('class', cls);
		newel.setAttribute('contenteditable', 'false');
		newel.setAttribute('spellcheck', 'false');
		newestNode = document.createTextNode(' ');
		_getGlobals.editable_range.insertNode(newestNode);
		_getGlobals.editable_range.insertNode(newel);
		_getGlobals.editable_range.collapse();
		shift = 1;
	} else if(typ == 'emoji') {
		newestNode = document.createTextNode(txt);
		_getGlobals.editable_range.insertNode(newestNode);
		_getGlobals.editable_range.collapse();
		shift = 2;
	}

	// _getGlobals.editable_range.setStart(_getGlobals.editable_node, _getGlobals.editable_start + shift);
	// console.log('====================================');
	// console.log('node = ' + newestNode.nodeValue + ' | ' + newestNode.nodeType + ' | parentnode_id = ' + newestNode.parentElement.id + ' | parentnode_class = ' + newestNode.parentElement.className);
	// console.log('====================================');
        _getGlobals.editable_sel = window.getSelection();
	_getGlobals.editable_range = _getGlobals.editable_sel.getRangeAt(0);
	_getGlobals.editable_range.setStart(newestNode, shift);
	_getGlobals.editable_range.collapse(true);
	_getGlobals.editable_sel.removeAllRanges();
	_getGlobals.editable_sel.addRange(_getGlobals.editable_range);
	_getGlobals.editable_start = shift;
	// setGetSelectionThings('editable_div');


	/* if(typ == 'input') {
		// let cursorPos = $obj.prop('selectionStart');
		// let textBefore = v.substring(0, cursorPos);
		let v = $(obj).val(); 
		let cursorPos = _getGlobals.editable_position;
		console.log('====================================');
		console.log('yeyePos = ' + cursorPos);
		console.log('====================================');
		let textBefore = v.substring(0, cursorPos);
		let textAfter = v.substring(cursorPos, v.length);
		$(obj).val(textBefore + txt + textAfter);
	} else {
		// let cursorPos = $obj.prop('selectionStart');
		// let cursorPos = _getGlobals.editable_position;
		let cursorPos = _getGlobals.editable_offset;
		console.log('====================================');
		console.log('cursorPos = ' + cursorPos);
		console.log('====================================');
		// let v = $(obj).html();
		let v = _getGlobals.editable_node.nodeValue;
		let textBefore = v.substring(0, cursorPos);
		let textAfter = v.substring(cursorPos, v.length);
		// $(obj).html(textBefore + txt + textAfter);
		_getGlobals.editable_node.nodeValue = textBefore + txt + textAfter;
		$(obj).html($(obj).text());
	} */


	/* HTMLTextAreaElement.prototype.insertAtCaret = function (text) { 
		text = text || ''; 
		if (document.selection) { 
			// IE 
			this.focus(); 
			var sel = document.selection.createRange(); 
			sel.text = text; 
		} else if (this.selectionStart || this.selectionStart === 0) { 
			// Others 
			var startPos = this.selectionStart; 
			var endPos = this.selectionEnd; 
			this.value = this.value.substring(0, startPos) + text + this.value.substring(endPos, this.value.length); 
			this.selectionStart = startPos + text.length; 
			this.selectionEnd = startPos + text.length; 
		} else { 
			this.value += text; 
		} 
	}; */


	/* let ob = document.getElementById('wa_contenteditable');
	let range = document.createRange();
	let sel = window.getSelection();
	console.log('====================================');
	console.log(' nodes = ' + ob.childNodes.length); 
	console.log('====================================');
	range.setStart(ob.childNodes[0], _getGlobals.editable_position + len);
	range.collapse(true);
	sel.removeAllRanges();
	sel.addRange(range); */

}
function setGetSelectionThings(parent_node_class) {
	let editable_sel = window.getSelection();
	let editable_range = editable_sel.getRangeAt(0);
	let editable_node = editable_range.startContainer;

	// console.log('22222222222222222');


	//	check if getSelection is working from proper node
	if(editable_node.parentElement.className.indexOf(parent_node_class) == -1) return;

	_getGlobals.editable_sel = editable_sel;// = window.getSelection();
	_getGlobals.editable_range = editable_range;// = _getGlobals.editable_sel.getRangeAt(0);
	_getGlobals.editable_node = editable_node;// = _getGlobals.editable_range.startContainer;
	_getGlobals.editable_start = _getGlobals.editable_range.startOffset;

	// console.log('====================================');
	// console.log('positionn = ' + _getGlobals.editable_start);
	// console.log('====================================');
}

function budgetFocus() {
	$('#_warning_budget').hide();
	$('#budget_').val($('#budget').val());
}
function budgetBlur() {
	let n = parseFloat($('#budget_').val());
	$('#budget').val(isNaN(n) ? '' : n);
	$('#budget_').val(isNaN(n) ? '' : parseFloat(n).toLocaleString());
	if(isNaN(n)) $('#_warning_budget').show();
}

