STEPS:

1. Get tsnwhatsappoptin.js file from TrackSend
2. Link js file to client HTML page(s), anywhere
    - after jquery js file is linked
    - before the client's custom js file(s) is linked
3. In client (custom) js file, add the following code (within document.ready function):
   
   createBox('place_it_here', 'CLIENT_API_KEY');

   where 'place_it_here' is the "id" of the container "div" in which the necessary HTML codes is to be inserted, and
   'CLIENT_API_KEY' grabbed from 'Integrations' page on clients TrackSend account
4. Finally, style elements to taste.

NOTE: the container must not be within a form tag.
