var username; // fetches username when page loads
var urlBase = location.protocol + '//' + location.host + location.pathname;

var limit = Infinity;

/*
Sends an upvote/downvote request
name - name of food choice
upvote - 'true' for upvote, anything else for downvote
*/
var postVote = function(name, upvote) {
    $.ajax({
        type: 'POST',
        url: urlBase + '/vote',
        data: {
            choice: name,
            upvote: upvote,
        },
        error: function(message) {
           alert(message.responseText);
        }
    });
}

/*
Helper method to create DOM element representing a food choice
choice - Object, matches MongoDB model
    choice.foodName
    choice.voteCount
    choice.voters
*/
var createFoodChoice = function(choice) {
    var name = choice.foodName;
    var voteCount = choice.voteCount;
    var voters = choice.voters;

    var card = document.createElement('div');
    card.className = 'ui card';
    
    var content = document.createElement('div');
    content.className = 'content';
    card.appendChild(content);

    var header = document.createElement('div');
    header.className = 'header';
    header.innerText = name;
    content.appendChild(header);

    var votes = document.createElement('div');
    votes.className = 'meta';
    votes.innerText = voteCount + ' votes';
    $(votes).popup({
        html: choice.voters.join('<br>'),
    });
    content.appendChild(votes);

    var voteButton = document.createElement('button');
    voteButton.name = name;
    voteButton.className = 'ui button';
    if (voters.indexOf(username) === -1) {
        voteButton.innerText = 'Add vote';
        voteButton.className += ' add-vote';
        voteButton.onclick = function() {
            postVote(name, 'true');
        };
    } else {
        voteButton.innerText = 'Remove vote';
        voteButton.className += ' remove-vote positive';
        voteButton.onclick = function() {
            postVote(name, 'false');
        };
    }
    card.appendChild(voteButton); 

    return card;
};

$(document).ready(function() {
    // fetches username when page first loads
    $.ajax({
        type: 'GET',
        url: urlBase + '/whoami',
        success: function(name) {
            username = name;
        },
    });

    // set up websockets
    var id = window.location.pathname.split('/').pop(); // what2eat.com/poll/:id
    var socket = io();
    socket.emit('poll id', id); // join the room corresponding to the id
    setInterval(() => {
        socket.emit('maintain connection', 'ping');
    }, 30 * 1000);
    socket.on('update people', function(people) { // fires when a new user joins the poll
        $('#people-list').empty();
        people.forEach(person => {
            var li = document.createElement('li');
            li.innerText = person;
            $('#people-list').append(li);
        });
    });
    socket.on('update choices', function(foodChoices) { // fires when the options have changed
        $('#food-choices').empty();
        foodChoices.forEach(choice => {
            $('#food-choices').append(createFoodChoice(choice));
        });
    });

    $('#logout-button').click(function(event) {
        $.ajax({
            type: 'POST',
            url: urlBase + '/logout',
            success: function() {
                location.reload(); // redirects to login page
            }
        })
    });

    // click handler for upvote/downvote buttons initially on page
    $('.add-vote').click(function(event) {
        postVote(this.name, 'true');
    });

    $('.remove-vote').click(function(event) {
        postVote(this.name, 'false');
    });

    $('.vote').popup(); // initialize popups

    $('#create-new-choice').click(function(event) {
        event.preventDefault();
        var foodChoices = $('#food-choices')[0];
        var numFoods = foodChoices.childElementCount;
        if (numFoods < limit) {
            $('#create-choice-modal').modal('show')
        } else {
            alert('You have the max number of choices possible!')
        }
        if (numFoods+1 >= limit) { // +1 to account for new choice
            $('#create-new-choice').toggleClass('disabled');
        }
    });

    $('#new-choice').on('input', function(e) {
        var newChoice = $('#new-choice').val();
        if (newChoice.length > 0) {
            $('#submit-new-choice').removeClass('disabled');
        } else {
            $('#submit-new-choice').addClass('disabled');
        }
    })

    $('#new-choice-form').on('submit', function(e) {
        e.preventDefault();
        var newChoice = $('#new-choice').val();
        $('#new-choice').val(''); // clear form
        $('#create-choice-modal').modal('hide');
        $('#submit-new-choice').addClass('disabled');

        $.ajax({
            type: 'POST',
            url: urlBase + '/newchoice',
            data: {
                newChoice: newChoice,
            },
            error: function(message) {
               alert(message.responseText);
            }
        });
    });
});
