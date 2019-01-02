var express = require('express');
var hashPassword = require('../helpers/hash');
var Poll = require('../models/Poll');

var limit = Infinity; // max number of options (currently just for adding after creation)

module.exports = function(io) {
  var router = express.Router();

  /* GET home page. */
  router.get('/', function(req, res, next) {
    res.render('index', { title: 'What2Eat' });
  });

  /* GET username if logged in. */
  router.get('/poll/:id/whoami', function(req, res, next) {
    var id = req.params.id;
    if (id == req.session.pollId && req.session.username) {
      res.status(200).send(req.session.username);
    } else {
      res.status(400).send('not logged in');
    }
  });

  /* GET poll. */
  router.get('/poll/:id', function(req, res, next) {
    var id = req.params.id;
    Poll.findById(id, function(err, data) {
      if (err || data == null) {
        res.render('error', { message: 'That poll was not found, sorry!' });
      } else {
        if (req.session.username != null && req.session.pollId === id) {
          // logged in, render poll
          var choices = data.foodChoices.map(choice => ({
            name: choice.foodName,
            votes: choice.voteCount,
            voters: choice.voters,
            voted: choice.voters.indexOf(req.session.username) != -1,
          }));
          var people = data.people.map(person => person.username);
          res.render('poll', {
            title: data.pollName + ' - What2Eat',
            name: data.pollName,
            username: req.session.username,
            choices,
            people,
            id,
            settings: data.settings,
          });
        } else {
          // not logged in, render login page
          res.render('login', {
            title: data.pollName + ' - What2Eat',
            name: data.pollName,
          });
        }
      } 
    });
  });

  /* POST create new poll. */
  router.post('/newpoll', function(req, res, next) {
    var raw = req.body;
    var input = JSON.parse(JSON.stringify(raw));

    // remove duplicate entries
    input.foodChoice = [...new Set(input.foodChoice)];

    // create new paramater foodChoices from foodChoice with additional fields
    input.foodChoices = input.foodChoice.filter(choice => choice.length > 0).map(choice => ({
      foodName: choice,
      voteCount: 0, 
      voters: [],
    }));

    input.settings = {
      adminAddOnly: input.openAdd !== 'on',
      maxChoices: input.maxChoices || limit,
    };

    var poll = new Poll(input);
    poll.save(function(err, data) {
      res.redirect('/poll/' + data._id);
    })  
  });

  /* POST login. */
  router.post('/poll/:id/login', function(req, res, next) {
    var id = req.params.id;
    var username = req.body.username;
    var password = req.body.password;
    Poll.findById(id, function(err, data) {
      if (err) {
        res.status(404).send('Poll not found');
      } else {
        var people = data.people;            
        var found = false; // whether user with matching username exists
        // loop through all people in poll
        for (var i in people) {
          var person = people[i];
          if (username === person.username) {
            found = true;
            if (person.password === '' || hashPassword(password) === person.password) {
              req.session.username = username;
              req.session.pollId = id;
              req.session.save();
              res.status(200).send('success');
            } else {
              res.status(401).send('Incorrect password');
            }
            break;
          }
        }

        // create new user
        if (!found) {
          people.push({
            username,
            password: (password === '') ? '' : hashPassword(password),
          });

          req.session.username = username;
          req.session.pollId = id;
          req.session.save();

          Poll.findByIdAndUpdate(id, { $set: { people: people }}, function(err, response) {
            io.to(id).emit('update people', people.map(person => person.username));
            res.status(200).send('success');
          });
        }
      }
    });
  });

  /*
  POST - logout
  */
  router.post('/poll/:id/logout', function(req, res, next) {
    req.session.pollId = null;
    req.session.username = null;
    req.session.save();
    res.status(200).send('success');
  });

  /*
  POST vote
  */
  router.post('/poll/:id/vote', function(req, res, next) {
    var id = req.params.id;
    if (req.session.pollId != id || !req.session.username) {
      res.status(401).send('Must be logged in to vote.');
      return;
    } else {
      var choice = req.body.choice; // name of food choice
      var upvote = req.body.upvote; // is a string
      Poll.findById(id, function(err, data) {
        var foodChoices = data.foodChoices;
        if (err) {
          res.status(404).send('Poll not found.');
          return;
        }
        var found = false;
        for (i in foodChoices) {
          var foodChoice = foodChoices[i];
          if (foodChoice.foodName === choice) {
            found = true;
            if (upvote === 'true') {
              // only allowed to upvote once
              if (foodChoice.voters.indexOf(req.session.username) === -1) {
                foodChoice.voters.push(req.session.username);
                foodChoice.voteCount += 1;                  
              } else {
                res.status(403).send('Cannot vote twice.');
                return;
              } 
            } else {
              var index = foodChoice.voters.indexOf(req.session.username);
              if (index === -1) {
                res.status(403).send('No vote to remove');
                return;
              } else {
                foodChoice.voters.splice(index, 1);
                foodChoice.voteCount -= 1;
              }
            }
            // update foodChoice
            foodChoices[i] = foodChoice;
            // sort by decreasing number of votes
            foodChoices.sort((choice1, choice2) => choice2.voteCount - choice1.voteCount);

            Poll.findByIdAndUpdate(id, {$set: { foodChoices: foodChoices }}, function(err, response) {
              io.to(id).emit('update choices', foodChoices);
              res.status(200).send('success');
            });
            break;
          }
        } 
        if (!found) {
          res.status(404).send('Choice not found.');
        }
      });
    }
  });

  /* 
    POST create new choice in existing poll 
  */
  router.post('/poll/:id/newchoice', function(req, res, next) {
    var id = req.params.id;
    var newChoice = req.body.newChoice;

    Poll.findById(id, function(err, data) {
      var foodChoices = data.foodChoices;
      if (err) {
        res.status(404).send("Something borked and we couldn't find the poll :/");
        return;
      }
      for (i in foodChoices) {
        var foodChoice = foodChoices[i];
        if (foodChoice.foodName === newChoice) {
          res.status(404).send("ERROR: Can't create duplicate choices");
          return;
        }
      }

      foodChoices.push({
        foodName: newChoice,
        voteCount: 0, 
        voters: [],
      });

      Poll.findByIdAndUpdate(id, {$set: { foodChoices: foodChoices }}, function(err, response) {
        io.to(id).emit('update choices', foodChoices);
        res.status(200).send('success');
      });
    });
  });

  return router;
}
