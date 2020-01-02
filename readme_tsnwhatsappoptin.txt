STEPS:

1. Get tsnwhatsappoptin.js file from TrackSend
2. Link file to client page(s) (preferably just before closing <body> tag)
3. In client js file, add the following code (within document.ready):
   
   createBox('place_it_here', 'CLIENT_API_KEY');

   where 'place_it_here' is the "id" of the container "div" in which the necessary HTML codes would be inserted, and
   'CLIENT_API_KEY' is the unique key recieved from TrackSend
4. Finally, style elements to taste.
