document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send_mail;

  // By default, load the inbox
  load_mailbox('inbox');
});

function send_mail(){
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    const oldelement = document.querySelector('#message').lastChild;
    if (result['error']){
      let div = document.createElement('div');
      div.className = "alert alert-danger";
      div.innerHTML = result['error'];
      document.querySelector('#message').replaceChild(div, oldelement);
      document.querySelector('#message').style.display = 'block';
    }else {
      // const oldelement = document.querySelector('#message').lastChild;
      let div = document.createElement('div');
      div.className = "alert alert-success";
      div.innerHTML = result['message'];
      load_mailbox('sent');
      document.querySelector('#message').replaceChild(div, oldelement);
      document.querySelector('#message').style.display = 'block';
    }
  });
  return false;
}

function compose_email(email) {
    email = email || 0;
  // Show compose view and hide other views

    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#message').style.display = 'none';
    document.querySelector('#ind-email').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    if(email.sender === undefined) {
        // Clear out composition fields
        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-subject').value = '';
        document.querySelector('#compose-body').value = '';
    } else{
        document.querySelector('#compose-recipients').value = email.sender;
        if (email.subject.includes('Re:')){
            document.querySelector('#compose-subject').value = email.subject;
        }
        else {
            document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
        }
        var replyvalue = `\n\n\n------------------------------------------------------------------\nOn ${email.timestamp} ${email.sender} wrote:\n------------------------------------------------------------------\n${email.body}`;
        document.querySelector('#compose-body').value = replyvalue;
    }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#message').style.display = 'none';
  document.querySelector('#ind-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  var newemails = 0;
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)} <span id="mailbox-span"></span></h3>`;
  fetch(`/emails/${mailbox}`)
      .then(response => response.json())
      .then(emails => {
        console.log(emails);
        var i;
        for(i = 0; i < emails.length; i++) {
            let mail = emails[i];
            let email = document.createElement('div');
            if (mailbox === 'sent') {
                email.innerHTML = `
                <div class="email" style="background-color: #F1F1F1">
                  <div class="row">
                      <div id="sneder" class="col" style="text-align: left;">
                          <b>To: </b>${mail.recipients}
                      </div>
                      <div class="col" style="text-align: left;">
                          <b>Subject: </b>${mail.subject}
                      </div>    
                      <div class="col" style="text-align: right;">
                          ${mail.timestamp}
                      </div>
                  </div>
                </div>`
            } else {
                if (emails[i]["read"] === false) {
                    newemails++;
                    // console.log(newemails);
                    email.innerHTML = `
                        <div class="email" style="background-color: white">
                          <div class="row">
                              <div id="sneder" class="col" style="text-align: left;">
                                  <b>From: </b>${mail.sender}
                              </div>
                              <div class="col" style="text-align: left;">
                                  <b>Subject: </b>${mail.subject}
                              </div>    
                              <div class="col" style="text-align: right;">
                                  ${mail.timestamp}
                              </div>
                          </div>
                        </div>`
                } else {
                    email.innerHTML = `
                        <div class="email" style="background-color: #F1F1F1">
                          <div class="row">
                              <div id="sender" class="col" style="text-align: left;">
                                  <b>From: </b>${mail.sender}
                              </div>
                              <div class="col" style="text-align: left;">
                                  <b>Subject: </b>${mail.subject}
                              </div>    
                              <div class="col" style="text-align: right;">
                                  ${mail.timestamp}
                              </div>
                            </div>
                        </div>`
                }
        }
          email.addEventListener('click', function () {
            view_mail(mail.id, mailbox);
            seen_email(mail);
            // this.style.backgroundColor = 'gray';
          });
          document.querySelector('#emails-view').append(email);
        }
        // console.log(newemails);
        if (newemails > 0) {
            document.querySelector('#mailbox-span').innerHTML = `new ${newemails}`;
            document.querySelector('#mailbox-span').className = 'mailbox-span';
        }
      });


}

function view_mail(id, mailbox){
  console.log(`entered the view_mail function with id ${id}`);
  fetch(`/emails/${id}`)
      .then(response => response.json())
      .then(email => {
        let newmail = document.createElement('div');
        console.log(email.archived);
        if(mailbox === "inbox" || mailbox === 'archive'){
            newmail.innerHTML = `
            <div style="background-color: #F1F1F1; padding: 10px 10px 10px 10px;">
                <h2>${email.subject}</h2>
                <ul style="list-style-type: none; padding: 0 0 0 0;">
                  <li><b>From:</b> ${email.sender}</li>
                  <li><b>To:</b> ${email.recipients}</li>
                  <li><b>Time:</b> ${email.timestamp}</li>         
                </ul>
                <p style="white-space: pre-wrap; background-color: #F9F9F9; padding: 5px 5px 5px 5px; margin: 10px 10px 10px 10px;">${email.body}</p>
                <br>
                <pre><button id="archive-button"></button> <button id="reply-button" class="btn btn-success">Reply</button></pre>
            </div> 
          `
        }
        else {
            newmail.innerHTML = `
            <div style="background-color: #F1F1F1; padding: 10px 10px 10px 10px;">
                <h2>${email.subject}</h2>
                <ul style="list-style-type: none; padding: 0 0 0 0;">
                  <li><b>From:</b> ${email.sender}</li>
                  <li><b>To:</b> ${email.recipients}</li>
                  <li><b>Time:</b> ${email.timestamp}</li>         
                </ul>
                <p style="white-space: pre-wrap; background-color: #F9F9F9; padding: 5px 5px 5px 5px; margin: 10px 10px 10px 10px;">${email.body}</p>
                <pre><button id="reply-button" class="btn btn-success">Reply</button></pre>
            </div> 
          `
        }

        let oldmail = document.querySelector('#ind-email').lastChild;
        document.querySelector('#ind-email').replaceChild(newmail, oldmail);
        document.querySelector('#ind-email').style.display = 'block';
        document.querySelector('#message').style.display = 'none';
        document.querySelector('#emails-view').style.display = 'none';
        if(mailbox === 'inbox' || mailbox === 'archive'){
          let archive = document.querySelector('#archive-button');
          if(email.archived === false){
            archive.innerHTML = 'Archive';
            archive.className = 'btn btn-primary';
          }
          else{
            archive.innerHTML = 'Un-archive';
            archive.className = 'btn btn-danger';
          }
          console.log('at the end of if')
          document.querySelector('#archive-button').addEventListener('click', () => archivedornot(id, email));
          document.querySelector('#reply-button').addEventListener('click', () => compose_email(email));
        }
      });
}

function archivedornot(id, email){
  if(email.archived === false) {
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    })
    let button = document.querySelector('#archive-button');
    button.className = 'btn btn-danger';
    button.innerHTML = 'Un-archive';
  } else{
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    })
    let button = document.querySelector('#archive-button');
    button.className = 'btn btn-primary';
    button.innerHTML = 'Archive';
  }
}

function seen_email(mail){
    fetch(`/emails/${mail.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            'read': true
        })
    })
}