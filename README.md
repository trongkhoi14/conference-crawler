# conference-crawler

## Overview


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

