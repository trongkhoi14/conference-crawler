# conference-crawler

## Overview
The "conference-crawler" project is an automated tool designed to gather information about conferences and events worldwide. Utilizing web scraping techniques, this project automatically scans websites, and other sources to search for and collect information about conferences across various fields of expertise.

The goal of "conference-crawler" is to provide a consolidated and up-to-date database of conferences and events in multiple domains, enabling researchers, experts, and event organizers to easily track and participate in events relevant to their interests and needs.

The features of the "conference-crawler" project include:

- Automated data scraping of conferences from the website https://portal.core.edu.au/conf-ranks/.
- Automatic search for the official websites of conferences.
- Detailed data scraping of conferences, including conference dates, submission dates, notification dates, etc., from the official conference websites.

## Getting started
### Run the application at your local
- Clone this repository
```
git clone https://github.com/trongkhoi14/conference-searching
```
- Now you have a folder conference-searching that contains folders and files like these below
```
.git
backend
frontend
.gitignore
README.md
```
- Here are the steps to run the application at your local machine

1. Install dependecies for both backend and frontend folder
```
cd backend
npm install

cd frontend
npm install
```
Now you have all depencencies which are the system needs, move to step 2

2. Create .env file

In the folder backend, you create a file '.env', then pass content into it

```
PORT=5000

NODE_ENV=development

#DB_CONNECT_INFO
SQL_DRIVER=SQL Server
SQL_SERVER=KHOI
SQL_DATABASE=ABCDElivery
SQL_UID=sa
SQL_PWD=123
```
3. Run the system
```
cd backend
npm run dev

cd frontend
npm run dev

