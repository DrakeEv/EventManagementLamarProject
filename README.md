Software Engineering CPSC 4360-01 Group Project by Drake Everett, Chiara Melagrani, Narsico Martinez, and Natalie Romero

Lamar Event System (Lamar EMS) - A web application for students, staff, and professors to create, find, and RSVP for events on campus.

HOW TO RUN: (Using UBUNTU)
Firstly, open UBUNTU and paste: /mnt/c/Users/(your user)/Downloads$ cd lamarems
From there, you will unzip the lamarems.zip manually, OR, unzip lamarems file in UBUNTU: /mnt/c/Users/(your user)/Downloads$ unzip lamarems.zip -d lamarems_full
1. Install dependancies with: npm install
2. Run the server: node server.js
Your output should read: Connected to SQLite DB -> Server running on http://localhost:3000
3. Using your browser, open: http://localhost:3000
4. You should see the web browser now, and depending on your role (using the drop down), users will be able to find events, create events, and manage events.
