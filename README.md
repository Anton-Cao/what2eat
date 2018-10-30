# What2Eat

A companion website to When2Meet to help you decide what food to get!

Built for [MIT TechX](https://techx.io).

# Dev
* Run `npm install`
* Run `npm run create-env` to create the `.env` file if it doesn't exist yet, and edit the environment variables if necessary
* Run `npm run start-mongo` to start the mongo server
* Run `npm install -g nodemon` to install nodemon globally
* Run `npm run start-dev` to start the server with nodemon
* Go to `localhost:3001` to see the app
* Run `npm run stop-mongo` when you're done

# Production
* Run `npm install` and `npm run create-env` as before
* Change `NODE_ENV` to `"production"` in `.env` and make sure the mongo URI is correct and the secrets are secure
* Run `npm run start`
