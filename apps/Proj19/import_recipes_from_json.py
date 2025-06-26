import json
import re

def import_recipes(db, file):
    with open(file) as f:
        meals = json.load(f)['meals']
        for meal in meals:
            name = meal['strMeal'] if meal['strMeal'] else 'None'
            type = meal['strArea'] if meal['strArea'] else 'None'
            category = meal['strCategory']
            tags = meal['strTags']
            youtube = meal['strYoutube']
            description = ""
            if category:
                description += category + ", "
            if tags:
                description += tags + ", "
            if youtube:
                description += youtube + ", "
            if len(description) > 0:
                description = description[:-2]
            author = "TheMealDB"
            instruction_steps = meal['strInstructions'] if meal['strInstructions'] else 'None'
            servings = 1

            entry_exists = db((db.recipe.name == name) & (db.recipe.author == author)).select().first()
            if entry_exists:
                continue

            recipe_id = db.recipe.insert(name=name, type=type, description=description, author=author, instruction_steps=instruction_steps, servings=servings)

            for i in range(1, 21):
                ingredient = meal['strIngredient' + str(i)]
                measurement = meal['strMeasure' + str(i)]

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
