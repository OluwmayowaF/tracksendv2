  //  Tracksend Plugin Error: The container is located within a form.
  
	function createBox(client_container, API_KEY) {

		// if(window.location )
		var $container = $('.'+client_container).first(); 
		if($container.closest('form').length > 0) {
			console.log('===============================================================');
			console.log('Tracksend Plugin Error: The container is located within a form.');
			console.log('===============================================================');

			return false;
		}

		var html = '<div id="" class="tsn_container">' + 
									'<input type="checkbox" id="optin" name="optin" />' +
									'<label for="optin">Opt in for WhatsApp Communications</label>' +
									'<div id="" class="tsn_form_box" style="display:none">' +
										'<form enctype="" id="tsn_form" action="">' +
											'<input type="hidden" name="clientid" value="' + API_KEY + '" />' +
											'<input type="text" name="fullname" id="" placeholder="Enter your full name" required />' +
											'<input type="text" name="phone" id="" placeholder="Phone number" required />' +
											'<select class="chosen-select-no-single _plain" name="country" required >' +
												'<option value="234">Nigeria</option>' +
												'<option value="225">Cote D\'Ivoire</option>' +
											'</select>' +
											'<button type="submit" name="done">Submit</button>' +
										'</form>' +
									'</div>' +
								'</div>';

		$container.html(html);
		$container.find('#optin').click(function (e) {
			if($(this).is(':checked')) {
				$container.find('.tsn_form_box').show('slide');
			} else {
				$container.find('.tsn_form_box').hide('slide');
			}
		})

		$container.find('form').submit(function (e) {
			e.preventDefault();

			var $me = $(this);
			var json_save_form = JSON.stringify($me.serializeObject()); 
			// console.log('json', json_save_form);
			
			// var $butt = $me.find('input.button');
			// $butt.attr('disabled','disabled');
			// $me.find('.loading_icon').show();
		
			$.ajax({
				type: 'POST',
				url: _getGlobals.SERVICE_HOST+'whatsappoptin',
				contentType: 'application/json; charset=utf-8',
				data: json_save_form,
				success: function( data ) {
					// alert('WE DONE!');
					$me[0].reset();
					if(data.status == "error") {
						alert(data.msg);
					} else {
						alert('Successfully submitted. A WhatsApp message has been sent to you.');
					} 
					
				},
				error: function(resp, dd, ww) {
					
				}
			}).done(function(){

			})
		})
		// vform.setAttribute('id', 'tracksend_box');
		// vform.setAttribute('class', 'tsn_box');
		// vform.inne
	}

