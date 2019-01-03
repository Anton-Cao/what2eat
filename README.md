# What2Eat

A companion website to When2Meet to help you decide what food to get!

Built for [MIT TechX](https://techx.io).

# How it works
1. Fill out the name of your poll and at least two choices
1. Sign in with a username and password (optional)
1. Vote for the choices you like
1. Send the URL to others so they can also fill out the poll

# Dev
1. Run `npm install`
1. Run `npm run setup` to create the `.env` file if it doesn't exist yet, and edit the environment variables if necessary
1. Run `npm run start-mongo` to start the mongo server
1. Run `npm install -g nodemon` to install nodemon globally
1. Run `npm run start-dev` to start the server with nodemon
1. Go to `localhost:3001` to see the app
1. Run `npm run stop-mongo` when you're done

__Notes:__ 
* In the code, `choice` should refer to a food option in the poll and `option` should refer to custom options for the poll itself, even though the frontend describes each `choice` as an "Option". This naming convention is quite unfortunate.
* Each poll is refered to by a unique `id`, which is its `ObjectId` in the Mongo database. 

# Production
1. Run `npm install` and `npm run create-env` as before
1. Change `NODE_ENV` to `"production"` in `.env` and make sure the mongo URI is correct and the secrets are secure
1. Run `forever start ./bin/www`
