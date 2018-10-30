var express = require('express');
var hashPassword = require('../helpers/hash');
var Poll = require('../models/Poll');

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
      res.send(200, req.session.username);
    } else {
      res.send(400, 'not logged in');
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
        res.send(404, 'Poll not found');
      } else {
        var people = data.people;            
        var found = false;
        for (var i in people) {
          var person = people[i];
          if (username === person.username) {
            found = true;
            if (person.password === '' || hashPassword(password) === hashPassword(person.password)) {
              req.session.username = username;
              req.session.pollId = id;
              req.session.save();
              res.send(200, 'success');
            } else {
              res.send(401, 'Incorrect password');
            }
            break;
          }
        }

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
            res.send(200, 'success');
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
    res.send(200, 'success');
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
      var choice = req.body.choice;
      var upvote = req.body.upvote; // is a string
      Poll.findById(id, function(err, data) {
        var foodChoices = data.foodChoices;
        if (err) {
          res.send(404, 'Poll not found.');
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
              res.send(200, 'success');
            });
            break;
          }
        } 
        if (!found) {
          res.send(404, 'Choice not found.');
        }
      });
    }
  });

  return router;
}
