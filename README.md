# Expressjs-starter-kit

Backend starter-kit for a MEAN stack app

## Content

- ExpressJS
- NodeJS
- Cookie-Parser
- Logger (morgan)
- Http
- Cors
- MongoDBClient
- Nodemon
- Jsonwebtoken
- Bcrypt
- Swagger-ui-express
- Swagger-jsdoc

### Prebuild code

- Cors
- DBClient
- Error Handling with custom Error
- Utility classes for Auth/Error
- User route
- Swagger Integration

## Initialize from this repo

- Clone this repository
- ```sh
  npm install
  ```
- Replace the README.md name/content
- Replace (if wanted) the swaggerJSDocOptions in app.js
- Change the package.json/package-lock.json "name"
- Rename the "DBNAME" in app.js to the name of your database
- Create a .env file at the root level with the followings:
  - MONGOBD_STRING: string to connect to your mongoDB cluster
  - CORS_ORIGIN: arrays of urls authorized to access your application
  - JWT_ISSUER: jwt issuer
  - JWT_SECRET: jwt secret

## Run the server

```sh
npm start
```
