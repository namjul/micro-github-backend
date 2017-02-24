# micro-github-backend

Microservice for using github as a backend

## Usage

```sh
# using now
now namjul/micro-github-backend -e SECRET=123 -e REPO=db -e SCHEMA='{ "exercise": [], "settings": {}}'
```

### Environment variables

```sh
# Is used to salt cached github token
SECRET=123
# The name of the repository
REPO=db
# Defines your db structure
SCHEMA={ "exercise": [], "settings": {}}
```

### Schema

```javascript
{
  "exercise": [], // Array for plural resource
  "settings": {} // Object for singular resource
}
```

### Authorization

For readonly access provide username
```
username: <github-username>
```

For full access provide githuh oauth token
```
authorization: <github-oauth-token>
```

## Routes

### Plural routes

```
GET    /posts
GET    /posts/1
POST   /posts
PUT    /posts/1
PATCH  /posts/1
DELETE /posts/1
```

### Singular routes

```
GET    /profile
POST   /profile
PUT    /profile
PATCH  /profile
```

## License

MIT
