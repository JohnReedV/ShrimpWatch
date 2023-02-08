# ShrimpWatch

### Backend Setup

First step is to set up your postgres db. If you do not already have one a Dockerfile has been provided in the project root.

Using provided Dockerfile: `docker build ./ && docker run --name ShrimpWatch -p 5432:5432 <image>`

Connect to your postgres database in ./prisma

Generate and push db schema with `yarn prisma`

Set up your configuration file @ ./conf.json.example
Note that on my machine the database will not respond to all queries with > 16 workers due to request overload. 

Run ShrimpWatch with `yarn start`