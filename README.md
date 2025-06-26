#Password for dashboard is 1231

# Trello Billboard 
This is trello billboard I made to track what is done, in-progress, or needs to be done on the project. It would be helpful to join divy up roles or claim tasks.

https://trello.com/invite/b/683d579b701945dcff321286/ATTI43426be29fcc9504d8627a654224fd7666297C0A/183-custom-recipie-manager

# Final project

You will work on the final project in groups.
Use https://canvas.ucsc.edu/courses/82493/pages/final-project-groups to join a group

You must use py4web for serverside. You can use the css library of your choice.
You are not required to use a client-side framework but you can.

Part of your grade includes:
- usability
- code quality
- security / vulnerabilities
- individual contribution to the project (commits)

## How do I use this?

### Setup
1. Clone the repository to your local machine.
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Start the server:
   ```
   python -m py4web run apps
   ```
4. Open your browser and go to: [http://localhost:8000/Proj19](http://localhost:8000/Proj19)

### Basic Usage
- **Register** for an account or **log in** if you already have one.
- Use the navigation bar to:
  - Go to the Home page
  - Browse all recipes
  - Create a new recipe
  - View your profile and your saved recipes
- **Create a Recipe:**
  - Click "Create Recipe" in the navbar
  - Fill in the recipe details, add ingredients, and directions
  - Save your recipe
- **Browse/Search Recipes:**
  - Use the Recipes page to search by name or type
  - Click on a recipe to view details
- **Add Ingredients:**
  - When creating a recipe, you can add new ingredients if they don't already exist
- **Edit Recipes:**
  - You can only edit recipes you have authored

For more details, see the PDF instructions and screenshots included with the project.

## Project Option I - Custom Recipe Manager

You will develop a web-based recipe manager that allows users to create, browse, and share recipes. This is a database-driven application that must include user accounts and support for searching and managing shared ingredients and recipes.

### Minimum Requirements (for a passing grade)
Your app must include the following features:

Database Schema:

- A table for ingredients with fields: name, unit, calories_per_unit, description
- A table for recipes with fields: name, type, description, image, author, instruction_steps, servings
- A linking table to connect recipes and ingredients, with fields: recipe_id, ingredient_id, quantity_per_serving

Functionality:

- Ability to search ingredients by name.
- Ability to add new ingredients.
- Ingredients are shared across users and cannot be edited once created.
- Ability to search recipes by name and type.
- All recipes are public.
- Ability to create new recipes.
- Ability to edit recipes authored by the logged-in user only.
- Users cannot edit others' recipes.

Documentation:

- A PDF with instructions and screenshots showing functionality

### Requirements for Full Grade

To earn full credit, your app must include all of the above, plus:

- Import data from TheMealDB API to populate recipes (import only once; the import code must be included).
- A professional, self-documenting, and intuitive user interface.
- A public search API for recipes (JSON format).
- Secure recipe editing logic: only allow authors to modify their own recipes.
- Automatically compute total calories per recipe based on ingredients and quantities.

### Optional Features (for extra credit)

Implementing any of the following will earn you bonus points:
- Support for multiple images per recipe.
- Ability to search recipes by ingredients (any subset).
- A public search API for ingredients.
- Store additional nutritional info beyond just calories.
- Automatically scale ingredients when changing number of servings.

### Conventions to follow
- Our code is expected to be self documenting meaning that it should be clear WHAT and HOW the code does what it does. Comments should explain WHY we're doing it. If you were to come back to this code a year from now and ask yourself "Why did I do this?", the answer to that would make a good comment!
- When choosing a task from the trello board to work on, create a card titled "{Your Name}'s working on" and drag the task to that card. When you're done, drag that task to the card labeled "DONE".
- If your code requires modification to someone else's code, communicate with them BEFOREHAND. This will save a lot of potential headache!
