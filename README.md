# Custom Recipe Manager

Custom Recipe Manager is a web-based application built with [py4web](https://py4web.com/), vue.js and bulma that allows users to create, browse, and share cooking recipes. Users can add ingredients with detailed nutritional info, manage their personal recipe collection, and explore public recipes made by others.

## Features

- User registration and login
- Public feed of all recipes
- Create, view, edit, and delete recipes
- Add new ingredients with detailed nutrition
- Search recipes by name, type, author, or ingredients
- Favorite recipes and view them on a dedicated page
- Automatically calculate total calories per recipe
- Profiles with bio and saved recipe stats
- Import recipes from [TheMealDB](https://www.themealdb.com/)

## Getting Started

### Requirements

- Python 3.8+
- pip

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd <your-project-directory>

# Install dependencies
pip install -r requirements.txt

# Run the py4web server
python -m py4web run apps


# Access the App
Once the server is running, open your browser and go to:
http://localhost:8000/Proj19

```

## Collaborators

I was responsible for the core application design, creating, searching, displaying, and securely allowing users to edit recipes. Below are the contributors and their main areas of work:

- [Sharif262](https://github.com/Sharif262) – Image support, unique entry handling, navigation bar styling
- [pennmaster2207](https://github.com/pennmaster2207) – Profiles page, favorites page layout and logic
- [prootus](https://github.com/prootus) – Calorie computation logic, ingredient scaling by servings
- [UCSC-anromo](https://github.com/UCSC-anromo) – Recipe data import from TheMealDB, ingredient search functionality
- [SeanGrayCS](https://github.com/SeanGrayCS) – Debugging and general testing assistance


