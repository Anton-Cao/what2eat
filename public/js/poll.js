var username;
var urlBase = location.protocol + '//' + location.host + location.pathname;

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
    var id = window.location.pathname.split('/').pop();
    var socket = io();
    socket.emit('poll id', id); // to join the room corresponding to the id
    socket.on('update people', function(people) {
        $('#people-list').empty();
        people.forEach(person => {
            var li = document.createElement('li');
            li.innerText = person;
            $('#people-list').append(li);
        });
    });
    socket.on('update choices', function(foodChoices) {
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

    $('.add-vote').click(function(event) {
        postVote(this.name, 'true');
    });

    $('.remove-vote').click(function(event) {
        postVote(this.name, 'false');
    });
});