# HNStories Titles Word Frequency

## Stack

[Nest](https://github.com/nestjs/nest) framework with TypeScript

## Installation

Developed on Node Version: **>=20**

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test Endpoints

```bash
http://localhost:3000/hnstories/titles/top-words-last-25 # returns top 10 most occurring words in the titles of the last 25 stories

http://localhost:3000/hnstories/titles/top-words-by-karmas # returns top 10 most occurring words in titles of the last 600 stories of users with at least 10 karma

http://localhost:3000/hnstories/titles/top-words-last-week # returns top 10 most occurring words in the titles of the stories of exactly the last week (*NOTE*: loads on 2 minutes avg due to nature of the endopint)
```
