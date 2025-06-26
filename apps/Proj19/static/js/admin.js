"use strict";

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

let app = {};
app.empty_recipe = {
    // id: 0,
    name: "",
    type: "",
    description: "",
    // image: "",
    author: "",
    instruction_steps: "",
    servings: 0
};

app.empty_ingredient = {
    name: "",
    unit: null,
    calories_per_unit: null,
    description: "",
    cholesterol: null,
    sodium: null,
    total_carbohydrate: null,
    protein: null
};

app.config = {
    data: function () {
        return {
            error_message: "",
            new_recipe: clone(app.empty_recipe),
            recipes: [],

            new_ingredient: clone(app.empty_ingredient),
            ingredients: [],

            calorie_update_message: "",
        };
    },
    methods: {
        add_recipe: function () {
            if (this.new_recipe.name.length > 1) {
                let recipe = clone(this.new_recipe);
                this.recipes.push(recipe);
                this.new_recipe = clone(app.empty_recipe);

                fetch("/Proj19/api/recipes", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(recipe)
                })
                    .then(res => res.json())
                    .then(res => {
                        if (res.errors && Object.keys(res.errors).length > 0) {
                            this.error_message = JSON.stringify(res.errors);
                        }
                        else {
                            //console.log("recipe inserted");
                            recipe.id = res.id;
                        }
                    })
            }
        },
        update_calories: function() {
            fetch("/Proj19/api/update_ingredient_calories")
                .then(res => res.json())
                .then(data => {
                    this.calorie_update_message = data.message;
                    // Clear message after 5 seconds
                    setTimeout(() => {
                        this.calorie_update_message = "";
                    }, 5000);
                })
                .catch(error => {
                    this.calorie_update_message = "Error updating calories";
                });
        },
        
        add_ingredient() {
            if (this.new_ingredient.name.length > 1) {
                let ingredient = clone(this.new_ingredient);
                this.ingredients.push(ingredient);
                this.new_ingredient = clone(app.empty_ingredient);

                fetch("/Proj19/api/ingredients", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ingredient)
                })
                    .then(res => res.json())
                    .then(res => {
                        if (res.errors && Object.keys(res.errors).length > 0) {
                            this.error_message = JSON.stringify(res.errors);
                        } else {
                            ingredient.id = res.id;
                        }
                    });
            }
        },

        load: function () {
            fetch("/Proj19/api/recipes", {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
            })
                .then(res => res.json())
                .then(data => {
                    this.recipes = data.recipes;
                    this.ingredients = data.ingredients;
                });
        }
    }
};

app.vue = Vue.createApp(app.config).mount("#app");
app.vue.load(); 
