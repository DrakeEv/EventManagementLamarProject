Software Engineering CPSC 4360-01 Group Project by Drake Everett, Chiara Melagrani, Narsico Martinez, and Natalie Romero

Lamar Event System (Lamar EMS) - A web application for students, staff, and professors to create, find, and RSVP for events on campus.

HOW TO RUN: (Using UBUNTU)
1. Unzip lamarems_full_project file in UBUNTU: /mnt/c/Users/(your desktop user here)/Downloads$ unzip lamarems_full_project.zip -d lamarems_full
2. Install dependancies with: npm install
3. Run the server: node server.js
   Your output should read: Connected to SQLite DB
                            Server running on http://localhost:3000
4. Using your browser, open: http://localhost:3000
5. You should see the web browser now, and depending on your role (using the drop down), users will be able to find events, create events, and manage events.
