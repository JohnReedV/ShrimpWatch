# ShrimpWatch

### Description

ShrimpWatch is a powerful platform that provides insightful analysis of Bitcoin and Ethereum transactions. This state-of-the-art technology converts complex data into meaningful, human-readable information and stores it in a database for easy access. Explore the cryptocurrency world like never before with our visually stunning representation of the data at shrimpwatch.com. We also offer an API for developers and researchers. Get a complete and unparalleled view of the cryptocurrency landscape with ShrimpWatch."

### Setup

First step is to set up your postgres db. If you do not already have one a Dockerfile has been provided in the project root.

Using provided Dockerfile: `docker build ./ && docker run --name ShrimpWatch -p 5432:5432 <image>`

Connect to your postgres database in ./prisma

Generate and push db schema with `yarn prisma`

Set up your configuration file @ ./conf.json.example
Note that on my machine the database will not respond to all queries with > 16 workers due to request overload. 

Run ShrimpWatch with `yarn start`

### licence
You cannot own information https://unlicense.org/