# So You Think You Can Cater -- Josh Koshy

Name: Joshua Koshy
Pitt ID: 3947222

## Installation

1. Clone the repository

2. Install a clean virtual environment at the root directory

3. Install project dependencies:

	pip install -r requirements.txt

## Running the App

1. Notify flask of the application

	export FLASK_APP = chat.py
	
	(If you are using Windows, use "set" instead of "export")

2. Initiate the catering database
	
	flask initdb

3. Run the application

	flask run

4. You can now access the application through your local host at port 5000

	localhost:5000
