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
};
 
$(document).ready(function() {
	var campaign_confirmed = false;
	var whatsapp_campaign = false;

	try {
		createBox('place_it_here', '3443453_57445254_10_342');
	} catch(e) {
		console.log("Tracksend Box Error: " + e);
	}

	$('form').submit((e) => {
		// if($(e.target).find('span.loading_icon').is(':visible')) return false;
		$(this).find('span.loading_icon').show();
	})

	// const picker = new EmojiButton();
	// $('.editable_div').on('blur', function (e) {
	// $('#wa_contenteditable').on('keyup mouseup', function (e) {
	$('.editable_div').on('blur keyup mouseup', function (e) {
		e.preventDefault();
		console.log('11111111111111');
		
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
			$('._form_errors._e_consent').text('You are only allowed to add contacts who has given you consent to send them messages.');
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
		countChars(e);
	} );

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

	function countChars(e) {
		var $we = $('.editable_div._sms');

		var sp = $we.find('span.arg').length;
		var ch = 0;
		var msgs = 0;
		var $q = $we;
		var arr = [];


		//	count chars 
		if(sp > 0) {
			var $dd = $('.editable_div._sms').clone();
			$dd.find('span.arg').remove();
			ch = $dd.text().length  + (sp * 15);
			console.log('with sp = ' + sp + '; alls = ' + ch);
			
		} else {
			// $we.html($we.text());
			ch = $we.text().length;
			console.log('no sp; alls = ' + ch);
		} 
		console.error('ch = ' + ch);

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
		
		$('#msg_char_count').text(ch + (sp > 0? ' (est.)' : ''));
		$('#msg_count').text(msgs);
		
	}

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
	});
  
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

	$('.compose_options_box > li').off('click');
	$('.compose_options_box > li').on('click', function(e) {
		// if($(e.target).attr('name') != 'check') return;

		var $wh = $(this);
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
				
				if(!($wh.closest('form').find('#sel_short_url').val() > 0)) {
					alert('Please select the Short URL to insert from above.');
					return false;
				}

				// $wh.closest('form').find('.add_utm').show('fade');
				break;
			case 'ch-emoji':
				t = 'emoji';
				id = 'url-in';
				
				$wh.closest('form').find('#emoji_list').toggle();
				// picker.pickerVisible ? picker.hidePicker() : picker.showPicker();
		}

		inp = $wh.attr('id');
		if(id == null) {
			let wha = ($(this).attr('id') == 'add_img_butt') ? 'image' : 'video';
			let whb = ($(this).attr('id') == 'add_img_butt') ? 'im-icon-Photo' : 'im-icon-Video-4';
			let init = ($('.content_attachments input').length == 0) ? true : false;
			$('.content_attachments').html('<input type="file" name="att_file" id="att_file" accept="'+ wha +'/*" hidden>');

			$('.content_attachments #att_file').click(() => {
				$('.content_attachments #att_file').change(() => {
					if($('.content_attachments #att_file').val()) {
						// $('.content_attachments').html('<input type="file" name="att_file" id="att_file" accept="'+ wha +'/*" hidden>');
						console.log('file = ' + $('.content_attachments #att_file').val());
						
						$('.content_attachments').css('display','flex');
						$('.content_attachments').append('Attachment: <i class="im '+ whb +'" style="font-size:2em;margin: 0 5px;"></i> <span class="att_file_name">' + $('.content_attachments #att_file').val() + '</span> [ <a href="#" style="color:red;color:red;font-size:0.7em;">remove</a> ]');
					} else {
						console.log('NO-FILE');
						
						$('.content_attachments').html('');
					}
				})
			});
			$('.content_attachments #att_file').click();

			/* $('#att_img, #att_vid').off('change');
			$('#att_img, #att_vid').on('change', () => {
				if($('#att_img, #att_vid').val()) {
					$('.content_attachments').show(); 
					console.log('id = ' + $(this).attr('id'));
					 
				}
			}) */

			switch(inp) {
				case 'clr_msg_butt':
					if(window.confirm('Clear message?')) {
						$wh.closest('form').find('.editable_div').html('').focus();
					}
					break;
				case 'add_img_butt':
					// $('#att_img').click();
					$wh.closest('form').find('.editable_div').focus();
					break;
				case 'add_vid_butt':
					// $('#att_vid').click();
					$wh.closest('form').find('.editable_div').focus();
					break;
			}
		} else {
				// return;
				pasteDiv(id, t, $wh);
				countChars();
		}
	})

	function pasteDiv(id, t, $wh) {
		if(t == 'emoji') return;
		// $('.editable_div').html($('.editable_div').html() + '<span spellcheck="false" contenteditable="false" id="'+id+'">'+t+'</span>');
		insertText(id, 'arg', t, 'span');//+'">'+t+'</span>','h');
		// $wh.closest('.col-md-12').find('.editable_div').html($wh.closest('.col-md-12').find('.editable_div').html().replace(/<br>$/g, ' '));
		// $wh.closest('.col-md-12').find('.editable_div').html($wh.closest('.col-md-12').find('.editable_div').html() + '<span class="arg" spellcheck="false" contenteditable="false">'+t+'</span>&nbsp;');
		// $('.editable_div').focus();
	}

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

		$.magnificPopup.close();;

		if($(this).hasClass('send')) {
			campaign_confirmed = true;
			$('#campaign_form_sms').submit();
			$('.activity_status').text('Sending...').show();
		}

	})

	$('.campaign_send_btn').on('click', function(e) {

		campaign_confirmed = true;
		whatsapp_campaign = true;
		$(this).closest('form').submit();
		$(this).closest('form').find('.activity_status').text('Sending...').show();
		$(this).closest('div').find('.loading_icon').show();

	})

	$('.campaigntypes form').submit(function (e) {

		var $me = $(this);
		var $butt = $me.find('#analyse_btn');
		
		$me.find('._form_errors').hide();
		$me.find('._e_analyse').hide();
		$butt.closest('div').find('.loading_icon').show();
		
		console.log('====================================');
		console.log('sending...');
		console.log('====================================');
		if (campaign_confirmed && !whatsapp_campaign) return true;
		
		$butt.closest('div').find('.activity_status').text('Analyzing...');

		var msg_ = $me.find('.editable_div').html();
		msg_ = msg_.replace(/<span id="firstname-in" class="arg" spellcheck="false" contenteditable="false">firstname<\/span>/g, '[firstname]')
					.replace(/<span id="lastname-in" class="arg" spellcheck="false" contenteditable="false">lastname<\/span>/g, '[lastname]')
					.replace(/<span id="email-in" class="arg" spellcheck="false" contenteditable="false">email<\/span>/g, '[email]')
					.replace(/<span id="url-in" class="arg" spellcheck="false" contenteditable="false">url<\/span>/g, '[url]')
					.replace(/&nbsp;/g, ' ')
					.replace(/<span style="color: rgb\(112, 112, 112\); font-size: 15px; background-color: rgb\(255, 255, 255\); display: inline !important;">/g, '')
					.replace(/<\/span>/g, '');

		var $dd = $me.find('.editable_div').clone();
		$dd.html(msg_);
		var msg = $dd.text();
		$me.find('#campaignmessage').val(msg);
		let w = moment($me.find('#datepicker').val(), 'MM/DD/YYYY h:mm A').format('YYYY-MM-DD HH:mm:ss Z');
		let wwa = moment($me.find('#datepickerwa').val(), 'MM/DD/YYYY h:mm A').format('YYYY-MM-DD HH:mm:ss Z');
		console.log('====================================');
		console.log('tz: ' + wwa);
		console.log('====================================');
		$me.find('#schedule').val(moment.utc(w, 'YYYY-MM-DD HH:mm:ss Z').format('YYYY-MM-DD HH:mm:ss'));
		$me.find('#schedulewa').val(moment.utc(wwa, 'YYYY-MM-DD HH:mm:ss Z').format('YYYY-MM-DD HH:mm:ss'));
		// $('#datepicker').val();
		if (campaign_confirmed && whatsapp_campaign) return true;

		// $me = $('#campaign_form');
		
		var json_campaign_add = JSON.stringify($me.serializeObject()); 

		$.ajax({
			type: 'POST',
			url: _getGlobals.SERVICE_HOST+'analysecampaign',
			contentType: 'application/json',
			data: json_campaign_add,
				// data: json_form_reg,
			success: function( data ) {

				console.log(data);

				$('#analysis_id').val(data.tmpid);
				$('#analysis-box #cpm_summary_name').text($me.find('#campaign_name').val());
				$('#analysis-box #cpm_summary_sender').text($me.find('#sel_sender_id option:selected').text());
				$('#analysis-box #cpm_summary_msg').text(msg);
				$('#analysis-box #cpm_summary_to').text($me.find('#sel_contact_group option:selected').text());
				$('#analysis-box #cpm_summary_recp').text(data.contactcount);
				$('#analysis-box #cpm_summary_count').text(data.msgcount);
				$('#analysis-box #cpm_summary_avg').text(parseInt(data.msgcount)/parseInt(data.contactcount));
				$('#analysis-box #cpm_units_chrg').text(data.units);

				var bal, noc;
				if(data.units > data.balance) {
					bal = '<span style="color: red">' + data.balance + ' (INSUFFICIENT) </span>';
					
					$('.campaign_summary_btn.send').hide();
				} else if(data.contactcount == 0) {
					noc = '<span style="color: red">' + data.contactcount + ' (NO CONTACTS ADDED) </span>';
					$('#analysis-box #cpm_summary_recp').html(noc);
					$('#analysis-box #cpm_summary_avg').text('--');
					$('.campaign_summary_btn.send').hide();
				} else {
					bal = data.balance;
					$('.campaign_summary_btn.send').show(); 
				}

				$('#analysis-box #cpm_units_balance').html(bal);

				$('#click_analysis_box').click();

				$butt.closest('div').find('.loading_icon').hide();
				$butt.closest('div').find('.activity_status').text('');

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
console.log('====================================');
console.log('changed');
console.log('====================================');
		$we = $(this);
		if($we.hasClass('_plain')) return;

		var opt = $we.val();
		console.log('efasd sfdasdfasdf sfdasd...'+opt);

		if(opt == '0') {
			$('#show_contacts_pane').hide();			
			$('.lists #contact_list').html('');			
			return;
		}

		_getContacts(opt, '');
	
	})

	$('#sel_contact_grouptype').on('change', function(e) {
		$we = $(this);
		if($we.hasClass('_plain')) return;

		var opt = $we.val();
		var txt = '';//$('#sel_contact_grouptype:selected').text();

		console.log('efasd sfdasdfasdf sfdasd...'+txt);

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
		if(tt.length == 0) return;

		var opt = $('#sel_contact_group').val();
		console.log('efasd sfdasdfasdf sfdasd...'+opt);

		/* if(opt == '0') {
			$('#show_contacts_pane').hide();			
			$('.lists #contact_list').html('');			
			return;
		} */

		_getContacts(opt, tt);
	
	})

	function _getContacts(opt, txt) {

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
						$('#_group_info #_unverifs').text('');
						$('#_group_info #_conts').text('');
						$('#_group_info #_cdate').text('');
						$('#_group_info #_udate').text('');
						
					} else {
						
						if(switchgrp) {
							$('#search_conts_box #search_conts').val('');
							$('#group_contact_count').text(data[0].length);
							$('#group_name').text(data[0].name);
							$('#group_contact_count').text(data[0].contacts.length);
							
							$('#_group_info #_desc').text(data[0].description ? data[0].description : '[none]');
							$('#_group_info #_conts').text(data[0].contacts.length);
							$('#_group_info #_dnds').text(data[1][0].dnd);
							$('#_group_info #_ndnds').text(data[1][0].ndnd);
							$('#_group_info #_unverifs').text(data[1][0].unverified);
							$('#_group_info #_cdate').text(moment.utc(data[0].createdAt, 'YYYY-MM-DD HH:mm:ss Z').format('h:mm a, DD-MMM, YYYY'));
							$('#_group_info #_udate').text(moment.utc(data[0].updatedAt, 'YYYY-MM-DD HH:mm:ss Z').format('h:mm a, DD-MMM, YYYY'));
							$('#_group_info').show();
							
							dat = data[0].contacts;
						} else {
							$('#group_contact_count').text(data.length);
							$('#group_name').text(data.name);
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
													'		<input type="hidden" class="cid" value="'+i.id+'" />' +
													'		<li style="flex: 3" class="dv_firstname">'+((txt == '') ? i.firstname : i.firstname.replace(repltxt, '<span style="text-decoration: underline">$1</span>'))+'</li>' +
													'		<li style="flex: 3" class="dv_lastname">'+((txt == '') ? i.lastname : i.lastname.replace(repltxt, '<span style="text-decoration: underline">'+txt+'</span>'))+'</li>' +
													'		<li style="flex: 2">'+((txt == '') ? i.phone : i.phone.replace(repltxt, '<span style="text-decoration: underline">'+txt+'</span>'))+'</li>' +
													'		<li style="flex: 4" class="dv_email">'+((txt == '') ? i.email : i.email.replace(repltxt, '<span style="text-decoration: underline">'+txt+'</span>'))+'</li>' +
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
					$('#sel_contact_group').append('<option value="'+ g.id +'">'+ g.name +'</option>');
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
		e.preventDefault();
	})
	
	initializeActionBtns();
	function initializeActionBtns() {
		$('.edit_item_btn').off('click');
		$('.edit_item_btn').on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();

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

		$('.save_edit_btn').off('click');
		$('.save_edit_btn').on('click', function(e) {
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

})

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
					$('#pre_activate_whatsapp').show();
				}
				else {
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

  $.ajax({
		type: 'POST',
		url: _getGlobals.SERVICE_HOST+'login',
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
	console.log('====================================');
	console.log('node = ' + newestNode.nodeValue + ' | ' + newestNode.nodeType + ' | parentnode_id = ' + newestNode.parentElement.id + ' | parentnode_class = ' + newestNode.parentElement.className);
	console.log('====================================');
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
	console.log('22222222222222222');

	//	check if getSelection is working from proper node
	if(editable_node.parentElement.className.indexOf(parent_node_class) == -1) return;

	_getGlobals.editable_sel = editable_sel;// = window.getSelection();
	_getGlobals.editable_range = editable_range;// = _getGlobals.editable_sel.getRangeAt(0);
	_getGlobals.editable_node = editable_node;// = _getGlobals.editable_range.startContainer;
	_getGlobals.editable_start = _getGlobals.editable_range.startOffset;

	console.log('====================================');
	console.log('positionn = ' + _getGlobals.editable_start);
	console.log('====================================');
}


