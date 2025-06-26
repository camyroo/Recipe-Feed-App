"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

import requests, string, re
import random
from pydal.validators import IS_IN_DB

from yatl.helpers import A

from py4web import URL, abort, action, redirect, request

from .common import (
    T,
    auth,
    authenticated,
    cache,
    db,
    flash,
    logger,
    session,
    unauthenticated,
)

DEFAULT_PROFILE_PICTURE = "https://api.dicebear.com/7.x/initials/svg?seed=user&backgroundColor=ffdd57&fontFamily=Arial&fontSize=40"

# ----- page stuff ----- #

@action("index") 
@action.uses("index.html", auth.user, T)
def index():                #main feed page
    user = auth.get_user()
    if not user:
        redirect(URL("auth/login"))
    message = T("Hello, {username}").format(**user) if user else T("Hello")
    return dict(message=message)  

@action("favorites") 
@action.uses("favorites.html", auth.user, T)
def favorites():            #favorites page
    user = auth.get_user()
    if not user:
        redirect(URL("auth/login"))
    message = T("Your Favorite Recipes")
    return dict(message=message)

@action("admin") 
@action.uses("admin.html", auth.user, T)
def admin():                #admin page
    user = auth.get_user()
    if not user:
        redirect(URL("auth/login"))
    message = T("Hello, {username}").format(**user) if user else T("Hello")
    return dict(message=message)  


@action("profile") 
@action.uses("profile.html", auth.user, T, db)
def profile():              #user profile page
    user = auth.get_user()
    if not user:
        redirect(URL("auth/login"))
    
    # Get user's profile data from the user_profile table
    user_profile = db(db.user_profile.user_id == user["id"]).select().first()
    if not user_profile:
        # Create a default profile if it doesn't exist
        user_profile = dict(
            name="",
            bio="",
            profile_picture=""
        )
    
    return dict(
        user=user,
        user_profile=user_profile
    )

@action("profile/<username>") 
@action.uses("view_profile.html", auth.user, T, db)
def view_user_profile(username):
    user = auth.get_user()
    if not user:
        redirect(URL("auth/login"))
    
    # Get the target user by username
    target_user = db(db.auth_user.username == username).select().first()
    if not target_user:
        abort(404)
    
    # Get target user's profile data
    user_profile = db(db.user_profile.user_id == target_user.id).select().first()
    
    class ProfileData:
        def __init__(self, name="", bio="", profile_picture=""):
            self.name = name
            self.bio = bio
            self.profile_picture = profile_picture or f"https://api.dicebear.com/7.x/initials/svg?seed={username}&backgroundColor=ffdd57&fontFamily=Arial&fontSize=40"
    
    if not user_profile:
        profile_data = ProfileData()
    else:
        profile_data = ProfileData(
            name=user_profile.name or "",
            bio=user_profile.bio or "",
            profile_picture=user_profile.profile_picture or ""
        )
    
    # Get target user's recipe count
    recipe_count = db(db.recipe.author == username).count()
    
    return dict(
        current_user=user,
        target_user=target_user,
        user_profile=profile_data,
        recipe_count=recipe_count,
        is_own_profile=user["username"] == username
    )


# ----- Recipe form stuff ----- #

# These methods are used to access the recipe form with permissions    
# to create a recipe, edit mode is gives activates the template part of the page
# to view the page, edit mode is false so they can't edit it

@action("recipe") 
@action.uses("recipe.html", auth.user, T)
def create_recipe_form():        #create a new recipe
    user = auth.get_user()
    return dict(id=None, author=user["username"], edit_mode=True)

@action("recipe/<id:int>")
@action.uses("recipe.html", auth.user, db)
def view_recipe_form(id):
    user = auth.get_user()
    return dict(id=id, author=user["username"], edit_mode=False)

# ---- Pratyush - Automatically compute total calories & other nutritional data per ingredient ---- #

@action("api/recipe_calories/<recipe_id:int>", method="GET")
@action.uses(auth.user, db)
def get_recipe_calories(recipe_id):
    links = db(db.link.recipe_id == recipe_id).select()

    # the totals
    cals = chol = sodium = carbs = protein = 0

    for link in links:
        #skip any link with no valid id
        if not link.ingredient_id:
            continue

        ing = db.ingredient[link.ingredient_id]
        #skip if ingredient listing was deleted or missing
        if not ing:
            continue

        qty = link.quantity_per_serving or 0

        unit_cals = ing.calories_per_unit or 0
        unit_chol = ing.cholesterol or 0
        unit_sodium = ing.sodium or 0
        unit_carbs = ing.total_carbohydrate or 0
        unit_protein = ing.protein or 0

        cals += unit_cals * qty
        chol += unit_chol * qty
        sodium += unit_sodium * qty
        carbs += unit_carbs * qty
        protein += unit_protein * qty

    servings = (db.recipe[recipe_id].servings or 1)

    return dict(
        calories_per_serving = round(cals, 0),
        total_calories = round(cals * servings, 0),

        chol_per_serving = round(chol, 0),
        total_chol = round(chol * servings, 0),

        sodium_per_serving = round(sodium,  0),
        total_sodium = round(sodium * servings, 0),

        carbs_per_serving = round(carbs, 0),
        total_carbs = round(carbs * servings, 0),

        protein_per_serving = round(protein, 0),
        total_protein = round(protein * servings, 0),
    )

#-- Pratyush -- This was made before the additional nutritional data display, but causes no issues
@action("api/update_ingredient_calories", method="GET")
@action.uses(auth.user, db)
def update_ingredient_calories():
    # Update calories for existing ingredients, after ingredients have been created. Only effects the recipes IF additional information for the items was not listed. Covers basic ingredients.
    common_calories = {
        "chicken": 2.39, 
        "rice": 1.30, 
        "beef": 2.50, 
        "pasta": 1.31, 
        "egg": 1.55, 
        "milk": 0.42,
        "butter": 7.17, 
        "sugar": 3.87, 
        "flour": 3.64,
        "oil": 8.84, 
        "salt": 0, 
        "pepper": 2.51,
        "onion": 0.40, 
        "garlic": 1.49, 
        "tomato": 0.18,
        "cheese": 4.02, 
        "bread": 2.65, 
        "potato": 0.77
    }
    
    updated = 0
    for name, calories in common_calories.items():
        ingredients = db(db.ingredient.name.lower().contains(name)).select()
        for ing in ingredients:
            if ing.calories_per_unit == 0 or ing.calories_per_unit is None:
                ing.update_record(calories_per_unit=calories)
                updated += 1
    
    db.commit()
    return dict(message=f"Updated {updated} ingredients with calorie data", updated=updated)

# ----- db insertions  ----- #

@action("api/ingredients", method="POST")  
@action.uses(auth.user, db)
def add_ingredient():       #add ingredient
    req = request.json
    if "id" in req:
        del req["id"]
    # Check for duplicate (case-insensitive)
    name = req.get("name", "").strip().lower()
    existing = db(db.ingredient.name.lower() == name).select().first()
    if existing:
        return dict(errors={"name": "Ingredient already exists."}, id=existing.id)
    return db.ingredient.validate_and_insert(**req)

@action("api/recipes", method="POST") 
@action.uses(auth.user, db)
def add_recipe():           #add recipe
    req = request.json
    if "id" in req: #might not need this now since removed id in object constructor
        del req["id"] 
    return db.recipe.validate_and_insert(**req)

@action("api/links", method="POST")
@action.uses(auth.user, db)
def add_link():
    req = request.json
    return db.link.validate_and_insert(**req)


@action("api/profile", method="POST")
@action.uses(auth.user, db)
def update_profile():       #update user profile
    user = auth.get_user()
    req = request.json
    
    # Check if profile exists
    existing_profile = db(db.user_profile.user_id == user["id"]).select().first()
    
    if existing_profile:
        # Update existing profile
        db(db.user_profile.user_id == user["id"]).update(
            name=req.get("name", ""),
            bio=req.get("bio", ""),
            profile_picture=req.get("profile_picture", "")
        )
        return dict(success=True, message="Profile updated")
    else:
        # Create new profile
        profile_id = db.user_profile.insert(
            user_id=user["id"],
            name=req.get("name", ""),
            bio=req.get("bio", ""),
            profile_picture=req.get("profile_picture", "")
        )
        return dict(success=True, message="Profile created", id=profile_id)

@action("api/profile", method="GET")
@action.uses(auth.user, db)
def get_profile():          #get user profile data
    user = auth.get_user()
    profile = db(db.user_profile.user_id == user["id"]).select().first()
    
    if profile:
        return dict(profile=profile.as_dict())
    else:
        return dict(profile=dict(name="", bio="", profile_picture=""))

@action("api/profile/<username>", method="GET")
@action.uses(auth.user, db)
def get_profile_by_username(username):
    # Get the target user by username
    target_user = db(db.auth_user.username == username).select().first()
    if not target_user:
        return dict(error="User not found")
    
    # Get profile data
    profile = db(db.user_profile.user_id == target_user.id).select().first()
    
    # Get recipe count
    recipe_count = db(db.recipe.author == username).count()
    
    if profile:
        profile_data = profile.as_dict()
        if not profile_data.get("profile_picture"):
            profile_data["profile_picture"] = f"https://api.dicebear.com/7.x/initials/svg?seed={username}&backgroundColor=ffdd57&fontFamily=Arial&fontSize=40"
    else:
        profile_data = dict(
            name="", 
            bio="", 
            profile_picture=f"https://api.dicebear.com/7.x/initials/svg?seed={username}&backgroundColor=ffdd57&fontFamily=Arial&fontSize=40"
        )
    
    return dict(
        profile=profile_data,
        username=username,
        email=target_user.email,
        recipe_count=recipe_count
    )


# ---- get info ---- #
@action("api/recipe_by_id/<id:int>", method="GET")
@action.uses(auth.user, db)
def get_recipe_by_id(id):
    recipe = db.recipe[id]
    if not recipe:
        abort(404)
    return dict(recipe=recipe.as_dict())

@action("api/ingredient/<id:int>", method="GET")
@action.uses(auth.user, db)
def get_ingredient_by_id(id):
    ingredient = db.ingredient[id]
    if not ingredient:
        abort(404)
    return dict(ingredient=ingredient.as_dict())

@action("api/links_by_recipe/<recipe_id:int>")
@action.uses(db)
def links_by_recipe(recipe_id):
    return dict(links=db(db.link.recipe_id == recipe_id).select().as_list())

@action("api/recipes", method="GET") 
@action.uses(auth.user, db)
def get_info():           #get recipe and ingredient info
    user = auth.get_user()

    recipes = db(db.recipe).select().as_list()
    
    for recipe in recipes:
        author_user = db(db.auth_user.username == recipe["author"]).select().first()
        if author_user:
            author_profile = db(db.user_profile.user_id == author_user.id).select().first()
            if author_profile and author_profile.profile_picture:
                recipe["author_profile_picture"] = author_profile.profile_picture
            else:
                recipe["author_profile_picture"] = f"https://api.dicebear.com/7.x/initials/svg?seed={recipe['author']}&backgroundColor=ffdd57&fontFamily=Arial&fontSize=40"
        else:
            recipe["author_profile_picture"] = f"https://api.dicebear.com/7.x/initials/svg?seed={recipe['author']}&backgroundColor=ffdd57&fontFamily=Arial&fontSize=40"

    return dict(        #we should make seperate gets for these. ill do it later and update the code -cam
        username=user["username"],
        recipes=recipes,
        ingredients=db(db.ingredient).select().as_list(),    
        links=db(db.link).select().as_list()
    )

# ----- update and delete ---- #

@action("api/recipes/<id:int>", method="PUT")
@action.uses(auth.user, db)
def edit_recipe(id):
    user = auth.get_user()
    recipe = db.recipe[id]
    if recipe is None:
        abort(404)
    if recipe.author != user["username"]:
        abort(403)
    req = request.json
    if "id" in req:
        del req["id"] 
    return db.recipe.validate_and_update(id, **req)

@action("api/recipes/<id:int>", method="DELETE")
@action.uses(auth.user, db)
def delete_recipe(id):
    recipe = db.recipe[id]
    if recipe is None:
        abort(403)
    recipe.delete_record()
    return {}


# run once to import recipes TheMealDB
@action("api/import", method="GET")
@action.uses(db)
def import_recipes():
    alphabet = list(string.ascii_lowercase)
    for letter in alphabet:
        url = f"https://www.themealdb.com/api/json/v1/1/search.php?f={letter}"

        response = requests.get(url)
        data = response.json()

        meals = data.get("meals")
        if meals is None:
            continue

        for meal in meals:
            name = meal.get("strMeal")
            type = meal.get("strArea", "")
            author = "TheMealDB"
            instructions = meal.get("strInstructions", "")

            entry_exists = db((db.recipe.name == name) & (db.recipe.author == author)).select().first()
            if entry_exists:
                continue

            recipe_id = db.recipe.insert(
                name=name,
                type=type,
                author=author,
                instruction_steps=instructions,
                servings=1  
            )

            for i in range(1, 21):
                ingredient = (meal.get(f"strIngredient{i}") or "").strip()
                measurement = (meal.get(f"strMeasure{i}") or "").strip()

                if not ingredient:
                    continue

                existing = db(db.ingredient.name.lower() == ingredient.lower()).select().first()
                if existing:
                    ingredient_id = existing.id
                else:
                    ingredient_id = db.ingredient.insert(
                        name=ingredient,
                        unit=1.0,
                        calories_per_unit=None,
                        description="Imported from MealDB",
                        total_fat=None,
                        cholesterol=None,
                        sodium=None,
                        total_carbohydrate=None,
                        protein=None
                    )
                
                match = re.match(r"([\d/.]+)", measurement)
                if match:
                    # returns a real number e.g. "1/2" -> 0.5
                    quantity = eval(match.group(1))
                    unit = measurement[len(match.group(0)):].strip()
                else:
                    quantity = 1.0
                    unit = ""

                db.link.insert(
                    recipe_id=recipe_id,
                    ingredient_id=ingredient_id,
                    quantity_per_serving=quantity,
                    unit=unit
                )

    db.commit()
    return dict()

#m
@action("home")
@action.uses("home.html", auth.user, T, db)
def home():
    user = auth.get_user()
    message = T("Hello, {username}").format(**user) if user else T("Hello")
    
    # Get random featured recipes
    all_recipes = db(db.recipe).select().as_list()
    featured_recipes = []
    
    if all_recipes:
        # Get up to 3 random recipes
        num_featured = min(3, len(all_recipes))
        featured_recipes = random.sample(all_recipes, num_featured)
        
        # Add author profile pictures and check if author exists
        for recipe in featured_recipes:
            author_user = db(db.auth_user.username == recipe["author"]).select().first()
            recipe["author_exists"] = bool(author_user)  # Add flag to check if user exists
            
            if author_user:
                author_profile = db(db.user_profile.user_id == author_user.id).select().first()
                if author_profile and author_profile.profile_picture:
                    recipe["author_profile_picture"] = author_profile.profile_picture
                else:
                    recipe["author_profile_picture"] = f"https://api.dicebear.com/7.x/initials/svg?seed={recipe['author']}&backgroundColor=ffdd57&fontFamily=Arial&fontSize=40"
            else:
                # For non-user authors like TheMealDB, use a generic icon
                recipe["author_profile_picture"] = f"https://api.dicebear.com/7.x/initials/svg?seed={recipe['author']}&backgroundColor=cccccc&fontFamily=Arial&fontSize=40"
    
    return dict(
        message=message, 
        featured_recipes=featured_recipes,
        has_recipes=len(all_recipes) > 0
    )

@action("api/favorites", method=["GET"])
@action.uses(auth.user, db)
def get_favorites():
    """Get all favorites for the current user."""
    user_id = auth.user_id
    favorites = db(db.favorite.user_id == user_id).select().as_list()
    return dict(favorites=favorites)

@action("api/favorites/<recipe_id:int>", method=["POST"])
@action.uses(auth.user, db)
def add_favorite(recipe_id):
    """Add a recipe to user's favorites."""
    user_id = auth.user_id
    # Check if already favorited
    existing = db((db.favorite.user_id == user_id) & (db.favorite.recipe_id == recipe_id)).select().first()
    if existing:
        return dict(message="Recipe already in favorites")
    # Add new favorite
    db.favorite.insert(user_id=user_id, recipe_id=recipe_id)
    return dict(message="Recipe added to favorites")

@action("api/favorites/<recipe_id:int>", method=["DELETE"])
@action.uses(auth.user, db)
def remove_favorite(recipe_id):
    """Remove a recipe from user's favorites."""
    user_id = auth.user_id
    db((db.favorite.user_id == user_id) & (db.favorite.recipe_id == recipe_id)).delete()
    return dict(message="Recipe removed from favorites")

@action("api/recipe_image", method="POST")
@action.uses(auth.user, db)
def save_recipe_image():
    """Save a recipe image as base64 data."""
    user = auth.get_user()
    req = request.json
    recipe_id = req.get("recipe_id")
    image_data = req.get("image")
    
    if not recipe_id or not image_data:
        return dict(error="Missing recipe_id or image data")
    
    # Verify the recipe exists and user has permission
    recipe = db.recipe[recipe_id]
    if not recipe:
        return dict(error="Recipe not found")
    
    if recipe.author != user["username"]:
        return dict(error="Not authorized to add image for this recipe")
    
    # Insert the image with base64 data
    image_id = db.recipe_image.insert(
        recipe_id=recipe_id,
        image=image_data
    )
    
    return dict(success=True, id=image_id)

@action("api/recipe_images/<recipe_id:int>", method="GET")
@action.uses(auth.user, db)
def get_recipe_images(recipe_id):
    """Get all images for a recipe."""
    images = db(db.recipe_image.recipe_id == recipe_id).select().as_list()
    # Images are stored as base64, so they can be used directly
    return images