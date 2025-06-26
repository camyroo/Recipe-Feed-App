"""
This file defines the database models
"""

from pydal.validators import *
from .common import Field, db

#――――――――――――――――――――――――――――――
# 1) INGREDIENT TABLE (unchanged)
db.define_table(
    "ingredient",
    Field("name",               requires=IS_NOT_EMPTY()),
    Field("unit",      type='float'),
    Field("calories_per_unit",   type='float'),
    Field("description",        'text'),
    Field("total_fat",          type='integer'),
    Field("cholesterol",        type='integer'),
    Field("sodium",             type='integer'),
    Field("total_carbohydrate", type='integer'),
    Field("protein",            type='integer'),
)

#――――――――――――――――――――――――――――――
# 2) RECIPE TABLE
db.define_table(
    "recipe",
    Field("name",             requires=IS_NOT_EMPTY()),
    Field("type",             'text'),
    Field("description",      'text'),
    Field("author",           requires=IS_NOT_EMPTY()),
    Field("instruction_steps",'text'),
    Field("servings",         type='integer'),
)

#――――――――――――――――――――――――――――――
# 3) LINK TABLE (recipe ↔ ingredient)
db.define_table(
    "link",
    Field("recipe_id",             type="reference recipe"),
    Field("ingredient_id",         type="reference ingredient"),
    Field("quantity_per_serving",  type="float"),
    Field("unit",      type='text'),
)

#――――――――――――――――――――――――――――――
# 4) RECIPE_IMAGE TABLE (NEW: one row per image)
#    Each row links a recipe to a single uploaded file.
db.define_table(
    "recipe_image",
    Field("recipe_id", "reference recipe", requires=IS_IN_DB(db, "recipe.id")),
    Field("image",     "upload",            requires=IS_NOT_EMPTY()),
)

#――――――――――――――――――――――――――――――
# 5) FAVORITES TABLE (NEW: stores user's favorite recipes)
db.define_table(
    "favorite",
    Field("user_id", "reference auth_user", requires=IS_IN_DB(db, "auth_user.id")),
    Field("recipe_id", "reference recipe", requires=IS_IN_DB(db, "recipe.id")),
)

#――――――――――――――――――――――――――――――
# 6) Meal DB TABLE
db.define_table(
    "mealdb_data",
    Field("recipe_id", "reference recipe", requires=IS_IN_DB(db, "recipe.id")),
    Field("meal_id", "string"),  # TheMealDB's ID
    Field("image_url", "string"),
    Field("video_url", "string"),
    Field("area", "string"),  # Cuisine area
    Field("category", "string"),  # Meal category
)

# - User Profile Table
db.define_table(
    "user_profile",
    Field("user_id",         "reference auth_user", requires=IS_IN_DB(db, "auth_user.id")),
    Field("name",            'text'),
    Field("bio",             'text'),
    Field("profile_picture", 'upload'),
)


db.commit()

#――――――――――――――――――――――――――――――
# [Optional sample insertions can remain commented out below]
#
# from apps.Proj19.models import db
#
# db.ingredient.insert(
#     name="Milk",
#     unit=1.0,
#     calories_per_unit=4,
#     description="Cows made this"
# )

# db.recipe.insert(
#     name="chicken noodle",
#     description="this is pretty good",
#     author="cam",
#     servings=3
# )

# db.recipe.insert(
#     name="Test",
#     description="this was not made by anybody",
#     author="ghost",
#     servings=1
# )
# db.commit()